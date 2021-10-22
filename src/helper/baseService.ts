import {Services} from "@/services";

export abstract class BaseService {
    protected services: Services;
    
    constructor(services: Services) {
        this.services = services;
    }
}
