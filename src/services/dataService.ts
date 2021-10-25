import {Services} from "@/services/index";
import {persistentStorage} from "@/helper/PersistentStorage";
import {computed, ComputedRef, reactive, Ref, ref, watchEffect, WritableComputedRef} from "vue";
import {createPool, Pool, PoolOptions, RowDataPacket} from "mysql2/promise";
import {BaseService} from "@/helper/baseService";
import {loadWhenIdle} from "@/helper/JobHelper";

export interface TableConfig {
    indexes?: readonly string[]
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
    
    private readonly tablesRaw: Record<keyof T, WritableComputedRef<any[]>>;
    private readonly tablesSchema: Record<keyof T, WritableComputedRef<Schema>>;
    private readonly indexesByTable: IndexesByTable<T>;//TODO add reactivity
    private readonly tables: Record<keyof T, ComputedRef<Record<number, ComputedRef<any>>>>;
    private readonly tableDefault: ComputedRef<Record<keyof T, any>>;
    
    constructor(services: Services<T>, tables: T) {
        super(services);
        
        this.mysqlLogin = persistentStorage<PoolOptions>("mysqlLogin", {});
        watchEffect(() => {
            this.conn = createPool(this.mysqlLogin.value);
        });
        
        this.tablesName = Object.keys(tables);
        this.tablesConfig = tables;
        
        this.tablesRaw = this._initRawDatas();
        this.tablesSchema = this._initSchema();
        this.indexesByTable = Object.keys(tables).reduce((a, t) => {
            a[t] = {};
            return a;
        }, {}) as IndexesByTable<T>;
        this.tables = this._initDatas();
        
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
    
    private _initRawDatas(): Record<keyof T, WritableComputedRef<any[]>> {
        const datas = {}
        for (const table of this.tablesName) {
            datas[table] = persistentStorage("table:" + table, {});
        }
        return datas as Record<keyof T, WritableComputedRef<any[]>>;
    }
    
    private _initDatas(): Record<keyof T, ComputedRef<Record<number, any>>> {
        const datas = {}
        for (const table of this.tablesName) {
            datas[table] = computed(() => {
                console.time(`table ${table}`);
                try {
                    const result = this.tablesRaw[table].value;
                    const obj = {};
                    for (let i = 0; i < result.length; i++) {
                        const id = result[i].ID ?? result[i].id;
                        
                        // @ts-ignore //TODO remove ts-ignore
                        const mods = this.services.modification.get(table, id);
                        obj[id] = computed(() => {
                            const entity = Object.assign({}, result[i]);
                            Object.entries(entity).forEach(([field, val]) => {
                                entity["$" + field] = entity[field];
                                if (mods.value[field] !== undefined)
                                    entity[field] = mods.value[field].val;
                            });
                            return Object.freeze(entity);
                        });
                    }
                    
                    const creations = this.services.modification.asListCreation(table).value;
                    Object.entries(creations).forEach(([id, mod]) => {
                        const mods = this.services.modification.get(table, id as unknown as number);
                        obj[id] = computed(() => {
                            const entity = Object.assign({}, this.tableDefault.value[table] ,mod.val);
                            Object.entries(entity).forEach(([field, val]) => {
                                entity["$" + field] = entity[field];
                                if (mods.value[field] !== undefined)
                                    entity[field] = mods.value[field].val;
                            });
                            return Object.freeze(entity);
                        });
                    });
                    
                    return obj;
                } finally {
                    console.timeEnd(`table ${table}`)
                }
            });
            
            this.tablesConfig[table].indexes?.forEach(index => {
                console.log(table, index);
                this.indexesByTable[table][index] = computed(() => {
                    console.time(`index ${table} . ${index}`);
                    try {
                        const tableData = this.tablesRaw[table].value;
                        return tableData.reduce((a, entity) => {
                            a[entity[index]] = a[entity[index]] || [];
                            a[entity[index]].push(entity.ID ?? entity.id);
                            return a;
                        }, {})
                    } finally {
                        console.timeEnd(`index ${table} . ${index}`)
                    }
                });
                
                loadWhenIdle(this.indexesByTable[table][index], `index ${table} ${index}`);
            });
            
            loadWhenIdle(datas[table], `table ${table}`);
        }
        return datas as Record<keyof T, ComputedRef<Record<number, any>>>;
    }
    
    refresh(table: T | true = true) {
        for (const table of this.tablesName) {
            this.services.job.add((async () => {
                this.tablesSchema[table].value = await this.refreshSchema(table);
                
                const sql = `SELECT *
				             FROM ${table}`;
                const result = (await this.conn.execute(sql))[0] as any[];
                
                this.tablesRaw[table].value = result;
                
                console.log(table, result.length);
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
    
    get(table: keyof T, id: number): ComputedRef<any>;
    get(table: keyof T): ComputedRef<Record<number, ComputedRef<any>>>;
    
    get(table: keyof T, id?: number) {
        if (id !== undefined)
            return computed(() => this.tables[table].value[id]?.value); else
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
