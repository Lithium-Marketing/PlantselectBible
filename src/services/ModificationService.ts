import {BaseService} from "@/helper/baseService";
import {Services} from "@/services/index";
import {computed, ComputedRef, reactive, Ref, ref, unref, watch} from "vue";
import {now} from "moment";
import {persistentStorage} from "@/helper/PersistentStorage";
import {TableConfig} from "@/services/dataService";

interface ModVal {
    val: any,
    desc: string
}

export interface Mod<T> extends ModVal{
    table: T,
    id: number,
    field: string
}

export class ModificationService<T extends Record<string, TableConfig>> extends BaseService<T> {
    private readonly mods: Record<keyof T, Record<number, Record<string, ModVal>>>;
    private readonly creations: Record<keyof T, Record<number, ModVal>>;
    
    constructor(s: Services<T>, tables: T) {
        super(s);
        this.mods = Object.keys(tables).reduce((a, t) => {
            const cache = persistentStorage("mod:" + t, {});
            a[t as keyof T] = reactive<Record<number, Record<string, any>>>({...cache.value});
            watch(a[t], function saveToPersistentStorage() {
                cache.value = (a[t]);
            }, {
                deep: true,
                flush: "post"
            })
            return a;
        }, {} as Record<keyof T, Record<number, Record<string, any>>>);
        
        this.creations = Object.keys(tables).reduce((a, t) => {
            const cache = persistentStorage("modc:" + t, {});
            a[t as keyof T] = reactive<Record<number, ModVal>>({...cache.value});
            watch(a[t], function saveToPersistentStorage() {
                cache.value = (a[t]);
            }, {
                deep: true,
                flush: "post"
            })
            return a;
        }, {} as Record<keyof T, Record<number, ModVal>>);
    }
    
    asListMod(): ComputedRef<Mod<keyof T>[]> {
        return computed(() => {
            return Object.entries<Record<number, Record<string, ModVal>>>(this.mods).reduce((a, [table, entities]) => {
                Object.entries(entities).forEach(([id, fields]) => {
                    Object.entries(fields).forEach(([field, mod]) => {
                        a.push({table, id, field, ...mod});
                    })
                })
                return a;
            }, [])
        });
    }
    
    asListCreation(table: keyof T): ComputedRef<Record<number, ModVal>> {
        return computed(() => {
            return Object.entries(this.creations[table]).reduce((a, [id, mod]) => {
                a[id as unknown as number] = {
                    ...mod
                }
                return a;
            }, {} as Record<number, ModVal>)
        });
    }
    
    /**
     *
     * @param tableName
     * @param id if false, a new id will be created
     * @param field
     * @param val
     * @param desc
     *
     * @return the id used
     */
    set(tableName: keyof T, id: number, field: string, val: any, desc: string): number {
        const table = this.mods[tableName];
        
        if (!table[id])
            table[id] = {};
        
        table[id][field] = {val, desc};
        
        return id;
    }
    
    get(tableName: keyof T, id: number) {
        const table = this.mods[tableName];
        return computed(() => {
            return table[id] || {};
        });
    }
    
    create(tableName: keyof T, fields: any, desc: string) {
        const id = -now();
        
        //TODO validate with schema
        this.creations[tableName][id] = {val: fields, desc};
        
        return id;
    }
    
    remove(tableName: keyof T, id: number, field: string | false): void {
        const table = this.mods[tableName];
        const creat = this.creations[tableName];
    
        if (field === false) {
            table[id] = {};
            delete creat[id];
        }else
            delete table[id]?.[field];
    }
}
