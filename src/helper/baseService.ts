import {Services} from "@/services";
import {TableConfig} from "@/services/dataService";

export abstract class BaseService<T extends Record<string, TableConfig>> {
    protected services: Services<T>;
    protected _tables: T;
    
    constructor(services: Services<T>) {
        this.services = services;
        this._tables = services.tables;
        
        this._init();
    }
    
    protected _init() {
    }
}
