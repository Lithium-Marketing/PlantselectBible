import {createApp} from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

import "./style.scss";
import moment from "moment";
import {ContextMenu} from "@/ContextMenu";
import {Modifications} from "@/Modifications";

ContextMenu.init();
moment.locale('fr')

//Object.values(JSON.parse(localStorage.backup).changes).filter((c) => c.field === 'years_pastV0').reduce((a,c)=>{a['setVenteFutur.'+c.key] = {type:'setVenteFutur',Produit_ID: c.key,val: c.newValue}; return a},{})

const stateRaw = localStorage.getItem('state');
const stateDeltaRaw = localStorage.getItem('stateDelta');
const stateVersion = localStorage.getItem('version');

(async function () {
    try {
        switch (stateVersion) {
            case "1":
                localStorage.setItem("backup", localStorage.getItem("state"));
                localStorage.setItem("backupDelta", localStorage.getItem("stateDelta"));
                
                const mod = new Modifications(store);
                if (stateRaw) {
                    const data = JSON.parse(stateRaw);
                    store.replaceState({
                        ...store.state,
                        _: store.state._,
                        mysqlLogin: data.mysqlLogin
                    });
                    if (data.changes)
                        Object.values(data.changes).filter((c: any) => c.field === 'years_pastV0').forEach((c: any) => {
                            mod.add({
                                type: "setVenteFutur",
                                Produit_ID: c.key,
                                val: c.newValue
                            })
                        });
                }
                if (stateDeltaRaw) {
                    const deltas = JSON.parse(stateDeltaRaw);
                    for (const delta of deltas) {
                        if (delta.type !== 'modificationsRaw')
                            continue;
                        delta.payload.filter((c: any) => c.field === 'years_pastV0').forEach((c: any) => {
                            mod.add({
                                type: "setVenteFutur",
                                Produit_ID: c.key,
                                val: c.value
                            })
                        });
                    }
                }
                store.commit("modificationsRaw", mod.mods)
                await store.dispatch("createSave", new Date().toLocaleString());
                break;
            case "2":
                if (stateRaw) {
                    const data = JSON.parse(stateRaw);
                    store.replaceState({
                        ...store.state,
                        ...data,
                        _: store.state._
                    });
                }
                if (stateDeltaRaw) {
                    const deltas = JSON.parse(stateDeltaRaw);
                    for (const delta of deltas) {
                        store.commit(delta.type, delta.payload);
                    }
                }
                await store.dispatch("refresh",true)
                break;
            case "3":
                if (stateRaw) {
                    const data = JSON.parse(stateRaw);
                    store.replaceState({
                        ...store.state,
                        ...data,
                        _: store.state._
                    });
                }
                if (stateDeltaRaw) {
                    const deltas = JSON.parse(stateDeltaRaw);
                    for (const delta of deltas) {
                        store.commit(delta.type, delta.payload);
                    }
                }
                break;
            default:
                store.commit("_log", "State could not be loaded");
        }
    } catch (e) {
        console.error(e);
    }
    
    store.subscribe(function (mutation, state) {
        if (mutation.type.startsWith("_"))
            return;
        //console.log(mutation);
        
        const stateDeltaRaw = localStorage.getItem('stateDelta');
        const deltas = stateDeltaRaw ? JSON.parse(stateDeltaRaw) : [];
        
        deltas.push(mutation);
        
        if (deltas.length > 10) {
            localStorage.setItem('state', JSON.stringify({
                ...store.state,
                _: undefined
            }));
            deltas.length = 0;
        }
        
        localStorage.setItem('stateDelta', JSON.stringify(deltas));
        localStorage.setItem('version', '3');
    })
    
    const app = createApp(App);
    
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
    
    app.use(store);
    app.use(router);
    
    console.log(app.config.globalProperties)
    
    app.mount('#app');
    
    await store.dispatch('refresh');
})();
