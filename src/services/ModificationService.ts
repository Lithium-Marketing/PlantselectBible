import {BaseService} from "@/helper/baseService";
import {Services, TableConfig, TableConfigs, TablesDef} from "@/services/index";
import {computed, ComputedRef, reactive, Ref, ref, triggerRef, unref, watch} from "vue";
import {now} from "moment";
import {persistentStorage} from "@/helper/PersistentStorage";
import {LogService} from "@/services/logService";

const logger = LogService.logger({name: "ModificationService"})

interface ModVal {
    val: any,
    desc: string
}

export interface Mod<T> extends ModVal {
    table: T,
    id: number,
    field: string
}

export class ModificationService<T extends TablesDef, C extends TableConfigs<T>> extends BaseService<T, C> {
    public readonly mods: Record<keyof T, Record<number, Record<string, ModVal>>>;
    public readonly creations: Record<keyof T, Record<number, ModVal>>;
    
    constructor(s: Services<T, C>, tables: C) {
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
     * @param id
     * @param field
     * @param val
     * @param desc
     *
     * @return the id used
     */
    set<K extends keyof T>(tableName: K, id: number, field: keyof T[K], val: any, desc: string): number {
        logger.trace("set", tableName, field, val, desc);
        const table = this.mods[tableName];
        
        if (!table[id])
            table[id] = {};
        
        table[id] = {
            ...table[id],
            [field]: {val, desc}
        };
        
        return id;
    }
    
    get(tableName: keyof T, id: number) {
        const table = this.mods[tableName];
        return computed(() => {
            return table[id] || {};
        });
    }
    
    create<K extends keyof T>(tableName: K, fields: Partial<T[K]>, desc: string) {
        logger.trace("create", tableName, fields, desc);
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
        } else
            delete table[id]?.[field];
    }
}
