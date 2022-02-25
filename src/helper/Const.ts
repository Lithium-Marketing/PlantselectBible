import {Store} from "vuex";
import {MenuItemConstructorOptions} from "electron";
import {App} from "vue";
import moment from "moment";
import store from "@/store";
import router from "@/router";
import {LogService} from "@/services/logService";

const logger = LogService.logger({name: "Const"})

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
	Main = 1
}

export const currentYear = moment().add(7, "month").year();

////

const year = moment().add(7, 'M').year();

export const $pastTitle = {
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
}
export const $money = (val) => {
	return val ? (parseFloat(val).toFixed(2) + "$") : "-";
}
export const $value = (val) => {
	return val ? parseFloat(val).toFixed(2) : "-";
}
export const $valueI = (val) => {
	return val ? parseInt(val).toFixed(0) : "-";
}
export const $date = (val) => {
	if (!val)
		return "-";
	return moment.unix(val).format('ll')
}
export const $load = (oaID, prodID, tab = 'product') => {
	store.commit('load', {
		oaID: parseInt(oaID, 10),
		prodID: parseInt(prodID, 10),
		tab
	});
	return router.push({name: "Edit"})
};

export function Const(app: App, ...options: any[]): any {
	const year = moment().add(7, 'M').year();
	app.config.globalProperties.$pastTitle = $pastTitle;
	app.config.globalProperties.$money = $money;
	app.config.globalProperties.$value = $value;
	app.config.globalProperties.$valueI = $valueI;
	app.config.globalProperties.$date = $date;
	app.config.globalProperties.$load = $load;
}
