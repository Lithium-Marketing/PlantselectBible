import {Services} from "@/services/index";
import {BaseService} from "@/helper/baseService";
import {computed} from "vue";

export class CacheService extends BaseService {
    
    private initProduct() {
        return computed(() => {
            const pt = this.services.data.get("produits").value;
            
        })
    }
    
}
