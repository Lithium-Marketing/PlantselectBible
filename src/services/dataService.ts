import {Services} from "@/services/index";
import {persistentStorage} from "@/helper/PersistentStorage";
import {computed, ComputedRef, reactive, Ref, ref, watchEffect, WritableComputedRef} from "vue";
import {createPool, Pool, PoolOptions, RowDataPacket} from "mysql2/promise";
import {BaseService} from "@/helper/baseService";

export class DataService<T extends string> extends BaseService {
    private mysqlLogin: WritableComputedRef<PoolOptions>;
    private conn: Pool;
    private readonly tablesName: readonly string[];
    private readonly tablesRaw: Record<T, WritableComputedRef<any[]>>;
    private readonly tables: Record<T, ComputedRef<Record<number, any>>>;
    
    constructor(services: Services, tables: readonly T[]) {
        super(services);
        
        this.mysqlLogin = persistentStorage<PoolOptions>("mysqlLogin", {});
        watchEffect(() => {
            this.conn = createPool(this.mysqlLogin.value);
        });
        
        this.tablesName = tables;
    
        this.tablesRaw = this._initRawDatas();
        this.tables = this._initDatas();
    }
    
    private _initRawDatas(): Record<T, WritableComputedRef<any[]>> {
        const datas = {}
        for (const table of this.tablesName) {
            datas[table] = persistentStorage("table:"+table,{});
        }
        return datas as Record<T, WritableComputedRef<any[]>>;
    }
    
    private _initDatas(): Record<T, ComputedRef<Record<number, any>>> {
        const datas = {}
        for (const table of this.tablesName) {
            datas[table] = computed(()=>{
                const result = this.tablesRaw[table].value;
                const obj = {};
                for (let i = 0; i < result.length; i++) {
                    const id = result[i].ID ?? result[i].id;
                    // @ts-ignore //TODO remove ts-ignore
                    const mods = this.services.modification.get(table, id);
        
                    obj[id] = computed(() => {
                        const entity = Object.assign({}, result[i]);
                        Object.entries(entity).forEach(([field,val])=>{
                            entity["$"+field] = entity[field];
                            if(mods.value[field]!==undefined)
                                entity[field] = mods.value[field].val;
                        });
                        return Object.freeze(entity);
                    });
                }
                return obj;
            });
        }
        return datas as Record<T, ComputedRef<Record<number, any>>>;
    }
    
    refresh(table: T | true = true) {
        for (const table of this.tablesName) {
            this.services.job.add((async () => {
                const sql = `SELECT *
				             FROM ${table}`;
                const result = (await this.conn.execute(sql))[0] as any[];
                
                this.tablesRaw[table].value = result;
                
                console.log(table, result.length);
            })(), "Downloading data from " + table)
        }
    }
    
    get(table: T, id: number): ComputedRef<any>;
    get(table: T): ComputedRef<Record<number, ComputedRef<any>>>;
    
    get(table: T, id?: number) {
        if (id !== undefined)
            return computed(()=>this.tables[table].value[id]?.value); else
            return this.tables[table];
    }
    
    
}

function sleep(time:number){
    return new Promise(resolve => setTimeout(resolve,time));
}
