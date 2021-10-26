import {App, inject, InjectionKey} from 'vue';
import {ModificationService} from "@/services/ModificationService";
import {CacheService} from "@/services/cacheService";
import {DataService, TableConfig} from "@/services/dataService";
import {JobService} from "@/services/jobService";
import {SaveService} from "@/services/saveService";

export class Services<T extends Record<string, TableConfig>> {
    public readonly job: JobService;
    public readonly data: DataService<T>;
    public readonly cache: CacheService;
    public readonly modification: ModificationService<T>;
    public readonly save: SaveService<T>;
    
    public readonly tables: T;
    
    public constructor(tables: T) {
        this.tables = Object.freeze(tables);
        
        this.job = new JobService(this);
        this.data = new DataService(this, tables);
        this.cache = new CacheService(this);
        this.modification = new ModificationService(this, tables);
        this.save = new SaveService(this);
    }
    
}

export const key: InjectionKey<Services<any>> = Symbol();

export function useServices<T extends Record<string, TableConfig>>(): Services<T> {
    return inject(key)
}

export function ServicesPlugin<T extends Record<string, TableConfig>>(tables: T) {
    return function(app: App, ...options: any[]): any{
        const s = new Services<T>(tables);
        app.provide(key, s);
        app.config.globalProperties.$services = s;
    }
}
