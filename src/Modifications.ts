import {Store} from "vuex";

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
        val = Math.ceil((val * 100) / 5) * 5 / 100;//ceil to 5 cent
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
        })
    }
}
