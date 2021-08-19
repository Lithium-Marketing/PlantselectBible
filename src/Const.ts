import {Store} from "vuex";
import {Modifications} from "@/Modifications";
import {MenuItemConstructorOptions} from "electron";

export const ColorMenu = (store: Store<any>, modifications: Modifications, row: HTMLTableRowElement): MenuItemConstructorOptions[] => {
    function oaColor(val, type) {
        return () => {
            modifications.setOAColor({
                val,
                type,
                OA_ID: row.dataset.oaid,
                Produit_ID: row.dataset.pid,
            }).commit();
        }
    }
    
    function oaFor(type) {
        return [
            {label: "Rouge", click: oaColor("red", type)},
            {label: "Jaune", click: oaColor("yellow", type)},
            {label: "Vert", click: oaColor("green", type)},
            {label: "Bleu", click: oaColor("blue", type)},
            {label: "Violet", click: oaColor("violet", type)},
            {label: "Gris", click: oaColor("grey", type)},
            {label: "Clear", click: oaColor(undefined, type)}
        ]
    }
    
    return [
        {
            label: 'Produit ' + store.state.products[row.dataset.pid].Code,
            submenu: [
                {
                    label: "Rouge",
                    click() {
                        modifications.setProductColor({
                            val: "red",
                            Produit_ID: row.dataset.pid
                        }).commit();
                    }
                },
                {
                    label: "Jaune",
                    click() {
                        modifications.setProductColor({
                            val: "yellow",
                            Produit_ID: row.dataset.pid
                        }).commit();
                    }
                },
                {
                    label: "Vert",
                    click() {
                        modifications.setProductColor({
                            val: "green",
                            Produit_ID: row.dataset.pid
                        }).commit();
                    }
                },
                {
                    label: "Bleu",
                    click() {
                        modifications.setProductColor({
                            val: "blue",
                            Produit_ID: row.dataset.pid
                        }).commit();
                    }
                },
                {
                    label: "Violet",
                    click() {
                        modifications.setProductColor({
                            val: "violet",
                            Produit_ID: row.dataset.pid
                        }).commit();
                    }
                },
                {
                    label: "Gris",
                    click() {
                        modifications.setProductColor({
                            val: "grey",
                            Produit_ID: row.dataset.pid
                        }).commit();
                    }
                },
                {
                    label: "Clear",
                    click() {
                        modifications.setProductColor({
                            val: undefined,
                            Produit_ID: row.dataset.pid
                        }).commit();
                    }
                }
            ]
        },
        {
            label: "OA " + row.dataset.oaid,
            submenu: [
                {
                    label: "Variete",
                    submenu: oaFor("Variete")
                }, {
                    label: "Inventaire",
                    submenu: oaFor("")
                },
            ]
        },
        {type: 'separator'},
        {label: 'Menu Item 2', type: 'checkbox', checked: true}
    ]
};

const text = {
    Variete: "Variete",
    Inventaire: "Inventaire",
    a0: "Achat",
    v0: "Vente",
    dateReception: "Date Reception",
    qtyF: "Quantite Future"
};

export function toText(key: string) {
    return text[key] || key;
}
