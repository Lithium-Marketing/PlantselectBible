import {createApp} from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

import "./style.scss";

const stateRaw = localStorage.getItem('state');
const stateDeltaRaw = localStorage.getItem('stateDelta');
const stateVersion = localStorage.getItem('version');

try {
    switch (stateVersion) {
        case "1":
            if (stateRaw) {
                const data = JSON.parse(stateRaw);
                store.replaceState({
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
    console.log(mutation);
    
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

createApp(App).use(store).use(router).mount('#app')
