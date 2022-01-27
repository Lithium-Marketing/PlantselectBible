import {BaseMod, Operations} from "@/services/ModificationService";
import {MyServices, MyTablesDef} from "@/config/dataConfig";
import {PricesId} from "@/helper/Const";

export class PriceCalc implements BaseMod<{
    vals: Record<number, number>,
    vF: boolean
}, MyServices, MyTablesDef> {
    
    getId(payload: { vals: Record<number, number>; vF: boolean }, services: MyServices) {
        return "priceCalc" + (payload.vF ? "F" : "P");
    }
    
    apply(payload: { vals: Record<number, number>; vF: boolean }, services: MyServices, op: Operations<MyTablesDef>) {
        const prices = services.data.raw.prix.value;
        const {vals, vF} = payload;
        
        Object.values(services.data.raw.produits.value).forEach(p => {
            const prod_prices = services.cache.byProd.value[p.ID].value.prices;
            const bible = services.data.raw.bible.value[services.data.indexesByTable.bible.Produit.value[p.ID]?.[0]];
            const mainPrice = vF ? bible?.Vendant : prod_prices?.[PricesId.Main]?.Prix;
            if (mainPrice !== undefined)
                for (const id in prices) {
                    if (vals[id] === undefined)
                        continue;
                    
                    const price = prod_prices?.[id];
                    if (price === undefined) {
                        const price_id = services.modification.createId();
                        op.mod("produits_prix", "Prix", price_id, mainPrice * vals[id])
                        op.mod("produits_prix", "Prix_ID", price_id, id)
                        op.mod("produits_prix", "Produit_ID", price_id, p.ID)
                        op.mod("produits_prix", "Visible", price_id, 1)
                    } else
                        op.mod("produits_prix", "Prix", price.ID, mainPrice * vals[id])
                }
        });
    
        return "priceCalc" + (payload.vF ? "F" : "P");
    }
    
}
