import {Store} from "vuex";
import {Modifications} from "@/helper/Modifications";
import {MenuItemConstructorOptions} from "electron";
import {App} from "vue";
import moment from "moment";
import store from "@/store";
import router from "@/router";

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
    
    function colorsFor(type, fn = oaColor): MenuItemConstructorOptions[] {
        let color = "n/a";
        try {
            color = fn === oaColor ? JSON.parse(store.state._.oas[row.dataset.oaid]?.['bible.Color'])?.[type] : store.state._.products[row.dataset.pid]['Color'];
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
            label: 'Produit ' + store.state._.products[row.dataset.pid].Code,
            submenu: colorsFor("", prodColor)
        }
    ];
    
    if (store.state._.oas[row.dataset.oaid])
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

////

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

////

export enum PricesId {
    Main=1
}

////

export function Const(app: App, ...options: any[]):any{
    const year = moment().add(7, 'M').year();
    app.config.globalProperties.$pastTitle = {
        years_pastM0: "Mort " + year,
        years_pastM1: "Mort " + (year - 1),
        years_pastM2: "Mort " + (year - 2),
        years_pastVe0: "Vente " + year,
        years_pastVe1: "Vente " + (year - 1),
        years_pastVe2: "Vente " + (year - 2),
        years_pastA0: "Achat " + year,
        years_pastA1: "Achat " + (year - 1),
        years_pastA2: "Achat " + (year - 2),
        years_pastV0: "Vendant " + year,
        years_pastV1: "Vendant " + (year - 1),
        years_pastV2: "Vendant " + (year - 2),
        years_pastT0: "Transport " + year,
        years_pastT1: "Transport " + (year - 1),
        years_pastT2: "Transport " + (year - 2),
        years_pastC0: "Coutant " + year,
        years_pastC1: "Coutant " + (year - 1),
        years_pastC2: "Coutant " + (year - 2),
    };
    app.config.globalProperties.$money = (val) => {
        return val ? (parseFloat(val).toFixed(2) + "$") : "-";
    }
    app.config.globalProperties.$value = (val) => {
        return val ? parseFloat(val).toFixed(2) : "-";
    }
    app.config.globalProperties.$valueI = (val) => {
        return val ? parseInt(val).toFixed(0) : "-";
    }
    app.config.globalProperties.$date = (val) => {
        if (!val)
            return "-";
        return moment.unix(val).format('ll')
    }
    app.config.globalProperties.$load = (oaID, prodID, tab = 'product') => {
        store.commit('load', {
            oaID: parseInt(oaID, 10),
            prodID: parseInt(prodID, 10),
            tab
        });
        return router.push({name: "Edit"})
    }
}
