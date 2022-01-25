import {App, computed, customRef, inject, InjectionKey, ref, Ref, triggerRef} from 'vue';
import {ModificationFn, ModificationService} from "@/services/ModificationService";
import {CacheService} from "@/services/cacheService";
import {DataService} from "@/services/dataService";
import {JobService} from "@/services/jobService";
import {SaveService} from "@/services/saveService";
import {LogService} from "@/services/logService";

export interface TableConfig {
    indexes?: readonly string[],
    sql?: string,
    key?: string
}

export type TableConfigs<T> = {
    [table in keyof T]: TableConfig
}

export type TablesDef = {
    [table: string]: {
        [field: string]: any
    }
}

export class Services<T extends TablesDef, C extends TableConfigs<T>, M> {
    public readonly logs = LogService
    
    public readonly job: JobService;
    public readonly data: DataService<T, C>;
    public readonly cache: CacheService;
    public readonly modification: ModificationService<T, C, M>;
    public readonly save: SaveService<T, C>;
    
    public readonly tables: C;
    
    public constructor(tables: C, modifications: Record<keyof M, ModificationFn<Services<T, C, M>, T>>) {
        this.tables = Object.freeze(tables);
        
        this.job = new JobService(this);
        this.data = new DataService(this, tables);
        this.cache = new CacheService(this);
        this.modification = new ModificationService(this, tables, modifications);
        this.save = new SaveService(this);
    
        this.modification.reapply();
    }
    
    private static _fatals:Ref<any[]> = ref([]);
    public fatals = computed(()=>[...Services._fatals.value]);
    
    static registerFatalError(error: any){
        this._fatals.value.push(error);
    }
    
}

export const key: InjectionKey<Services<any, any, any>> = Symbol();

export function useServices<T extends TablesDef, C extends TableConfigs<T>, M>(): Services<T, C, M> {
    return inject(key)
}

export function ServicesPlugin<T extends TablesDef, C extends TableConfigs<T>, M>(tables: C, modifications: Record<keyof M, ModificationFn<Services<T, C, M>, T>>) {
    return function (app: App, ...options: any[]): any {
        const s = new Services<T, C, M>(tables, modifications);
        app.provide(key, s);
        app.config.globalProperties.$services = s;
        app.config.globalProperties.$v = function (table: keyof T, id: number, field: string) {
            return s.data.get(table, id, field);
        }
    }
}
