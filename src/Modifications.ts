import {Store} from "vuex";
import {Price, PriceTitle, StoreState} from "@/store";
import {toText} from "@/Const";

export class Job {
    private cb: () => boolean;
    private limit: number;
    private timeout: any;
    public readonly promise: Promise<void>;
    private resolve: (value: (PromiseLike<void> | void)) => void;
    private reject: (reason?: any) => void;
    
    constructor(cb: () => boolean, limit = 10000) {
        this.cb = cb;
        this.limit = limit;
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        })
    }
    
    start() {
        if (this.timeout)
            clearTimeout(this.timeout);
        
        this.timeout = setTimeout(() => {
            const start = Date.now();
            while (Date.now() - start < 50)
                if (this.cb())
                    return this.resolve();
                else if (this.limit-- <= 0)
                    return this.reject(new Error("limit reached"))
            
            this.timeout = false;
            this.start();
        }, 0);
        
        return this.promise;
    }
}

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
            return this.store.state.priceTitles[1]
        
        const prices = (pricesByProduct ? pricesByProduct[prodID] : Object.values(this.store.state.prices))?.filter(p => {
            return p.Produit_ID == prodID && p.Prix_ID == this.store.state.priceTitles[1].ID;
        });
        
        if (!prices || !prices.length)
            return undefined;
        
        if (prices.length !== 1)
            throw new Error(JSON.stringify(prices));
        
        return this.store.state.prices[prices[0].ID];//needed to have update when price change
    }
    
    
}

export class Modifications extends Helper {
    public readonly mods: Record<any, ModificationType> = {};
    
    //methods
    
    start(cb: () => boolean, autoCommit = true) {
        const job = new Job(cb);
        job.start().then(() => {
            if (autoCommit)
                this.commit()
        });
    }
    
    add(mod: ModificationType) {
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
        this.store.commit("modificationsRaw", this.mods);
        if (dispatch)
            await this.store.dispatch("modificationsRaw", {
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
    private readonly mods: Record<any, Modification> = {};
    
    add(modId: string | number, mod: Modification) {
        //if(!modId)
        //    modId = mod.key ? [mod.resource, mod.key, mod.field].join(".") : Date.now();
        
        this.mods[modId] = mod;
    }
    
    apply(mod: ModificationType) {
        return match(mod, actions, this);
    }
    
    commit() {
        this.store.commit("modifications", this.mods);
        Object.keys(this.mods).forEach((key) => {
            if (this.mods.hasOwnProperty(key))
                delete this.mods[key];
        });
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
        
        const price = Object.values(compiler.store.state.prices).filter(p => {
            return p.Produit_ID == payload.Produit_ID && p.Prix_ID == payload.Prix_ID;
        })[0];
        
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
                text: `Creation prix ${compiler.store.state.priceTitles[payload.Prix_ID].Titre} de ${compiler.store.state.products[payload.Produit_ID].Variete}: ${val}`
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
                text: `Changer prix ${compiler.store.state.priceTitles[price.Prix_ID].Titre} de ${compiler.store.state.products[price.Produit_ID].Variete}: ${price.PrixO} -> ${val || "0.00"}`
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
            text: `Modification cout de la matiere premiere du oa ${payload.OA_ID}: ${compiler.store.state.oas[payload.OA_ID].years_pastC0} -> ${val}`
        });
    },
    
    setVenteFutur(payload, compiler) {
        const product = compiler.store.state.products[payload.Produit_ID];
        if(!product)
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
            text: `Modification du Vendant Futur du produit ${product?.Code} :${original} -> ${val}`
        });
    },
    
    setAchat(payload, compiler) {
        const original = compiler.store.state.products[payload.Produit_ID]['bible.QuantiteO'];
        const ival = parseInt(payload.val);
        const val = isNaN(ival) ? original : ival.toFixed(0);
        
        const OA_ID = payload.OA_ID === undefined ? "NULL" : `${payload.OA_ID}`
        const Produit_ID = payload.OA_ID === undefined ? `${payload.Produit_ID}` : "NULL"
        
        compiler.add(["products", payload.Produit_ID, "bible.Quantite"].join("."), {
            changes: [
                {
                    resource: "products",
                    field: "bible.Quantite",
                    key: payload.Produit_ID,
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
					Quantite=
				VALUES (Quantite)
            `,
            text: `Modification de la qty d'achat du produit ${compiler.store.state.products[payload.Produit_ID].Code} :${original} -> ${val}`
        });
    },
    
    setNote(payload, compiler) {//TODO note
        const original = compiler.store.state.oas[payload.OA_ID]['NoteO'];
        
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
            text: `Modification de la note du oa ${compiler.store.state.oas[payload.OA_ID].ID}`
        });
    },
    
    setOAColor(payload, compiler) {
        const OA_ID = payload.OA_ID === undefined ? "NULL" : `${payload.OA_ID}`
        const Produit_ID = payload.OA_ID === undefined ? `${payload.Produit_ID}` : "NULL"
        
        const color: Color = JSON.parse(compiler.store.state.oas[payload.OA_ID]['bible.Color']) || {};
        const colorO: Color = JSON.parse(compiler.store.state.oas[payload.OA_ID]['bible.ColorO']) || {};
        
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
					       ${OA_ID}, ${Produit_ID}, ${val}
				       ) ON DUPLICATE KEY
				UPDATE
					Quantite=
				VALUES (Quantite)
            `,
            text: `Modification de la coleur du OA ${payload.OA_ID} du produit ${compiler.store.state.products[payload.Produit_ID].Code}: ${str}`
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
				SET Color=${payload.val}
				WHERE
					ID = ${payload.Produit_ID}
            `,
            text: `Modification de la coleur du produit ${compiler.store.state.products[payload.Produit_ID].Code} :${compiler.store.state.products[payload.Produit_ID].ColorO} -> ${payload.val}`
        });
        return this;
    }
};

export type ModificationType = {
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

type ModificationsI = Handler<OfUnion<ModificationType>>;

export type Change = {
    create: number
    resource: string,
    value: any
} | {
    resource: string,
    field: string | number,
    key: string | number,
    value: any
}

export type Modification = {
    changes: Change[],
    sql: string,
    text: string
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
