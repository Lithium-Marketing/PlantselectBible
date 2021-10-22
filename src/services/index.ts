import {App, inject, InjectionKey} from 'vue';
import {ModificationService} from "@/services/ModificationService";
import {CacheService} from "@/services/cacheService";
import {DataService} from "@/services/dataService";
import {JobService} from "@/services/jobService";

const tables = [
    "produits",
    "ordres_assemblages",
    "bible",
    "bible_saves",
    "clients",
    "clients_commandes",
    "clients_commandes_produits"
] as const;
export type Tables = typeof tables[number];

export class Services {
    public readonly job: JobService;
    public readonly data: DataService<Tables>;
    public readonly cache: CacheService;
    public readonly modification: ModificationService<Tables>;
    
    public constructor() {
        this.job = new JobService(this);
        this.data = new DataService(this, tables);
        this.cache = new CacheService(this);
        this.modification = new ModificationService(this, tables);
    }
    
}

export const key: InjectionKey<Services> = Symbol();

export function useServices(): Services {
    return inject(key)
}

export function ServicesPlugin(app: App, ...options: any[]): any {
    const s = new Services();
    app.provide(key, s);
    app.config.globalProperties.$services = s;
}
