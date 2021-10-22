import {Services} from "@/services";
import {TableConfig} from "@/services/dataService";

export abstract class BaseService<T extends Record<string, TableConfig>> {
    protected services: Services<T>;
    
    constructor(services: Services<T>) {
        this.services = services;
    }
}
