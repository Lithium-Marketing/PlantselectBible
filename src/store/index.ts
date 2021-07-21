import {createStore} from 'vuex'

import mysql from 'mysql2'

const conn = mysql.createPool({
    database: "lithweb_crm_plantselect",
    user: "lithweb_pl_bible",
    password: "CAkdCI@HU6s?",
    host: "plantselect.lithiumwebsolutions.com"
});


export default createStore({
    state: {
        loading: false,
        products: {},//key is products.ID
        oas: {},//key is products.ID
    },
    mutations: {
        setProducts(state, payload) {
            state.products = payload;
        },
        loading(state, payload) {
            state.loading = !!payload;
        }
    },
    actions: {
        load(context, payload) {
            console.log(payload);
        },
        refreshProducts(context, payload) {
            if (Object.entries(context.state.products).length && !payload)
                return;
            
            context.commit("loading", true);
            conn.query(req1(), (err, result) => {
                if (err)
                    throw err;
                const products: any = {};
                for (const p of result as any[]) {
                    products[p.ID.toString()] = p;
                }
                context.commit('setProducts', result)
                context.commit("loading", false);
            })
        }
    }
})


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
