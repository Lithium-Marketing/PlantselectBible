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

export const $pastTitle = {
	years_pastM0: "Mort " + currentYear,
	years_pastM1: "Mort " + (currentYear - 1),
	years_pastM2: "Mort " + (currentYear - 2),
	years_pastVe0: "Vente " + currentYear,
	years_pastVe1: "Vente " + (currentYear - 1),
	years_pastVe2: "Vente " + (currentYear - 2),
	years_pastA0: "Achat " + currentYear,
	years_pastA1: "Achat " + (currentYear - 1),
	years_pastA2: "Achat " + (currentYear - 2),
	years_pastV0: "Vendant " + currentYear,
	years_pastV1: "Vendant " + (currentYear - 1),
	years_pastV2: "Vendant " + (currentYear - 2),
	years_pastT0: "Transport " + currentYear,
	years_pastT1: "Transport " + (currentYear - 1),
	years_pastT2: "Transport " + (currentYear - 2),
	years_pastC0: "Coutant " + currentYear,
	years_pastC1: "Coutant " + (currentYear - 1),
	years_pastC2: "Coutant " + (currentYear - 2),
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
	app.config.globalProperties.$pastTitle = $pastTitle;
	app.config.globalProperties.$money = $money;
	app.config.globalProperties.$value = $value;
	app.config.globalProperties.$valueI = $valueI;
	app.config.globalProperties.$date = $date;
	app.config.globalProperties.$load = $load;
}
