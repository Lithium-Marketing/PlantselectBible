import {Services} from "@/services/index";
import {persistentStorage} from "@/helper/PersistentStorage";
import {computed, ComputedRef, watchEffect, WritableComputedRef} from "vue";
import {createPool, Pool, PoolOptions, RowDataPacket} from "mysql2/promise";
import {BaseService} from "@/helper/baseService";
import {LogService} from "@/services/logService";

const logger = LogService.logger({name: "DataService"})

export interface TableConfig {
    indexes?: readonly string[],
    sql?: string,
    key?: string
}

type IndexesByTable<T extends Record<string, TableConfig>> = {
    [name in keyof T]: {
        [index in T[name]["indexes"][number]]: ComputedRef<Record<number, number[] | undefined>>
    }
}

export interface SchemaField<K extends string> {
    Field: K
    Type: string
    Null: boolean,
    Key: string,
    Default: any | null | undefined,
    Extra: string
}

export type Schema = {
    [key: string]: SchemaField<typeof key>
}

export class DataService<T extends Record<string, TableConfig>> extends BaseService<T> {
    public readonly mysqlLogin: WritableComputedRef<PoolOptions>;
    private conn: Pool;
    
    private readonly tablesName: string[];
    private readonly tablesConfig: T;
    
    public readonly raw: { [table in keyof T]: WritableComputedRef<Record<number, any>> };
    public readonly tables: {[table in keyof T]: ComputedRef<Record<number, any>>};
    
    
    //private readonly tablesRaw: Record<keyof T, WritableComputedRef<any[]>>;
    private readonly tablesSchema: Record<keyof T, WritableComputedRef<Schema>>;
    private readonly indexesByTable: IndexesByTable<T>;//TODO add reactivity
    
    private readonly tableDefault: ComputedRef<Record<keyof T, any>>;
    
    constructor(services: Services<T>, tables: T) {
        super(services);
        
        this.mysqlLogin = persistentStorage<PoolOptions>("mysqlLogin", {});
        watchEffect(() => {
            this.conn = createPool(this.mysqlLogin.value);
        });
        
        this.tablesName = Object.keys(tables);
        this.tablesConfig = tables;
        
        this.raw = Object.keys(tables).reduce((a, t) => {
            const cache = persistentStorage("raw:" + t, {});
            a[t as keyof T] = computed({
                get() {
                    return cache.value;
                },
                set(val) {
                    cache.value = val;
                }
            });
            return a;
        }, {} as Record<keyof T, WritableComputedRef<Record<number, any>>>);
        
        this.tables = Object.keys(tables).reduce((a,table)=>{
            a[table as keyof T] = computed(() => {//add all modifications to all rows of the table (heavy)
                const result = {};
        
                for (const id in this.raw[table].value) {
                    if (this.services.modification.mods[table][id]) {
                        const obj = result[id] = {...this.raw[table].value[id]};
                        Object.entries(this.services.modification.mods[table][id]).forEach(([key, value]) => {
                            obj[key] = value.val;
                        });
                        Object.freeze(obj);
                    }else
                        result[id] = this.raw[table].value[id];
                }
        
                for (const id in this.services.modification.creations[table]) {
                    if (result[id])
                        logger.error("creation overlap with existing id", id)
                    result[id] = this.services.modification.creations[table][id].val;
                }
        
                return result;
            });
            return a;
        },{} as Record<keyof T, ComputedRef<Record<number, any>>>)
        
        //this.tablesRaw = this._initRawDatas();
        this.tablesSchema = this._initSchema();
        this.indexesByTable = Object.keys(tables).reduce((a, t) => {
            const table = t as keyof T;
            a[t] = {};
            this.tablesConfig[table].indexes?.forEach(index => {
                console.log(table, index);
                a[t][index] = computed(() => {
                    console.time(`index ${table} . ${index}`);
                    try {
                        const tableData = this.raw[table].value;
                        return Object.entries(tableData).reduce((a, [id,entity]) => {
                            a[entity[index]] = a[entity[index]] || [];
                            a[entity[index]].push(entity.ID ?? entity.id);
                            return a;
                        }, {})
                    } finally {
                        console.timeEnd(`index ${table} . ${index}`)
                    }
                })
            });
            return a;
        }, {}) as IndexesByTable<T>;
        
        
        this.tableDefault = computed(() => {
            return Object.entries(this.tablesSchema).reduce((a, v) => {
                a[v[0] as keyof T] = Object.values(v[1].value).reduce((a, v) => {
                    a[v.Field] = v.Default;
                    return a;
                }, {} as any)
                return a;
            }, {} as Record<keyof T, any>);
        })
    }
    
    private _initSchema() {
        const datas = {}
        for (const table of this.tablesName) {
            datas[table] = persistentStorage("schema:" + table, {});
        }
        return datas as Record<keyof T, WritableComputedRef<Schema>>;
    }
    
    refresh(table: T | true = true) {
        for (const table of this.tablesName) {
            this.services.job.add((async () => {
                this.tablesSchema[table].value = await this.refreshSchema(table);
                
                const sql = this.tablesConfig[table].sql ?? `SELECT *
				                                             FROM ${table}`;
                logger.log(table,this.tablesConfig[table])
                const result = ((await this.conn.execute(sql))[0] as any[]).reduce((a, v) => {
                    a[v[this.tablesConfig[table].key ?? "ID"]] = v;
                    return a;
                }, {});
                
                this.raw[table as keyof T].value = result;
                
                logger.log(table, Object.entries(result).length);
            })(), "Downloading data from " + table)
        }
    }
    
    private async refreshSchema(table: keyof T) {
        const sql = `show columns from ${table}`;
        const result = (await this.conn.execute(sql))[0] as RowDataPacket[];
        
        return result.reduce((a, v) => {
            a[v.Field] = {
                ...v,
                Field: v.Field,
                Null: v.Null === 'yes',
                Type: v.Type,
                Key: v.Key,
                Default: v.Default,
                Extra: v.Extra
            };
            return a;
        }, {} as Schema);
    }
    
    getSchema(table: T) {
        return computed(() => {
            return this.tablesSchema[table as any].value;
        })
    }
    
    get(table: keyof T, id: number, field:string): WritableComputedRef<any>;
    get(table: keyof T, id: number): ComputedRef<any>;
    get(table: keyof T): ComputedRef<Record<number, any>>;
    
    get(table: keyof T, id?: number, field?:string) {
        if(field !==undefined)
            return computed({
                get(){
                    return this.services.modification.mods[table]?.[id]?.[field] ?? this.raw[table][id][field];
                },
                set(val){
                    this.services.modification.set(table,id,field,val,"auto");
                }
            });
        if (id !== undefined)
            if (id >= 0)
                return computed(() => {//add modification to the row of the table
                    const obj = {...this.raw[table][id]};
                    if (this.services.modification.mods[table][id])
                        Object.entries(this.services.modification.mods[table][id]).forEach(([key, value]) => {
                            obj[key] = value.val;
                        });
                    return obj;
                });
            else
                return computed(() => {//return created row
                    return this.services.modification.creations[table][id]?.val;
                });
        else
            return this.tables[table];
    }
    
    getByIndex<K extends keyof T>(table: K, index: keyof IndexesByTable<T>[K], id: number): ComputedRef<number[] | undefined>;
    getByIndex<K extends keyof T>(table: K, index: keyof IndexesByTable<T>[K]): ComputedRef<Record<number, number[] | undefined>>;
    
    getByIndex<K extends keyof T>(table: K, index: keyof IndexesByTable<T>[K], id?: number) {
        if (id !== undefined)
            return computed(() => this.indexesByTable[table][index].value[id]); else
            return computed(() => this.indexesByTable[table][index].value || {});
    }
}

function sleep(time: number) {
    return new Promise(resolve => setTimeout(resolve, time));
}
