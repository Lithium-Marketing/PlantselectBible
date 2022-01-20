<template>
	<div style="display: flex;flex-direction: column">
		<div v-for="price of prices" class="priceCalc">
			<span>{{ price.Titre }}.</span>
			<input :value="vals[price.ID]" @change="setVal($event.target.value,price)" :disabled="price.Titre==='1'" placeholder="-">
			<strong>%</strong>
		</div>
		<hr>
		<button @click="apply(true,false)" style="margin: auto">
			Appliquer sur tout les produits
		</button>
		<hr>
		<button @click="apply(true,true)" style="margin: auto" disabled>
			Appliquer sur les produits avec un vendant futur
		</button>
		<LoadingBar :progress="progress"/>
	</div>
</template>

<script lang="ts">

import {computed, defineComponent, ref} from "vue";
import {useStore} from "vuex";
import {Modifications} from "@/helper/Modifications";
import {StoreState} from "@/store";
import LoadingBar from "@/components/LoadingBar.vue";
import {MyTablesConfig, MyTablesDef} from "@/dataConfig";
import {useServices} from "@/services";
import {PricesId} from "@/helper/Const";
import {LogService} from "@/services/logService";

const logger = LogService.logger({name: "PriceCalc"});

export default defineComponent({
	name: 'PriceCalc',
	components: {LoadingBar},
	setup() {
		//const store = useStore<StoreState>();
		const services = useServices<MyTablesDef, MyTablesConfig>()

		const vals = ref({});
		const mainPriceId = PricesId.Main;
		const progress = ref(0);

		const prices = computed(() => {
			return services.data.raw.prix.value;
		})

		return {
			progress,

			vals,
			prices,
			setVal(val, p) {
				logger.trace("setVal",val,p)
				val = parseFloat(val);
				if (Number.isNaN(val))
					vals.value[p.ID] = undefined;
				else
					vals.value[p.ID] = val;
			},

			apply(all: boolean, vF: boolean) {
				Object.values(services.data.raw.produits.value).forEach(p => {
					const prod_prices = services.cache.byProd.value[p.ID].value.prices;
					const mainPrice = prod_prices?.[PricesId.Main];
					if (mainPrice === undefined)
						logger.warn(`Product ${p.Code} doesn't have a price 1`);
					else {
						for (const id in prices.value) {
							if(vals.value[id]===undefined)
								continue;

							const price = prod_prices[id];
							if(price===undefined)
								/*services.modification.create("produits_prix",{
									Prix: mainPrice.Prix * vals.value[id],
									Prix_ID: id,
									Produit_ID: p.ID,
									Visible: 1
								},"Calculateur de prix")*/console.log("false");
							else
								services.modification.set("produits_prix", price.ID, "Prix", mainPrice.Prix * vals.value[id], "Calculateur de prix")
						}
					}
				});
			}
		};
	}
});

</script>

<style scoped lang="scss">

.priceCalc {
	> div {
		margin-bottom: .1rem;
	}

	span {
		font-size: 1.2rem;
		display: inline-block;
		width: 3rem;
	}

	input {
		font-size: 1.2rem;
		width: 5rem;
		padding: .2rem .6rem;
	}
}

</style>
