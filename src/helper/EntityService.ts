import {Services} from "@/services";
import {computed, Ref, watch} from "vue";
import {BaseService} from "@/helper/baseService";

interface EntityServiceConfig {
    sql: string
}

export abstract class EntityService<T> extends BaseService {
    protected rawData: Ref<Record<number, any>>
    
    constructor(s: Services, config: EntityServiceConfig) {
        super(s);
        
        
        
        //watch()
    }
    
    abstract get(id: number): T;
    
    /*public count(): Ref<number>{
    
    }*/
    
}
