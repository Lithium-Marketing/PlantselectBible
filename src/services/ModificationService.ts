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

export interface Mod<T> {
    table: T,
    id: number,
    field: string,
    mod: ModVal
}

export class ModificationService<T extends Record<string, TableConfig>> extends BaseService<T> {
    private readonly mods: Record<keyof T, Record<number, Record<string, ModVal>>>;
    private readonly _list: ComputedRef<Mod<keyof T>[]>;
    
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
        
        this._list = computed(() => {
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
    
    asList(): ComputedRef<Mod<keyof T>[]> {
        return this._list;
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
    set(tableName: keyof T, id: number | false, field: string, val: any, desc: string): number {
        const table = this.mods[tableName];
        
        if (id === false)
            id = -now();
        
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
    
    remove(tableName: keyof T, id: number, field: string | false): void {
        const table = this.mods[tableName];
        
        if (field === false)
            table[id] = {}; else
            delete table[id][field];
    }
}
