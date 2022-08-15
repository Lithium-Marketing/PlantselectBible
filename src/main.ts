import {createApp, watchEffect} from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

import "./style.scss";
import "bootstrap/dist/css/bootstrap.min.css"
import moment from "moment";
import {ContextMenu} from "@/helper/ContextMenu";
import {Services} from "@/services";
import {Const} from "@/helper/Const";
import {createMyServices} from "@/config/dataConfig";
import {LogService} from "@/services/logService";
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

import { faGear } from '@fortawesome/free-solid-svg-icons';
library.add(faGear)


const logger = LogService.logger({name: "main"})

ContextMenu.init();
moment.locale('fr');



if(!store.state.mysqlLogin.host&&process.env.VUE_APP_DB_HOST){
	store.state.mysqlLogin = {
		database: process.env.VUE_APP_DB_NAME,
		user: process.env.VUE_APP_DB_USR,
		password: process.env.VUE_APP_DB_PWD,
		host: process.env.VUE_APP_DB_HOST
	};
}

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
				logger.warn("State could not be loaded");
		}
	} catch (e) {
		logger.error(e);
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
	app.use(createMyServices());
	app.use(store);
	app.use(router);
	app.component('font-awesome-icon', FontAwesomeIcon);

	app.config.globalProperties.$methods = {
		scrollToTop: function () {
			window.scrollTo(0,0);
		}
	}
	
	Object.assign(window, app.config.globalProperties);
	console.log(app.config.globalProperties);
	watchEffect(() => {
		// @ts-ignore
		logger.log($services.data.get("produits", 1001).value);
	}, {
		onTrigger: console.log
	});
	
	
	app.mount('#app');
	
	//await store.dispatch('refresh');
})();

window.addEventListener('error', evt => Services.registerFatalError(evt.error));

process.on("uncaughtException", error => Services.registerFatalError(error));
process.on("unhandledRejection", error => Services.registerFatalError(error));
