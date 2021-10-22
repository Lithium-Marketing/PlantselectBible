import {Services} from "@/services/index";
import {BaseService} from "@/helper/baseService";
import {computed, ComputedRef} from "vue";
import moment from "moment";

export class CacheService extends BaseService<any> {
    public readonly pricesByProdById: ComputedRef<{ [prod: number]: { [id: number]: any } }>;
    /**
     * archives[type][year][id]
     */
    public readonly archives: ComputedRef<{
        [type: number]: {
            [year: number]: {
                [id: number]: {
                    id: number,
                    value: number
                } & any
            }
        }
    }>;
    
    public readonly cmdsByProdByYear: ComputedRef<{
        [produit: number]: {
            vente(year: number): ComputedRef<number>;
        }
    }>;
    
    constructor(s: Services<any>) {
        super(s);
        
        this.pricesByProdById = computed(function pricesByProdById() {
            return Object.values(s.data.get("produits_prix").value).reduce((a, v) => {
                const price = v.value;
                a[price.Produit_ID] = a[price.Produit_ID] || {};
                a[price.Produit_ID][price.Prix_ID] = price;
                return a;
            }, {})
        });
        this.archives = computed(function archives() {
            return Object.values(s.data.get("Archive").value).reduce((a, v) => {
                const entry = v.value;
                a[entry.type] = a[entry.type] || {};
                a[entry.type][entry.year] = a[entry.type][entry.year] || {};
                a[entry.type][entry.year][entry.produit] = entry;
                return a;
            }, {})
        });
        this.cmdsByProdByYear = computed(function cmdsByProdByYear() {
            return Object.entries(s.data.getByIndex("clients_commandes_produits","Produit").value).reduce((a,[prod_id, prods]) => {
                
                a[prod_id] = {
                    vente(year: number) {
                        return computed(() => {
                            let result = 0;
                            for (const id of prods) {
                                const prod = s.data.get("clients_commandes_produits",id).value;
                                const cmd = s.data.get("clients_commandes", prod.Commande).value;
                                if (!cmd || moment.unix(cmd.Date).year() !== year)
                                    continue;
                                result += prod.Quantite;
                            }
                            return result;
                        })
                    }
                }
                
                return a;
            },{});
        });
    }
    
}
