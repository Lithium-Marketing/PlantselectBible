import {BaseService} from "@/helper/baseService";
import {Services, TableConfig, TableConfigs, TablesDef} from "@/services/index";
import {computed, ComputedRef, reactive, Ref, ref, triggerRef, unref, watch, watchEffect} from "vue";
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

type ModDict<T extends TablesDef> = {
    [table in keyof T]: Record<number, Partial<Record<keyof T[table], any>>>
}

export type ModificationFn<S, T extends TablesDef> = (payload: any, services: S) => {
    id: string,
    mods: Partial<ModDict<T>>
};

export type ToModifications<S extends Services<any, any, any>, T extends TablesDef, M extends Record<string, ModificationFn<S, T>>> = {
    [name in keyof M]: Parameters<M[name]>[0];
}

type RawMod<M, N extends keyof M> = {
    name: N,
    desc: string,
    payload: M[N],
    result?: ReturnType<ModificationFn<any, any>>
}

export class ModificationService<T extends TablesDef, C extends TableConfigs<T>, M> extends BaseService<T, C, M> {
    public readonly mods: ModDict<T>;
    public readonly creations: Record<keyof T, Record<number, ModVal>>;
    
    public readonly raw: { [id: string]: RawMod<M, keyof M> }
    
    private readonly modifications: Record<keyof M, ModificationFn<Services<T, C, M>, T>>;
    
    constructor(s: Services<T, C, M>, tables: C, modifications: Record<keyof M, ModificationFn<Services<T, C, M>, T>>) {
        super(s);
        this.modifications = modifications;
        
        const rawStorage = persistentStorage("modRaw", {});
        this.raw = reactive(rawStorage.value);
        watch(this.raw, () => {
            rawStorage.value = this.raw;
        }, {
            deep: true
        })
        
        this.mods = reactive(Object.keys(tables).reduce((a, t) => {
            a[t] = {};
            return a;
        }, {})) as ModDict<T>;
        
        this.creations = reactive(Object.keys(tables).reduce((a, t) => {
            a[t] = {};
            return a;
        }, {})) as Record<keyof T, Record<number, ModVal>>;
        
        this.reapply();
        
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
    
    mod<K extends keyof M>(modName: K, payload: M[K], desc: string) {
        logger.trace("mod", modName, payload, desc);
        
        const result = this.modifications[modName](payload, this.services);
        
        if (this.raw[result.id])
            this.unapply(result);
        
        this.apply(result);
        
        this.raw[result.id] = {
            payload: payload,
            name: modName,
            desc,
            result
        };
        
        //
        // const raw = this.services.data.raw[tableName].value[id];
        // this.mods[tableName];
        // this.creations[tableName];
        // //this._tables[tableName]; //TODO mod Date if standard
        //
    }
    
    remove<K extends keyof T>(modId: string) {
        this.unapply(this.raw[modId].result);
        delete this.raw[modId];
    }
    
    private apply(result: ReturnType<ModificationFn<any, T>>) {
        for (const table in result.mods) {
            const mappedIds: Record<number, number> = {};
            
            for (const id in result.mods[table]) {
                const mappedId = (id < 0 ? -now() : id) as Extract<keyof ModDict<T>[Extract<keyof T, string>], string>;
                if (id < 0)
                    mappedIds[id] = mappedId as number;
                for (const field in result.mods[table][id]) {
                    this.mods[table][mappedId] = {
                        ...this.mods[table][mappedId],
                        [field]: result.mods[table][id][field]
                    }
                }
            }
            
            Object.entries(mappedIds).forEach(([id, mapped]) => {
                result.mods[table][mapped] = result.mods[table][id];
                delete result.mods[table][id];
            })
        }
    }
    
    private unapply(result: ReturnType<ModificationFn<any, T>>) {
        for (const table in result.mods) {
            for (const id in result.mods[table]) {
                for (const field in result.mods[table][id]) {
                    this.mods[table][id] = {
                        ...this.mods[table][id]
                    };
                    delete this.mods[table][id][field];
                }
            }
        }
    }
    
    public reapply() {
        Object.keys(this._tables).forEach(table => {
            this.mods[table as keyof T] = {};
            this.creations[table as keyof T] = {};
        });
        
        Object.values(this.raw).forEach(r => this.apply(r.result));
    }
}
