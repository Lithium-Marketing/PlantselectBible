import {Services, TableConfig, TableConfigs, TablesDef} from "@/services/index";
import {computed, ComputedRef, reactive, Ref, ref, triggerRef, unref, watch, watchEffect} from "vue";
import {now} from "moment";
import {persistentStorage} from "@/helper/PersistentStorage";
import {LogService} from "@/services/logService";

const logger = LogService.logger({name: "ModificationService"})

type ModDict<T extends TablesDef> = {
    [table in keyof T]: {
        [id: number]: {
            [key in keyof T[table]]?: T[table][key]
        }
    }//Record<number, Partial<Record<keyof T[table], any>>>
}

export interface BaseMod<P, S extends Services<T, any, any>, T extends TablesDef> {
    
    getId(payload: P, services: S): string | false;
    
    apply(payload: P, services: S, op: Operations<T>): string;
    
}

export type ToModifications<S extends Services<T, any, any>, T extends TablesDef, M extends Modifications<any, S, T>> = {
    [name in keyof M]: Parameters<M[name]["apply"]>[0];
}

export type Modifications<M, S extends Services<T, any, any>, T extends TablesDef> = {
    [name in keyof M]: BaseMod<M[name], S, T>
};

type RawMod<M, N extends keyof M> = {
    name: N,
    desc: string,
    payload: M[N]
}

const genCreatedId = (function* () {
    let cnt = 0;
    while (true) yield --cnt
})();
const createdId = (() => genCreatedId.next().value) as () => number;

export interface Operations<D extends TablesDef> {
    mod<T extends keyof D, F extends keyof D[T]>(table: T, field: F, id: any, val: D[T][F])
}

export class ModificationService<T extends TablesDef, C extends TableConfigs<T>, M>{
    public static readonly createId = createdId;
    
    private readonly services: Services<T, C, M>;
    
    public readonly createId = createdId;
    
    public readonly mods: ModDict<T>;
    
    public readonly raw: { [id: string]: RawMod<M, keyof M> }
    
    public readonly results: Record<string, { nOp: number }> = {};
    
    private readonly modifications: Modifications<M, Services<T, C, M>, T>;
    
    constructor(services: Services<T, C, M>, tables: C, modifications: Modifications<M, Services<T, C, M>, T>) {
        this.services = services;
        this.modifications = modifications;
        
        this.raw = reactive({});
        
        this.mods = reactive(Object.keys(tables).reduce((a, t) => {
            a[t] = {};
            return a;
        }, {})) as ModDict<T>;
    }
    
    mod<K extends keyof M>(modName: K, payload: M[K], desc: string) {
        logger.trace("mod", modName, payload, desc);
        
        const id = this._mod(modName, payload);
        
        if (id)
            this.raw[id] = {
                payload: payload,
                name: modName,
                desc
            };
        else
            logger.warn("Could not apply modification")
    }
    
    private _mod<K extends keyof M>(modName: K, payload: M[K]) {
        if (!this.modifications[modName])
            return false;
        
        let id = this.modifications[modName].getId(payload, this.services);
        
        if (id!==false && this.raw[id]) {
            delete this.raw[id];
            this.reapply();
        }
        
        const result = {nOp:0};
        const todos = {
            mods: []
        }
        const op = {
            mod(t, f, i, v) {
                todos.mods.push({t,f,i,v})
                result.nOp++;
            }
        };
        
        id = this.modifications[modName].apply(payload, this.services, op);
        
        todos.mods.forEach(({t,f,i,v})=>{
            this.mods[t][i] = {
                ...this.mods[t][i],
                [f]: v
            };
        });
        
        this.results[id] = result;
        
        return id;
    }
    
    remove<K extends keyof T>(modId: string) {
        delete this.raw[modId];
        this.reapply();
    }
    
    public reapply() {
        Object.keys(this.services.tables).forEach(table => {
            this.mods[table as keyof T] = {};
        });
    
        const raw = Object.entries(this.raw).reduce((a, v) => {
            a.push(v[1]);
            return a;
        }, []);
        
        Object.keys(this.raw).forEach(r => delete this.raw[r]);
    
        raw.forEach((mod) => {
            this.mod(mod.name, mod.payload, mod.desc);
        });
    }
    
    public toJSON(modsId?: string[]) {
        const raw = Object.entries(this.raw).filter(r => modsId === undefined || modsId.indexOf(r[0]) !== -1).reduce((a, v) => {
            a.push(v[1]);
            return a;
        }, []);
        return JSON.stringify(raw);
    }
    
    public fromJSON(raw: string) {
        const rawP: RawMod<any, any>[] = JSON.parse(raw);
        rawP.forEach((mod) => {
            this.mod(mod.name, mod.payload, mod.desc);
        });
    }
}
