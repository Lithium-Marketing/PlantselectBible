import {Services} from "@/services/index";
import {BaseService} from "@/helper/baseService";
import {computed, ComputedRef} from "vue";
import moment from "moment";

export class CacheService extends BaseService<any> {
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
    
    public readonly byProd: ComputedRef<{
        [produit: number]: ComputedRef<{
            prices: any[],
            price(id: number): any | undefined;
            vente(year: number): number;
        }>
    }>;
    
    constructor(s: Services<any>) {
        super(s);
        
        this.archives = computed(function archives() {
            return Object.values(s.data.get("Archive").value).reduce((a, v) => {
                const entry = v.value;
                a[entry.type] = a[entry.type] || {};
                a[entry.type][entry.year] = a[entry.type][entry.year] || {};
                a[entry.type][entry.year][entry.produit] = entry;
                return a;
            }, {})
        });
        this.byProd = computed(function cmdsByProdByYear() {
            const priceByProd = s.data.getByIndex("produits_prix", "Produit_ID").value;
            const cmdProdByProd = s.data.getByIndex("clients_commandes_produits", "Produit").value
            
            
            return Object.entries(s.data.get("produits").value).reduce((a, [prod_id, prod]) => {
                a[prod_id] = computed(() => {
                    const prices = priceByProd[prod_id]?.map(id => s.data.get("produits_prix", id).value);
                    return {
                        prices,
                        price(Prix_ID: number) {
                            if (priceByProd[prod_id])
                                for (const id of priceByProd[prod_id]) {
                                    if (s.data.get("produits_prix", id).value.Prix_ID === Prix_ID)
                                        return s.data.get("produits_prix", id).value;
                                }
                            return;
                        },
                        vente(year: number) {
                            let result = 0;
                            if (cmdProdByProd[prod_id])
                                for (const id of cmdProdByProd[prod_id]) {
                                    const prod = s.data.get("clients_commandes_produits", id).value;
                                    const cmd = s.data.get("clients_commandes", prod.Commande).value;
                                    if (!cmd || moment.unix(cmd.Date).year() !== year)
                                        continue;
                                    result += prod.Quantite;
                                }
                            return result;
                        }
                    }
                });
                
                return a;
            }, {});
        });
    }
    
}
