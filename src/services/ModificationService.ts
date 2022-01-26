import {BaseService} from "@/helper/baseService";
import {Services, TableConfig, TableConfigs, TablesDef} from "@/services/index";
import {computed, ComputedRef, reactive, Ref, ref, triggerRef, unref, watch, watchEffect} from "vue";
import {now} from "moment";
import {persistentStorage} from "@/helper/PersistentStorage";
import {LogService} from "@/services/logService";

const logger = LogService.logger({name: "ModificationService"})

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

const genCreatedId = (function* () {
    let cnt = 0;
    while (true) yield --cnt
})();
const createdId = (() => genCreatedId.next().value) as () => number;

export class ModificationService<T extends TablesDef, C extends TableConfigs<T>, M> extends BaseService<T, C, M> {
    public static readonly createId = createdId;
    public readonly createId = createdId;
    
    public readonly mods: ModDict<T>;
    
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
    }
    
    mod<K extends keyof M>(modName: K, payload: M[K], desc: string) {
        logger.trace("mod", modName, payload, desc);
        
        const result = this._mod(modName, payload);
        
        if (result)
            this.raw[result.id] = {
                payload: payload,
                name: modName,
                desc,
                result
            };
        else
            logger.warn("Could not apply modification")
    }
    
    private _mod<K extends keyof M>(modName: K, payload: M[K]) {
        if (!this.modifications[modName])
            return;
        const result = this.modifications[modName](payload, this.services);
        
        if (this.raw[result.id]) {
            delete this.raw[result.id];
            this.reapply();
        } else
            this.apply(result);
        
        return result;
    }
    
    remove<K extends keyof T>(modId: string) {
        delete this.raw[modId];
        this.reapply();
    }
    
    private apply(result: ReturnType<ModificationFn<any, T>>) {
        for (const table in result.mods) {
            for (const id in result.mods[table]) {
                for (const field in result.mods[table][id]) {
                    this.mods[table][id] = {
                        ...this.mods[table][id],
                        [field]: result.mods[table][id][field]
                    }
                }
            }
        }
    }
    
    public reapply() {
        Object.keys(this._tables).forEach(table => {
            this.mods[table as keyof T] = {};
        });
        
        Object.values(this.raw).forEach(r => this._mod(r.name, r.payload));
    }
    
    public toJSON(modsId?: string[]) {
        const raw = Object.entries(this.raw).filter(r => modsId === undefined || modsId.indexOf(r[0]) !== -1).reduce((a, v) => {
            a[v[0]] = {
                ...v[1]
            }
            delete a[v[0]].result;
            return a;
        }, {});
        return JSON.stringify(raw);
    }
    
    public fromJSON(raw: string) {
        const rawP: Record<string, RawMod<any, any>> = JSON.parse(raw);
        Object.entries(rawP).forEach(([id, mod]) => {
            this.mod(mod.name, mod.payload, mod.desc);
        })
    }
}
