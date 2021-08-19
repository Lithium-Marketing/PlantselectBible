import {Store} from "vuex";
import {toText} from "@/Const";

class Job {
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

export class Modifications {
    private readonly mods = [];
    private store: Store<any>;
    
    constructor(store: Store<any>) {
        this.store = store;
    }
    
    //methods
    
    start(cb: () => boolean, autoCommit = true) {
        const job = new Job(cb);
        job.start().then(() => {
            if (autoCommit)
                this.commit()
        });
    }
    
    add(mod) {
        const {
            sql,
            resource, key, field, text,
            value
        } = mod;
        
        const changeId = mod.changeId || (key ? [resource, key, field].join(".") : Date.now());
        
        this.mods.push({
            changeId,
            sql, text,
            resource, key, field,
            value
        });
    }
    
    commit() {
        this.store.commit("modificationsRaw", this.mods);
        this.mods.length = 0;
    }
    
    //helper
    
    /**
     * return main priceTitle unless prodId is provided. Then the main price of the product will be returned;
     * @param prodID
     */
    getMainPrice(prodID?: number | string) {
        if (prodID === undefined)
            return this.store.state.priceTitles[1]
        
        const prices = Object.values(this.store.state.prices as { [k: string]: any }).filter(p => {
            return p.Produit_ID == prodID && p.Prix_ID == this.store.state.priceTitles[1].ID;
        });
        
        if (!prices.length)
            return undefined;
        
        if (prices.length !== 1)
            throw new Error(JSON.stringify(prices));
        
        return prices[0];
    }
    
    //actions
    
    setPrice(payload: { val: any; key: string | number; Prix_ID: string | number; Produit_ID: string | number; }, vendant: boolean = false) {
        let val = payload.val;
        val = Math.ceil((val * 100) / 5 - 0.01) * 5 / 100;//ceil to 5 cent
        val = val.toFixed(2);
        
        const price = this.store.state.prices[payload.key];
        if (!price) {
            this.add({
                resource: vendant ? "products" : "prices",
                field: vendant ? "years_pastV0" : "Prix",
                value: val,
                sql: `INSERT INTO produits_prix (
					                                Prix, Prix_ID, Produit_ID, Visible
				                                )
				      VALUES (
					             ${val}, ${payload.Prix_ID}, ${payload.Produit_ID}, 1
				             )`,
                text: `Creation prix ${this.store.state.priceTitles[payload.Prix_ID].Titre} de ${this.store.state.products[payload.Produit_ID].Variete}: ${val}`
            })
        } else {
            this.add({
                resource: vendant ? "products" : "prices",
                field: vendant ? "years_pastV0" : "Prix",
                key: vendant ? payload.Produit_ID : price.ID,
                changeId: ["prices", price.ID, "Prix"].join("."),
                value: val,
                sql: `UPDATE produits_prix
				      SET Prix=${val}
				      WHERE
					      ID = ${price.ID}`,
                text: `Changer prix ${this.store.state.priceTitles[price.Prix_ID].Titre} de ${this.store.state.products[price.Produit_ID].Variete}: ${price.PrixO} -> ${val}`
            })
        }
        return this;
    }
    
    setCost(payload: { val: any; OA_ID: string | number; }) {
        const val = parseFloat(payload.val).toFixed(2);
        
        this.add({
            resource: "oas",
            field: "years_pastC0",
            key: payload.OA_ID,
            value: val,
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
            text: `Modification cout de la matiere premiere du oa ${payload.OA_ID}: ${this.store.state.oas[payload.OA_ID].years_pastC0} -> ${val}`
        });
        return this;
    }
    
    setVenteFutur(payload: { OA_ID: any; val: any; Produit_ID: any }) {
        const original = this.store.state.products[payload.Produit_ID]['bible.QuantiteO'];
        const ival = parseInt(payload.val);
        const val = isNaN(ival) ? original : ival.toFixed(0);
        
        const OA_ID = payload.OA_ID === undefined ? "NULL" : `${payload.OA_ID}`
        const Produit_ID = payload.OA_ID === undefined ? `${payload.Produit_ID}` : "NULL"
        
        this.add({
            resource: "products",
            field: "bible.Quantite",
            key: payload.Produit_ID,
            value: val,
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
            text: `Modification de la qty d'achat du produit ${this.store.state.products[payload.Produit_ID].Code} :${original} -> ${val}`
        });
        return this;
    }
    
    setAchat(payload: { OA_ID: any; val: any; Produit_ID: any }) {
        const original = this.store.state.products[payload.Produit_ID]['bible.QuantiteO'];
        const ival = parseInt(payload.val);
        const val = isNaN(ival) ? original : ival.toFixed(0);
        
        const OA_ID = payload.OA_ID === undefined ? "NULL" : `${payload.OA_ID}`
        const Produit_ID = payload.OA_ID === undefined ? `${payload.Produit_ID}` : "NULL"
        
        this.add({
            resource: "products",
            field: "bible.Quantite",
            key: payload.Produit_ID,
            value: val,
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
            text: `Modification de la qty d'achat du produit ${this.store.state.products[payload.Produit_ID].Code} :${original} -> ${val}`
        });
        return this;
    }
    
    setOAColor(payload: { val: any; OA_ID: any; Produit_ID?: any; type?: keyof Color; }) {
        const OA_ID = payload.OA_ID === undefined ? "NULL" : `${payload.OA_ID}`
        const Produit_ID = payload.OA_ID === undefined ? `${payload.Produit_ID}` : "NULL"
        
        console.log();
        const color: Color = JSON.parse(this.store.state.oas[payload.OA_ID]['bible.Color']) || {};
        const colorO: Color = JSON.parse(this.store.state.oas[payload.OA_ID]['bible.ColorO']) || {};
        
        color[payload.type] = payload.val;
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
        
        this.add({
            resource: "oas",
            field: "bible.Color",
            key: payload.OA_ID,
            value: val,
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
            text: `Modification de la coleur du OA ${payload.OA_ID} du produit ${this.store.state.products[payload.Produit_ID].Code}: ${str}`
        });
        return this;
    }
    
    setProductColor(payload: { val: any; Produit_ID: any; }) {
        this.add({
            resource: "products",
            field: "Color",
            key: payload.Produit_ID,
            value: payload.val,
            sql: `
				UPDATE produits
				SET Color=${payload.val}
				WHERE
					ID = ${payload.Produit_ID}
            `,
            text: `Modification de la coleur du produit ${this.store.state.products[payload.Produit_ID].Code} :${this.store.state.products[payload.Produit_ID].ColorO} -> ${payload.val}`
        });
        return this;
    }
}

type Color = {
    Variete: string,
    Inventaire: string,
    a0: string,
    v0: string,
    dateReception: string,
    qtyF: string
}