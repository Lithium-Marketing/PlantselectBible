import {Store} from "vuex";
import {Modifications} from "@/Modifications";
import {MenuItemConstructorOptions} from "electron";

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
    
    function colorsFor(type, fn = oaColor) {
        return [
            {label: "Rouge", click: fn("red", type)},
            {label: "Jaune", click: fn("yellow", type)},
            {label: "Vert", click: fn("green", type)},
            {label: "Bleu", click: fn("blue", type)},
            {label: "Violet", click: fn("violet", type)},
            {label: "Gris", click: fn("grey", type)},
            {label: "Clear", click: fn(undefined, type)}
        ]
    }
    
    return [
        {
            label: 'Produit ' + store.state.products[row.dataset.pid].Code,
            submenu: colorsFor("", prodColor)
        },
        {
            label: "OA " + row.dataset.oaid,
            submenu: [
                ...Object.entries(colorText).map(e => ({
                    label: e[1],
                    submenu: colorsFor(e[0])
                })),
            ]
        },
        //{type: 'separator'},
        //{label: 'Menu Item 2', type: 'checkbox', checked: true}
    ]
};

const colorText = {
    Variete: "Variete",
    Inventaire: "Inventaire",
    a0: "Achat",
    v0: "Vente",
    dateReception: "Date Reception",
    qtyF: "Quantite Future"
}

const text = {
    ...colorText
};

export function toText(key: string) {
    return text[key] || key;
}
