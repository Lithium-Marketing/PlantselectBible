import {Store} from "vuex";
import {Modifications} from "@/Modifications";
import {MenuItemConstructorOptions} from "electron";
import {Price, StoreState} from "@/store";
import {computed, ComputedRef, ref, WritableComputedOptions} from "vue";

export const ColorMenu = (store: Store<any>, modifications: Modifications, row: HTMLTableRowElement): MenuItemConstructorOptions[] => {
    function oaColor(val, type) {
        return () => {
            modifications.add({
                type: "setOAColor",
                val,
                colorType: type,
                OA_ID: row.dataset.oaid,
                Produit_ID: row.dataset.pid,
            }).commit();
        }
    }
    
    function prodColor(val, type) {
        return () => {
            modifications.add({
                type: "setProductColor",
                val,
                Produit_ID: row.dataset.pid
            }).commit();
        }
    }
    
    console.log(store.state.products[row.dataset.pid]);
    
    console.log(store.state.products[row.dataset.pid]['Color']);
    
    function colorsFor(type, fn = oaColor): MenuItemConstructorOptions[] {
        let color = "n/a";
        try {
            color = fn === oaColor ? JSON.parse(store.state.oas[row.dataset.oaid]?.['bible.Color'])?.[type] : store.state.products[row.dataset.pid]['Color'];
            console.log(color);
        } catch (e) {
            console.error(e)
        }
        return [
            {label: "Rouge", click: fn("red", type), type: "checkbox", checked: color === "red"},
            {label: "Jaune", click: fn("yellow", type), type: "checkbox", checked: color === "yellow"},
            {label: "Vert", click: fn("green", type), type: "checkbox", checked: color === "green"},
            {label: "Bleu", click: fn("blue", type), type: "checkbox", checked: color === "blue"},
            {label: "Violet", click: fn("violet", type), type: "checkbox", checked: color === "violet"},
            {label: "Gris", click: fn("grey", type), type: "checkbox", checked: color === "grey"},
            {label: "Clear", click: fn(undefined, type), type: "checkbox", checked: color === "" || color === undefined}
        ]
    }
    
    const menu: MenuItemConstructorOptions[] = [
        {
            label: 'Produit ' + store.state.products[row.dataset.pid].Code,
            submenu: colorsFor("", prodColor)
        }
    ];
    
    if (store.state.oas[row.dataset.oaid])
        menu.push({
            label: "OA " + row.dataset.oaid,
            submenu: [
                ...Object.entries(colorText).map(e => ({
                    label: e[1],
                    submenu: colorsFor(e[0])
                })),
            ]
        });
    
    
    return menu;
};

const colorText = {
    Variete: "Variete",
    Inventaire: "Inventaire",
    a0: "Achat",
    v0: "Vente",
    dateReception: "Date Reception",
    qtyF: "Achat Future"
}

const modText = {
    setVenteFutur: "Vendant Futur",
    setPriceOne: "Prix",
    setProductColor: "Couleur",
    setOAColor: "Couleur",
    setCost: "Coutant",
    setAchat: "Achat",
    setNote: "Note",
    setPrice: "Prix",
    
}

const changeType = {
    mod: "Modification",
    create: "Création"
}

const text = {
    ...colorText,
    ...modText
};

export function toText(key: string) {
    return text[key] || key;
}

export interface CacheI<T>{
    enable();
    value: T
}

export class CacheReactive{
    private store: Store<StoreState>;
    
    private _pricesByProduct: CacheI<Record<any, Record<any, Price>>>
    
    constructor(store: Store<StoreState>) {
        this.store = store;
    
        this._pricesByProduct = CacheReactive.newCache(()=>{
            const result = {};
            Object.values(store.state.prices).forEach(price=>{
                result[price.Produit_ID] = result[price.Produit_ID] || [];
                result[price.Produit_ID][price.Prix_ID] = price;
            })
            return result;
        });
    }
    
    static newCache<T>(getter: WritableComputedOptions<T>['get']):CacheI<T>{
        let cache: ComputedRef<T>;
        return {
            enable(){
                if(cache)
                    return;
                cache = computed(getter);
            },
            get value(){
                return cache?.value;
            }
        };
    }
    
    prices(Produit_ID,Prix_ID){
        this._pricesByProduct.enable();
        return this._pricesByProduct.value[Produit_ID]?.[Prix_ID];
    }
    
    pricesByProduct(Produit_ID){
        this._pricesByProduct.enable();
        return this._pricesByProduct.value[Produit_ID];
    }
    
}
