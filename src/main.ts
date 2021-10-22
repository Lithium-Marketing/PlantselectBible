import {createApp, watchEffect} from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

import "./style.scss";
import moment from "moment";
import {ContextMenu} from "@/helper/ContextMenu";
import { ServicesPlugin} from "@/services";
import {Const} from "@/helper/Const";

ContextMenu.init();
moment.locale('fr');

const tables = {
    "produits": {},
    "ordres_assemblages": {},
    "bible": {},
    "bible_saves": {},
    "clients": {},
    "clients_commandes": {},
    "clients_commandes_produits": {},
    "produits_prix": {},
    "Archive": {},
} as const;
export type Tables = typeof tables;

(async function () {
    const stateRaw = localStorage.getItem('state');
    const stateDeltaRaw = localStorage.getItem('stateDelta');
    const stateVersion = localStorage.getItem('version');
    
    try {
        switch (stateVersion) {
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
                console.log("State could not be loaded");
        }
    } catch (e) {
        console.error(e);
    }
    
    store.subscribe(function storeSubscriber(mutation, state) {
        if (mutation.type.startsWith("_"))
            return;
        //console.log(mutation);
        
        localStorage.setItem('state', JSON.stringify({
            ...store.state,
            _: undefined
        }));
        
        localStorage.setItem('version', '3');
    });
    
    const app = createApp(App);
    
    app.use(Const);
    app.use(ServicesPlugin(tables));
    app.use(store);
    app.use(router);
    
    Object.assign(window,app.config.globalProperties);
    console.log(app.config.globalProperties);
    watchEffect(()=>{
        // @ts-ignore
        console.log($services.data.get("produits",1001).value);
    },{
        onTrigger: console.warn
    });
    
    
    app.mount('#app');
    
    await store.dispatch('refresh');
})();
