import {Services} from "@/services/index";
import {BaseService} from "@/helper/baseService";
import {computed, ComputedRef} from "vue";

export class CacheService extends BaseService {
    public readonly pricesByProdById: ComputedRef<{ [prod: number]: { [id: number]: any } }>;
    
    constructor(s: Services) {
        super(s);
        
        this.pricesByProdById = computed(() => {
            return Object.values(s.data.get("produits_prix").value).reduce((a, v) => {
                const price = v.value;
                a[price.Produit_ID] = a[price.Produit_ID] || {};
                a[price.Produit_ID][price.Prix_ID] = price;
                return a;
            }, {})
        })
    }
    
}
