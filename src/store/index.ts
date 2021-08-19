import {createStore} from 'vuex'

import mysql from 'mysql2/promise'

/*const conn = mysql.createPool({
    database: "lithweb_crm_plantselect",
    user: "lithweb_pl_bible",
    password: "CAkdCI@HU6s?",
    host: "plantselect.lithiumwebsolutions.com"
});*/


export default createStore({
    state: {
        _: {
            loading: false,
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
        
        changes: {},//key is generated ID for operation
        
        logs: [],
        settings: {
            ipp: 20
        }
    },
    mutations: {
        setProducts(state, payload) {
            state.products = payload;
            console.log("products", Object.entries(payload).length);
        },
        setOAs(state, payload) {
            state.oas = payload;
            console.log("oas", Object.entries(payload).length);
        },
        setPrices(state, payload) {
            state.prices = payload;
            console.log("prices", Object.entries(payload).length);
        },
        setPriceTitles(state, payload) {
            state.priceTitles = payload;
            console.log("priceTitles", Object.entries(payload).length);
        },
        _loading(state, payload) {
            state._.loading = !!payload;
        },
        load(state, payload) {
            state.editState.prodID = payload.prodID >= 0 ? payload.prodID : -1;
            state.editState.oaID = payload.oaID >= 0 ? payload.oaID : -1;
            state.editState.tab = payload.tab
        },
        log(state, payload) {
            state.logs.push(payload?.toString());
            if (state.logs.length > 20)
                state.logs.splice(0, state.logs.length - 20);
        },
        ipp(state, payload) {
            state.settings.ipp = payload
        },
        mysqlLogin(state, payload) {
            state.mysqlLogin = payload
        },
        
        modification(state, payload) {
            const resourceKey = payload.resource;
            const key = payload.key;
            const field = payload.field;
            const newValue = payload.value;
            const sql = payload.sql;
            const text = payload.text;
            
            if (key) {
                const oldValue = state[resourceKey][key][field];
                if (oldValue == newValue)
                    return;
                state[resourceKey][key] = {
                    ...state[resourceKey][key],
                    [field]: newValue
                };
                
                const changeId = [resourceKey, key, field].join(".");
                state.changes[changeId] = {
                    sql,
                    resourceKey, key, field, text,
                    oldValue, newValue
                };
            } else {
                state.changes[Date.now()] = {
                    sql,
                    resourceKey, field, text,
                    newValue
                };
            }
            
        },
        modificationsRaw(state, payload) {
            for (const mod of payload) {
                const resourceKey = mod.resource;
                const key = mod.key;
                const field = mod.field;
                const newValue = mod.value;
                const sql = mod.sql;
                const text = mod.text;
                const changeId = mod.changeId;
                
                if (key) {
                    if (state[resourceKey][key][field] == newValue) {
                        continue;
                    } else if (state[resourceKey][key][field + "O"] == newValue) {
                        state[resourceKey][key] = {
                            ...state[resourceKey][key],
                            [field]: newValue
                        };
                        if (state.changes[changeId])
                            delete state.changes[changeId];
                        continue
                    }
                }
                
                state.changes[changeId] = {
                    sql,
                    resourceKey, field, text,
                    newValue
                };
                
                if (key) {
                    const oldValue = state[resourceKey][key][field];
                    state[resourceKey][key] = {
                        ...state[resourceKey][key],
                        [field]: newValue
                    };
                    
                    state.changes[changeId].key = key;
                    state.changes[changeId].oldValue = oldValue;
                }
            }
        },
        clearMod(state) {
            state.changes = {};
        }
    },
    actions: {
        log(context, payload) {
            context.commit("log", payload);
        },
        load(context, payload) {
            console.log(payload);
        },
        
        async applyMod(context, payload) {
            const connection = await mysql.createConnection(context.state.mysqlLogin)
            
            try {
                await connection.beginTransaction()
                const queryPromises = []
                
                Object.values(context.state.changes).forEach((query: any) => {
                    queryPromises.push(connection.query(query.sql))
                })
                const results = await Promise.all(queryPromises)
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
            
            context.commit("clearMod")
            context.commit("_loading", true);
            
            const promises = [];
            
            promises.push(conn.query(req1()).then(result => {
                const products: any = {};
                for (const p of result[0] as any[]) {
                    p.years_pastV0O = p.years_pastV0;
                    products[p.ID.toString()] = p;
                }
                context.commit('setProducts', products);
            }).catch(e => {
                console.error(e);
            }));
            
            promises.push(conn.query(reqOA()).then(result => {
                const oas: any = {};
                for (const p of result[0] as any[]) {
                    p.years_pastC0O = p.years_pastC0;
                    p['bible.QuantiteO'] = p['bible.Quantite'];
                    oas[p.ID.toString()] = p;
                }
                context.commit('setOAs', oas);
            }).catch(e => {
                console.error(e);
            }));
            
            promises.push(conn.query(reqPrices()).then(result => {
                const prices: any = {};
                for (const p of result[0] as any[]) {
                    p.PrixO = p.Prix;
                    prices[p.ID.toString()] = p;
                }
                context.commit('setPrices', prices);
            }).catch(e => {
                console.error(e);
            }));
            
            promises.push(conn.query(reqPricesTitle()).then(result => {
                const prices: any = {};
                for (const p of result[0] as any[]) {
                    prices[p.ID.toString()] = p;
                }
                context.commit('setPriceTitles', prices);
            }).catch(e => {
                console.error(e);
            }));
            
            await Promise.all(promises);
            await conn.end()
            
            context.commit("_loading", false);
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
        bible: ["Note", "Quantite as 'bible.Quantite'", "Vendant", "PrixC", "Color"],
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
        //bible: ["Note", "Quantite", "Vendant", "PrixC", "Color"],
        produits: ["Color"],
        vue_produits: ["Code", "Variete", "Format", "reservation", "years_pastM0", "years_pastM1", "years_pastM2", "years_pastVe0", "years_pastVe1", "years_pastVe2", "years_pastA0", "years_pastA1", "years_pastA2", "years_pastV0", "years_pastV1", "years_pastV2", "ID"],
        vue_inventaire: ["Quantite"],
        //vue_ordres_assemblages: ["ID", "pw", "sem_fini", "Quantite_produire", "Quantite_recevoir", "Quantite_recu", "Format", "Fournisseur", "empotages", "Quantite", "Date_reception", "years_pastT0", "years_pastT1", "years_pastT2", "years_pastC0", "years_pastC1", "years_pastC2"]
    };
    const froms = [
        "vue_produits",
        //"vue_ordres_assemblages ON `vue_produits`.`ID`=`vue_ordres_assemblages`.`Produit`",
        //"bible ON `vue_ordres_assemblages`.`ID`=`bible`.`OA` OR (`bible`.`OA` IS NULL AND `vue_produits`.`ID`=`bible`.`Produit`)",
        "produits ON `vue_produits`.`ID`=`produits`.`ID`",
        "vue_inventaire ON `vue_produits`.`ID`=`vue_inventaire`.`ID`"
    ];
    const wheres = [
        "produits.active=1"
    ];
    
    query += Object.entries(fields).flatMap(e => {
        return e[1].map(a => e[0] + '.' + a + " as '" + a + "'");
    }).join(',');
    
    query += " FROM " + froms.join(" LEFT JOIN ");
    
    query += " WHERE " + wheres.map(e => "(" + e + ")").join(" AND")
    
    return query + " ORDER BY `vue_produits`.`Variete` asc,`vue_produits`.`Format` asc";
}
