import {App, inject, InjectionKey} from 'vue';
import {ModificationService} from "@/services/ModificationService";
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

export class Services<T extends TablesDef, C extends TableConfigs<T>> {
    public readonly logs = LogService
    
    public readonly job: JobService;
    public readonly data: DataService<T, C>;
    public readonly cache: CacheService;
    public readonly modification: ModificationService<T, C>;
    public readonly save: SaveService<T, C>;
    
    public readonly tables: C;
    
    public constructor(tables: C) {
        this.tables = Object.freeze(tables);
        
        this.job = new JobService(this);
        this.data = new DataService(this, tables);
        this.cache = new CacheService(this);
        this.modification = new ModificationService(this, tables);
        this.save = new SaveService(this);
    }
    
}

export const key: InjectionKey<Services<any, any>> = Symbol();

export function useServices<T extends TablesDef, C extends TableConfigs<T>>(): Services<T, C> {
    return inject(key)
}

export function ServicesPlugin<T extends TablesDef, C extends TableConfigs<T>>(tables: C) {
    return function (app: App, ...options: any[]): any {
        const s = new Services<T, C>(tables);
        app.provide(key, s);
        app.config.globalProperties.$services = s;
        app.config.globalProperties.$v = function (table: keyof T, id: number, field: string) {
            return s.data.get(table, id, field);
        }
    }
}
