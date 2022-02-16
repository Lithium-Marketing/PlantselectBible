import {createStore} from 'vuex';

import mysql from 'mysql2/promise'
import {Job, Modification, ModificationsCompiler, ModificationType} from "@/Modifications";

const MAX_LOG_LEN = 240;

export interface Price {
    Produit_ID,
    /**
     * refer to table produits_prix
     */
    Prix_ID,
    ID,
    Prix,
    PrixO
}

export interface PriceTitle {
    Titre,
    ID
}

export interface StoreState {
    _: {
        loading: boolean;
        '%': number,
        loadingSaves: boolean
        logs: { date: number, text: string }[];
    };
    editState: {
        oaID: number;
        prodID: number;
        tab: string;
    };
    mysqlLogin: {
        database: string;
        user: string;
        password: string;
        host: string;
    };
    products: {};
    oas: Record<any, any>;
    prices: Record<any, Price>;
    priceTitles: Record<any, PriceTitle>;
    
    productsOrder: string[],
    
    modificationsRaw: Record<any, ModificationType>;
    modifications: Record<any, Modification>;
    
    failed: ModificationType[],
    
    settings: {
        ipp: number
    };
    saves: { ID: number, Name: string, Data: string }[]
}

export default createStore<StoreState>({
    state: {
        _: {
            loading: false,
            '%': 0,
            loadingSaves: false,
            logs: [],
        },
        
        editState: {
            oaID: -1,
            prodID: -1,
            tab: 'product'
        },
        
        mysqlLogin: {
            database: "",
            user: "",
            password: "",
            host: ""
        },
        
        products: {},//key is products.ID
        oas: {},//key is oa.ID
        //oasByProduct: {},//key ia products.ID value is array of oa.ID
        prices: {},
        priceTitles: {},
        
        productsOrder: [],
        
        modificationsRaw: {},//key is generated ID for operation
        modifications: {},//key is generated ID for operation
        
        failed: [],
        
        settings: {
            ipp: 20
        },
        saves: []
    },
    mutations: {
        setProducts(state, payload) {
            state.products = payload;
            console.log("products", Object.entries(payload).length);
        },
        setProductsOrder(state, payload) {
            state.productsOrder = payload;
        },
        setOAs(state, payload) {
            state.oas = payload;
            console.log("oas", Object.entries(payload).length);
        },
        setPrices(state, {prices}) {
            state.prices = prices;
            console.log("prices", Object.entries(prices).length);
        },
        setPriceTitles(state, payload) {
            state.priceTitles = payload;
            console.log("priceTitles", Object.entries(payload).length);
        },
        setSaves(state, payload) {
            state.saves = payload;
        },
        
        _loading(state, payload: boolean | number) {
            state._.loading = typeof payload === 'boolean' ? payload : payload < 1;
            state._['%'] = typeof payload === 'boolean' ? -1 : payload;
            
            if (typeof payload === 'boolean' || payload == -1)
                return;
            
            state._.logs.push({
                date: Date.now(),
                text: (payload * 100).toFixed(2) + "%"
            });
            if (state._.logs.length > MAX_LOG_LEN)
                state._.logs.splice(0, state._.logs.length - MAX_LOG_LEN);
        },
        _loadingSaves(state, payload: boolean) {
            state._.loadingSaves = payload;
        },
        
        load(state, payload) {
            state.editState.prodID = payload.prodID >= 0 ? payload.prodID : -1;
            state.editState.oaID = payload.oaID >= 0 ? payload.oaID : -1;
            state.editState.tab = payload.tab
        },
        _log(state, payload) {
            state._.logs.push({
                date: Date.now(),
                text: payload?.toString()
            });
            if (state._.logs.length > MAX_LOG_LEN)
                state._.logs.splice(0, state._.logs.length - MAX_LOG_LEN);
        },
        ipp(state, payload) {
            state.settings.ipp = payload
        },
        mysqlLogin(state, payload) {
            state.mysqlLogin = payload
        },
        modificationsRaw(state, modifications: Record<any, ModificationType>) {
            Object.entries(modifications).forEach(m => {
                state.modificationsRaw[m[0]] = m[1];
            })
        },
        failed(state, failed: ModificationType[]) {
            state.failed.push(...failed);
        },
        modifications(state, modifications: Modification[]) {
            for (const modId in modifications) {
                if (!modifications.hasOwnProperty(modId))
                    continue;
                
                const oldMod = state.modifications[modId];
                if (oldMod)
                    for (const change of oldMod.changes) {
                        const resourceKey = change.resource;
                        const newValue = change.value;
                        
                        if ("create" in change)
                            delete state[resourceKey][change.create]
                    }
                
                const newMod = modifications[modId];
                delete state.modifications[modId];
                
                let changed = false;
                for (const change of newMod.changes) {
                    const resourceKey = change.resource;
                    const newValue = change.value;
                    
                    if ("create" in change) {
                        if (newValue === undefined)
                            continue;
                        
                        state[resourceKey] ={
                            ...state[resourceKey],
                            [change.create]:  Object.freeze({
                                ...newValue,
                                ID: change.create
                            })
                        };
                        changed = true;
                        continue;
                    }
                    const key = change.key;
                    const field = change.field;
                    
                    state[resourceKey][key] = Object.freeze({
                        ...state[resourceKey][key],
                        [field]: newValue
                    });
                    
                    if (state[resourceKey][key][field + "O"] == newValue)
                        continue
                    
                    changed = true;
                }
                
                if (changed)
                    state.modifications[modId] = newMod;
                
            }
        },
        clearMod(state) {
            state.modificationsRaw = {};
            state.modifications = {};
        }
    },
    actions: {
        log(context, payload) {
            context.commit("_log", payload);
        },
        load(context, payload) {
            console.log(payload);
        },
        
        async applyMod(context, payload) {
            context.commit("_loading", true);
            
            const connection = await mysql.createConnection(context.state.mysqlLogin)
            
            try {
                await connection.beginTransaction()
                
                const len = Object.values(context.state.modifications).length;
                let done = 0;
                const results = [];
                
                for (const mod of Object.values(context.state.modifications)) {
                    results.push(await connection.query(mod.sql));
                    context.commit("_loading", (++done) / len);
                }
                
                await connection.commit()
                context.commit("clearMod")
                await connection.end()
                return results
            } catch (err) {
                await connection.rollback()
                await connection.end()
                return Promise.reject(err)
            }
        },
        
        async refresh(context, payload) {
            if (Object.entries(context.state.products).length && !payload)
                return;
            
            const conn = await mysql.createPool(context.state.mysqlLogin)
            
            context.commit("_loading", true);
            
            const promises = [];
            
            promises.push(conn.query(req1()).then(result => {
                const products: any = {};
                const order = [];
                for (const p of result[0] as any[]) {
                    p.years_pastV0O = p.years_pastV0;
                    p['ColorO'] = p['Color']
                    p['bible.QuantiteO'] = p['bible.Quantite'];
                    p['bible.ColorO'] = p['bible.Color']
                    p['bible.VendantO'] = p['bible.Vendant']
                    products[p.ID.toString()] = Object.freeze(p);
                    order.push(p.ID.toString());
                }
                context.commit('setProducts', products);
                context.commit('setProductsOrder', order);
            }).catch(e => {
                console.error(e);
            }));
            
            promises.push(conn.query(reqOA()).then(result => {
                const oas: any = {};
                for (const p of result[0] as any[]) {
                    p.years_pastC0O = p.years_pastC0;
                    p['bible.QuantiteO'] = p['bible.Quantite'];
                    p['bible.ColorO'] = p['bible.Color']
                    p['NoteO'] = p['Note']
                    oas[p.ID.toString()] = Object.freeze(p);
                }
                context.commit('setOAs', oas);
            }).catch(e => {
                console.error(e);
            }));
            
            promises.push(conn.query(reqPrices()).then(result => {
                const prices: any = {};
                for (const p of result[0] as any[]) {
                    p.PrixO = p.Prix;
                    prices[p.ID.toString()] = Object.freeze(p);
                }
                context.commit('setPrices', {prices});
            }).catch(e => {
                console.error(e);
            }));
            
            promises.push(conn.query(reqPricesTitle()).then(result => {
                const prices: any = {};
                for (const p of result[0] as any[]) {
                    prices[p.ID.toString()] = Object.freeze(p);
                }
                context.commit('setPriceTitles', prices);
            }).catch(e => {
                console.error(e);
            }));
            
            await Promise.all(promises);
            await conn.end()
            
            context.commit("_loading", false);
            await context.dispatch("modificationsRaw", {
                showLoading: true,
                mods: context.state.modificationsRaw
            })
        },
        
        async modificationsRaw(context, {showLoading = false, mods}: { showLoading: boolean, mods: Record<any, ModificationType> }) {
            if (showLoading)
                context.commit("_loading", true);
            
            const compiler = new ModificationsCompiler(this);
            const entries = Object.values(mods);
            
            let i = 0;
            
            //console.time("Modification Compilation");
            await new Job(() => {
                if (i >= entries.length)
                    return true;
                
                //if (showLoading && i % 10 === 0)
                    //context.commit("_loading", i / entries.length / 2)
                compiler.apply(entries[i]);
                //console.timeLog("Modification Compilation");
                
                ++i;
            }).start();
            //console.timeEnd("Modification Compilation");
            
            //console.time("Modification Commit");
            await compiler.commit((p) => showLoading && context.commit("_loading", (p / 2) + .5));
            //console.timeEnd("Modification Commit");
            
            if (showLoading)
                context.commit("_loading", false);
        },
        
        async createSave(context, name) {
            const connection = await mysql.createConnection(context.state.mysqlLogin);
            const data = JSON.stringify(context.state.modificationsRaw);
            try {
                await connection.query(`INSERT INTO bible_saves(
					                                               Name, Data
				                                               ) VALUE ('${name}','${data}')`);
            } finally {
                connection.end()
            }
            await context.dispatch("refreshSaves");
        },
        async refreshSaves(context) {
            context.commit("_loadingSaves", true);
            const connection = await mysql.createConnection(context.state.mysqlLogin);
            try {
                const result = (await connection.query(`SELECT *
				                                        FROM bible_saves WHERE Version=0`))[0];
                context.commit("setSaves", result);
            } finally {
                connection.end()
                context.commit("_loadingSaves", false);
            }
        },
        async loadSave(context, data) {
            context.commit("clearMod");
            context.commit("modificationsRaw", JSON.parse(data))
            await context.dispatch("refresh", true);
        },
        async deleteSave(context, id) {
            const connection = await mysql.createConnection(context.state.mysqlLogin);
            try {
                await connection.query(`DELETE
				                        FROM bible_saves
				                        WHERE
					                        ID = ${id}`);
                context.dispatch("refreshSaves");
            } finally {
                connection.end()
            }
        }
    }
})

function reqPricesTitle() {
    return "SELECT ID,Titre FROM prix ORDER BY Position DESC";
}

function reqPrices() {
    let query = "SELECT ";
    const fields = {
        produits_prix: ["ID", "Prix", "Prix_ID", "Produit_ID"]
    };
    const froms = [
        "produits_prix"
    ];
    
    query += Object.entries(fields).flatMap(e => {
        return e[1].map(a => e[0] + '.' + a);
    }).join(',');
    
    query += " FROM " + froms.join(" LEFT JOIN ");
    
    return query;
}

function reqOA() {
    let query = "SELECT ";
    const fields = {
        bible: ["Note", "Quantite as 'bible.Quantite'", "Vendant", "PrixC", "Color as 'bible.Color'"],
        vue_ordres_assemblages: ["Produit", "ID", "pw", "sem_fini", "Quantite_produire", "Quantite_recevoir", "Quantite_recu", "Format", "Fournisseur", "empotages", "Quantite", "Date_reception", "years_pastT0", "years_pastT1", "years_pastT2", "years_pastC0", "years_pastC1", "years_pastC2"]
    };
    const froms = [
        "vue_ordres_assemblages",
        "bible ON `vue_ordres_assemblages`.`ID`=`bible`.`OA`",
    ];
    const wheres = [];
    
    query += Object.entries(fields).flatMap(e => {
        return e[1].map(a => e[0] + '.' + a);
    }).join(',');
    
    query += " FROM " + froms.join(" LEFT JOIN ");
    
    if (wheres.length)
        query += " WHERE " + wheres.map(e => "(" + e + ")").join(" AND")
    
    return query;
}

function req1() {
    let query = "SELECT ";
    const fields = {
        bible: ["Note", "Quantite as 'bible.Quantite'", "Vendant as 'bible.Vendant'", "Color as 'bible.Color'"],
        produits: ["Color"],
        vue_produits: ["Code", "Variete", "Format", "reservation", "years_pastM0", "years_pastM1", "years_pastM2", "years_pastVe0", "years_pastVe1", "years_pastVe2", "years_pastA0", "years_pastA1", "years_pastA2", "years_pastV0", "years_pastV1", "years_pastV2", "ID"],
        vue_inventaire: ["Quantite"],
        //vue_ordres_assemblages: ["ID", "pw", "sem_fini", "Quantite_produire", "Quantite_recevoir", "Quantite_recu", "Format", "Fournisseur", "empotages", "Quantite", "Date_reception", "years_pastT0", "years_pastT1", "years_pastT2", "years_pastC0", "years_pastC1", "years_pastC2"]
    };
    const froms = [
        "vue_produits",
        //"vue_ordres_assemblages ON `vue_produits`.`ID`=`vue_ordres_assemblages`.`Produit`",
        "bible ON (`bible`.`OA` IS NULL AND `vue_produits`.`ID`=`bible`.`Produit`)",
        "produits ON `vue_produits`.`ID`=`produits`.`ID`",
        "vue_inventaire ON `vue_produits`.`ID`=`vue_inventaire`.`ID`"
    ];
    const wheres = [
        "produits.active=1"
    ];
    
    query += Object.entries(fields).flatMap(e => {
        return e[1].map(a => e[0] + '.' + a);
    }).join(',');
    
    query += " FROM " + froms.join(" LEFT JOIN ");
    
    query += " WHERE " + wheres.map(e => "(" + e + ")").join(" AND")
    
    return query + " ORDER BY `produits`.`Type` asc,`vue_produits`.`Variete` asc,`vue_produits`.`Format` asc";
}
