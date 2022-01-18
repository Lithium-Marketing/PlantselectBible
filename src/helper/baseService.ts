import {Services, TableConfig, TableConfigs, TablesDef} from "@/services";

export abstract class BaseService<T extends TablesDef, C extends TableConfigs<T>> {
    protected services: Services<T, C>;
    protected _tables: C;
    
    constructor(services: Services<T, C>) {
        this.services = services;
        this._tables = services.tables;
        
        this._init();
    }
    
    protected _init() {
    }
}
