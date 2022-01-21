import {Services, TableConfig, TableConfigs, TablesDef} from "@/services";

export abstract class BaseService<T extends TablesDef, C extends TableConfigs<T>,M> {
    protected services: Services<T, C,M>;
    protected _tables: C;
    
    constructor(services: Services<T, C,M>) {
        this.services = services;
        this._tables = services.tables;
        
        this._init();
    }
    
    protected _init() {
    }
}
