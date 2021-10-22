import {Store} from "vuex";
import {Price, StoreState} from "@/store";
import {computed, ComputedRef, WritableComputedOptions} from "vue";

export interface CacheI<T> {
    enable();
    
    value: T
}

export class CacheReactive {
    private store: Store<StoreState>;
    
    private _pricesByProduct: CacheI<Record<any, Record<any, Price>>>
    
    constructor(store: Store<StoreState>) {
        this.store = store;
        
        this._pricesByProduct = CacheReactive.newCache(() => {
            const result = {};
            Object.values(store.state._.prices).forEach(price => {
                result[price.Produit_ID] = result[price.Produit_ID] || [];
                result[price.Produit_ID][price.Prix_ID] = price;
            })
            return result;
        });
    }
    
    static newCache<T>(getter: WritableComputedOptions<T>['get']): CacheI<T> {
        let cache: ComputedRef<T>;
        return {
            enable() {
                if (cache)
                    return;
                cache = computed(getter);
            },
            get value() {
                return cache?.value;
            }
        };
    }
    
    prices(Produit_ID, Prix_ID) {
        this._pricesByProduct.enable();
        return this._pricesByProduct.value[Produit_ID]?.[Prix_ID];
    }
    
    pricesByProduct(Produit_ID) {
        this._pricesByProduct.enable();
        return this._pricesByProduct.value[Produit_ID];
    }
    
}
