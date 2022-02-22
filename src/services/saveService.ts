import {Schema, SchemaField} from "@/services/dataService";
import {format} from 'sql-formatter';
import {LogService} from "@/services/logService";
import {Services, TableConfig, TableConfigs, TablesDef} from "@/services/index";
import {now} from "moment";
import {RowDataPacket} from "mysql2/promise";

const logger = LogService.logger({name: "SaveService"});

export class SaveService<T extends TablesDef, C extends TableConfigs<T>>{
    private readonly services: Services<T, C, any>;
    
    constructor(services: Services<T, C, any>) {
        this.services = services;
    }
    
    public async apply(dry: boolean = true) {
        const sqls = [];
        const mods = this.services.modification.mods;
        
        for (const table in this.services.tables) {
            const schema = this.services.data.getSchema(table as any).value;
            const keys = Object.keys(schema).filter(k => schema[k].Key !== "PRI");
            
            const values = [];
            
            Object.entries(mods[table]).forEach(([id, val]) => {
                if (parseInt(id) >= 0) {//Modification
                    const vals = keys.map(k => {
                        if (val[k] !== undefined || k === "Date_Modification")
                            return `${k}=${quote(val[k], schema[k])}`;
                    }).filter(s => !!s);
                    sqls.push(`UPDATE ${table}
					           SET ${vals.join(",")}
					           WHERE
						           ID = ${id}`);
                } else {//Creation
                    const vals = keys.map(k => quote(val[k], schema[k], true));
                    if (!val["Prix_ID"])
                        console.log(id, val);
                    values.push(`(${vals.join(",")})`);
                }
            })
            
            if (values.length) {
                let sql = `INSERT INTO ${table} (
					${keys.join(",")}
				                                )
				           VALUES ${values.join(',')}`;
                sqls.push(sql);
            }
        }
    
        if(!dry){
            const conn = await this.services.data.conn.getConnection();
            try {
                await conn.beginTransaction();
            
                await conn.execute(sqls.reduce((a, v) => {
                    return a + v + ";";
                }));
            
                await conn.commit()
            } catch (e) {
                if (conn) await conn.rollback();
                logger.error(e);
            } finally {
                if (conn) await conn.release();
            }
        }
        
        return sqls;
    }
    
    public async createSave(name: string) {
        const conn = await this.services.data.conn.getConnection();
        await conn.execute("INSERT INTO bible_saves (Name,Data,Version) VALUE (:name,:data,:version)", {
            name,
            version: 1,
            data: this.services.modification.toJSON()
        });
    }
    
    public async loadSave(name: string) {
        const conn = await this.services.data.conn.getConnection();
        const [rows, metas] = await conn.query("SELECT * FROM bible_saves WHERE Version=1 AND Name=:name", {name});
        if (Array.isArray(rows) && rows.length === 1) {
            const row = rows[0] as RowDataPacket;
            return this.services.modification.fromJSON(row.Data);
        }
        throw new Error("Could not load save")
    }
    
    public async getSaves(): Promise<{ ID: number, Name: string, Data: string, Version: number, Date: Date }[]> {
        const conn = await this.services.data.conn.getConnection();
        const [rows, metas] = await conn.query("SELECT * FROM bible_saves WHERE Version=1 ORDER BY Date DESC");
        if (Array.isArray(rows)) {
            return rows as any;
        }
        throw new Error("Could not load save")
    }
    
    public async delSave(id: number) {
        const conn = await this.services.data.conn.getConnection();
        await conn.execute("DELETE FROM bible_saves WHERE ID=:id AND Version=1", {
            id
        });
    }
    
}

function quote(v: any, def: SchemaField<any>, creation: boolean = false) {
    if (def.Field === "Date" && (creation || v === undefined))
        return Math.floor(now() / 1000);
    if (def.Field === "Date_Modification")
        return Math.floor(now() / 1000);
    
    const type = def.Type.split("(")[0];
    switch (type) {
        case "bigint":
        case "int":
            return v ? parseInt(v) : def.Default;
        case "decimal":
            return v ? parseFloat(v) : def.Default;
        case "text":
            return v ? `"${v?.toString()}"` : 'NULL';
        default:
            throw new Error("Field type not supported");
    }
}
