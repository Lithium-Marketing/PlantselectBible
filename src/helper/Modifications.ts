import {Store} from "vuex";
import {Price, PriceTitle, StoreState} from "@/store";
import {toText} from "@/helper/Const";
import {JobOLD} from "@/helper/Job";
import {CacheReactive} from "@/helper/Cache";

class Helper {
	store: Store<StoreState>;
	
	constructor(store: Store<StoreState>) {
		this.store = store;
	}
	
	getMainPrice(prodID: number | string, pricesByProduct?: Record<any, Price[]>): Price;
	getMainPrice(): PriceTitle;
	
	/**
	 * return main priceTitle unless prodId is provided. Then the main price of the product will be returned;
	 * @param prodID
	 * @param pricesByProduct
	 */
	getMainPrice(prodID?: number | string, pricesByProduct?: Record<any, Price[]>) {
		if (prodID === undefined)
			return this.store.state._.priceTitles[1]
		
		const prices = (pricesByProduct ? pricesByProduct[prodID] : Object.values(this.store.state._.prices))?.filter(p => {
			return p.Produit_ID == prodID && p.Prix_ID == this.store.state._.priceTitles[1].ID;
		});
		
		if (!prices || !prices.length)
			return undefined;
		
		if (prices.length !== 1)
			throw new Error(JSON.stringify(prices));
		
		return this.store.state._.prices[prices[0].ID];//needed to have update when price change
	}
	
	
}

export class Modifications extends Helper {
	public readonly mods: Record<any, Modification> = {};
	
	//methods
	
	start(cb: () => boolean, autoCommit = true) {
		const job = new JobOLD(cb);
		job.start().then(() => {
			if (autoCommit)
				this.commit()
		});
	}
	
	add(mod: Modification) {
		let modId = mod.type;
		switch (mod.type) {
			case "setAchat":
				modId += "." + mod.OA_ID + "." + mod.Produit_ID;
				break;
			case "setCost":
				modId += "." + mod.OA_ID;
				break;
			case "setOAColor":
				modId += "." + mod.OA_ID + "." + mod.Produit_ID + "." + mod.colorType;
				break;
			case "setVenteFutur":
				modId += "." + mod.Produit_ID;
				break;
			case "setProductColor":
				modId += "." + mod.Produit_ID;
				break;
			case "setPriceOne":
				modId += "." + mod.Produit_ID;
				break;
			case "setPrice":
				modId += "." + mod.Produit_ID + "." + mod.Prix_ID;
				break;
			case "setNote":
				modId += "." + mod.OA_ID;
				break;
			default:
				throw new Error();
		}
		
		this.mods[modId] = mod;
		return this;
	}
	
	async commit(dispatch: boolean = true) {
		this.store.commit("modifications", this.mods);
		if (dispatch)
			await this.store.dispatch("modifications", {
				mods: this.mods,
				showLoading: Object.entries(this.mods).length > 5
			});
		Object.keys(this.mods).forEach((key) => {
			if (this.mods.hasOwnProperty(key))
				delete this.mods[key];
		});
	}
}

export class ModificationsCompiler extends Helper {
	private mods: Record<any, Change> = {};
	private failed: Modification[] = [];
	public readonly cache: CacheReactive;
	
	constructor(store: Store<StoreState>) {
		super(store);
		this.cache = new CacheReactive(store);
	}
	
	add(modId: string | number, mod: Change) {
		//if(!modId)
		//    modId = mod.key ? [mod.resource, mod.key, mod.field].join(".") : Date.now();
		
		this.mods[modId] = mod;
	}
	
	apply(mod: Modification) {
		try {
			return match(mod, actions, this);
		} catch (e) {
			//console.error(e);
			this.store.commit('_log', e);
			this.failed.push(mod)
		}
	}
	
	async commit(progress?: (number) => void) {
		const me = this;
		
		//this.store.commit("modifications", Object.freeze(this.mods));
		this.store.commit("failed", Object.freeze(this.failed));
		
		const entries = Object.entries(this.mods);
		let i = 0;
		const n = Math.min(100, entries.length / 100);
		const mod = Math.ceil(entries.length / n);
		
		await new JobOLD(function modificationCompilerCommitJob() {
			const len = Math.min(mod, entries.length - (mod * i))
			
			me.store.commit("_changes", Object.entries(me.mods).slice(mod * i, mod * i + len).reduce((a, v) => {
				a[v[0]] = v[1];
				return a;
			}, {}));
			
			++i;
			if (progress)
				progress(i / n)
			if (i >= n)
				return true;
		}).start();
		
		this.failed = [];
		this.mods = {};
	}
	
}

const actions: ModificationsI = {
	setPriceOne(payload, compiler) {
		actions.setPrice({
			...payload,
			type: "setPrice",
			Prix_ID: compiler.getMainPrice().ID
		}, compiler);
	},
	
	setPrice(payload, compiler) {
		let val: number | string = typeof payload.val === "string" ? parseFloat(payload.val) : payload.val;
		val = Math.ceil((val * 100) / 5 - 0.01) * 5 / 100;//ceil to 5 cent
		val = isNaN(val) ? undefined : val.toFixed(2);
		
		const price = compiler.cache.prices(payload.Produit_ID, payload.Prix_ID);
		
		if (!price || price.ID < 0) {
			compiler.add(["prices", payload.Prix_ID, "produit", payload.Produit_ID, "Prix"].join("."), {
				changes: [
					{
						create: -Date.now(),
						resource: "prices",
						value: val ? {
							Prix: val,
							Prix_ID: payload.Prix_ID,
							Produit_ID: payload.Produit_ID,
						} : undefined// undefined value here skip change creation in store
					}
				],
				
				sql: `INSERT INTO produits_prix (
					                                Prix, Prix_ID, Produit_ID, Visible
				                                )
				      VALUES (
					             ${val}, ${payload.Prix_ID}, ${payload.Produit_ID}, 1
				             )`,
				description: {
					type: "create",
					resource: `Prix Vendant ${compiler.store.state._.priceTitles[payload.Prix_ID].Titre}`,
					on: compiler.store.state._.products[payload.Produit_ID].Variete,
					val
				}
			})
		} else {
			compiler.add(["prices", price.ID, "Prix"].join("."), {
				changes: [
					{
						resource: "prices",
						field: "Prix",
						key: price.ID,
						value: val || "0.00",
					}
				],
				sql: `UPDATE produits_prix
				      SET Prix=${val || "0.00"}
				      WHERE
					      ID = ${price.ID}`,
				description: {
					type: "mod",
					resource: `Prix Vendant ${compiler.store.state._.priceTitles[payload.Prix_ID].Titre}`,
					on: compiler.store.state._.products[payload.Produit_ID].Variete,
					val,
					old: price.PrixO
				}
			})
		}
	},
	
	setCost(payload, compiler) {
		let val: number | string = typeof payload.val === "string" ? parseFloat(payload.val) : payload.val;
		val = val.toFixed(2);
		
		compiler.add(["oas", payload.OA_ID, "years_pastC0"].join("."), {
			changes: [
				{
					resource: "oas",
					field: "years_pastC0",
					key: payload.OA_ID,
					value: val,
				}
			],
			
			sql: `UPDATE matieres_premieres
			      SET Prix=${val}
			      WHERE
					      ID = (
					           SELECT
						           Equivalence
					           FROM ordres_assemblages
					           WHERE
						           ID = ${payload.OA_ID}
					           )`,
			description: {
				type: "mod",
				resource: `Cout matiere premiere`,
				on: String(payload.OA_ID),
				old: compiler.store.state._.oas[payload.OA_ID].years_pastC0,
				val
			},
		});
	},
	
	setVenteFutur(payload, compiler) {
		const product = compiler.store.state._.products[payload.Produit_ID];
		if (!product)
			return;
		
		const original = product?.['bible.VendantO'];
		const ival = parseFloat(payload.val);
		const val = isNaN(ival) ? "" : ival.toFixed(2);
		
		const OA_ID = "NULL";
		const Produit_ID = `${payload.Produit_ID}`;
		
		compiler.add(["products", payload.Produit_ID, "bible.Vendant"].join("."), {
			changes: [
				{
					resource: "products",
					field: "bible.Vendant",
					key: payload.Produit_ID,
					value: val,
				}
			],
			
			sql: `
				INSERT INTO bible
				(
					OA, Produit, Vendant
				)
				VALUES (
					       ${OA_ID}, ${Produit_ID}, ${val === "" ? "''" : val}
				       ) ON DUPLICATE KEY
				UPDATE
					Vendant=${val === "" ? "''" : val}
            `,
			description: {
				type: "mod",
				resource: `Vendant Futur du produit`,
				on: product?.Variete,
				old: original,
				val
			}
		});
	},
	
	setAchat(payload, compiler) {
		const original = compiler.store.state._.products[payload.Produit_ID]['bible.QuantiteO'];
		const ival = parseInt(payload.val);
		const val = isNaN(ival) ? original : ival.toFixed(0);
		
		const OA_ID = payload.OA_ID === undefined ? "NULL" : `${payload.OA_ID}`
		const Produit_ID = payload.OA_ID === undefined ? `${payload.Produit_ID}` : "NULL"
		
		compiler.add(["oas", payload.OA_ID, "bible.Quantite"].join("."), {
			changes: [
				{
					resource: "oas",
					field: "bible.Quantite",
					key: payload.OA_ID,
					value: val,
				}
			],
			
			sql: `
				INSERT INTO bible
				(
					OA, Produit, Quantite
				)
				VALUES (
					       ${OA_ID}, ${Produit_ID}, ${val}
				       ) ON DUPLICATE KEY
				UPDATE
					Quantite=${val}
            `,
			description: {
				type: "mod",
				resource: `qty d'achat`,
				on: compiler.store.state._.products[payload.Produit_ID]?.Variete,
				old: original,
				val
			}
		});
	},
	
	setNote(payload, compiler) {
		const original = compiler.store.state._.oas[payload.OA_ID]['NoteO'];
		
		const OA_ID = `${payload.OA_ID}`
		const Produit_ID = "NULL"
		
		compiler.add(["oas", payload.OA_ID, "Note"].join("."), {
			changes: [
				{
					resource: "oas",
					field: "Note",
					key: payload.OA_ID,
					value: payload.val,
				}
			],
			
			sql: `
				INSERT INTO bible
				(
					OA, Produit, Note
				)
				VALUES (
					       ${OA_ID}, ${Produit_ID}, '${payload.val}'
				       ) ON DUPLICATE KEY
				UPDATE
					Note=
				VALUES (Note)
            `,
			description: {
				type: "mod",
				resource: `note`,
				on: OA_ID,
				old: original,
				val: payload.val
			}
		});
	},
	
	setOAColor(payload, compiler) {
		const OA_ID = payload.OA_ID === undefined ? "NULL" : `${payload.OA_ID}`
		const Produit_ID = payload.OA_ID === undefined ? `${payload.Produit_ID}` : "NULL"
		
		const color: Color = JSON.parse(compiler.store.state._.oas[payload.OA_ID]['bible.Color']) || {};
		const colorO: Color = JSON.parse(compiler.store.state._.oas[payload.OA_ID]['bible.ColorO']) || {};
		
		color[payload.colorType] = payload.val;
		const val = JSON.stringify(color);
		
		const changes: { key, cOld, cNew }[] = [];
		const keys = new Set<string>(Object.keys(color));
		Object.keys(colorO).forEach(k => keys.add(k))
		for (const key of keys) {
			if (colorO[key] !== color[key])
				changes.push({
					key,
					cOld: colorO[key],
					cNew: color[key],
				})
		}
		
		const str = changes.map(v => {
			const key = toText(v.key);
			const cOld = toText(v.cOld);
			const cNew = toText(v.cNew);
			return `${key}= ${cOld} -> ${cNew}`;
		}).join(' ; ');
		
		compiler.add(["oas", payload.OA_ID, "bible.Color"].join("."), {
			changes: [{
				resource: "oas",
				field: "bible.Color",
				key: payload.OA_ID,
				value: val,
			}],
			sql: `
				INSERT INTO bible
				(
					OA, Produit, Color
				)
				VALUES (
					       ${OA_ID}, ${Produit_ID}, '${val}'
				       ) ON DUPLICATE KEY
				UPDATE
					Color='${val}'
            `,
			description: {
				type: "mod",
				resource: `Couleur OA`,
				on: payload.OA_ID,
				val: str
			}
		});
		return this;
	},
	setProductColor(payload, compiler) {
		compiler.add(["products", payload.Produit_ID, "Color"].join("."), {
			changes: [{
				resource: "products",
				field: "Color",
				key: payload.Produit_ID,
				value: payload.val,
			}],
			sql: `
				UPDATE produits
				SET Color='${payload.val}'
				WHERE
					ID = ${payload.Produit_ID}
            `,
			description: {
				type: "mod",
				resource: `Couleur produit`,
				on: compiler.store.state._.products[payload.Produit_ID]?.Variete,
				old: compiler.store.state._.products[payload.Produit_ID].ColorO,
				val: payload.val
			}
		});
		return this;
	}
};

export type Modification = {
	type: "setPriceOne",
	val: string | number,
	Produit_ID: string | number
} | {
	type: "setPrice",
	val: string | number,
	Produit_ID: string | number,
	Prix_ID: string | number
} | {
	type: "setCost",
	val: string | number;
	OA_ID: string | number;
} | {
	type: "setVenteFutur",
	val: any;
	Produit_ID: any
} | {
	type: "setAchat",
	OA_ID: any;
	val: any;
	Produit_ID: any
} | {
	type: "setNote",
	OA_ID: any;
	val: any;
} | {
	type: "setOAColor",
	val: any;
	OA_ID: any;
	Produit_ID?: any;
	colorType?: keyof Color;
} | {
	type: "setProductColor",
	val: any;
	Produit_ID: any;
};

type ModificationsI = Handler<OfUnion<Modification>>;

export type ChangeDef = {
	create: number
	resource: string,
	value: any
} | {
	resource: string,
	field: string | number,
	key: string | number,
	value: any
}

export type Change = {
	changes: ChangeDef[],
	sql: string,
	description: {
		type: "create" | "mod",
		resource: string,
		on: string,
		old?: string,
		val: string
	}
};

type Color = {
	Variete: string,
	Inventaire: string,
	a0: string,
	v0: string,
	dateReception: string,
	qtyF: string
}

type OfUnion<T extends { type: string }> = {
	[P in T['type']]: Extract<T, { type: P }>
}
type Handler<T> = {
	[P in keyof T]: (arg: T[P], compiler: ModificationsCompiler) => any
}

function match<T extends { type: string }, H extends Handler<OfUnion<T>>>(
	obj: T,
	handler: H,
	compiler: ModificationsCompiler
): ReturnType<H[keyof H]> {
	return handler[obj.type as keyof H]?.(obj as any, compiler);
}
