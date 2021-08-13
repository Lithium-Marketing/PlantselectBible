import {createApp} from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

import "./style.scss";
import moment from "moment";

const stateRaw = localStorage.getItem('state');
const stateDeltaRaw = localStorage.getItem('stateDelta');
const stateVersion = localStorage.getItem('version');

try {
    switch (stateVersion) {
        case "1":
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
            store.commit("log", "State could not be loaded");
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
    localStorage.setItem('version', '1');
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
    return moment.unix(val).format('lll')
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

app.mount('#app');
