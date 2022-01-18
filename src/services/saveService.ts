import {BaseService} from "@/helper/baseService";
import {Schema, SchemaField, TableConfig} from "@/services/dataService";
import {Mod} from "@/services/ModificationService";
import {format} from 'sql-formatter';
import {LogService} from "@/services/logService";

const logger = LogService.logger({name: "SaveService"});

export class SaveService<T extends Record<string, TableConfig>> extends BaseService<T> {
    
    public apply() {
        const sqls = [];
        const modsByTableById: Record<any, Record<number, Mod<keyof T>[]>> = {};
        const mods = this.services.modification.asListMod();
        mods.value.forEach(mod => {
            modsByTableById[mod.table] = modsByTableById[mod.table] || {};
            modsByTableById[mod.table][mod.id] = modsByTableById[mod.table][mod.id] || [];
            modsByTableById[mod.table][mod.id].push(mod);
        });
        
        for (const table in this._tables) {
            const schema = this.services.data.getSchema(table as any).value;
            const keys = Object.keys(schema).filter(k => schema[k].Key !== "PRI");
            
            const creations = this.services.modification.asListCreation(table as any).value;
            const modsById = modsByTableById[table] || {};
            
            if (Object.values(creations).length) {
                const values = [];
                Object.entries(creations).forEach(([id, {val: entity, desc}]) => {
                    const mods = modsById[parseInt(id)]?.reduce((a, v) => {
                        a[v.field] = v.val;
                        return a;
                    }, {} as any);
                    const vals = keys.map(k => {
                        const def = schema[k];
                        const v = (mods && k in mods) ? mods[k] : entity[k];
                        return quote(v, def);
                    });
                    values.push(`(${vals.join(",")})`);
                });
                let sql = `
					INSERT INTO ${table} (
						${keys.join(",")}
					                     )
					VALUES ${values.join(',\n')}`;
                sqls.push(sql);
            }
            
            if (Object.values(modsById).length) {
                Object.entries(modsById).forEach(([id, mods]) => {
                    if (parseInt(id) < 0)
                        return;
                    
                    let sql = `UPDATE ${table}
					           SET `;
                    
                    mods.forEach(mod => {
                        const val = quote(mod.val, schema[mod.field]);
                        sql += `${mod.field}=${val} `;
                    })
                    
                    sql += `WHERE ID=${id}`;//TODO replace -id by created id
                    sqls.push(sql);
                });
            }
        }
        
        logger.log(format(sqls.reduce((a, v) => {
            return a + v + ";";
        }, ""), {
            linesBetweenQueries: 3,
            uppercase: true
        }));
    }
    
}

function quote(v: any, def: SchemaField<any>) {
    const type = def.Type.split("(")[0];
    switch (type) {
        case "bigint":
        case "int":
            return v ? parseInt(v) : def.Default;
        case "decimal":
            return v ? parseFloat(v) : def.Default;
        case "text":
        default:
            return v ? `"${v?.toString()}"` : 'NULL';
    }
}
