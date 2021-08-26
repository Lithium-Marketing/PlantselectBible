<template>
	<div style="display: flex;flex-direction: column">
		<div v-for="price of prices" class="priceCalc">
			<span>{{ price.Titre }}.</span>
			<input :value="price.val" @change="setVal($event.target.value,price)" :disabled="price.Titre==='1'" placeholder="-">
			<strong>%</strong>
		</div>
		<hr>
		<button @click="apply(true)" style="margin: auto">
			Appliquer sur tout les produits
		</button>
		<hr>
		<button @click="apply(false)" style="margin: auto">
			Appliquer sur {{ n }} produits
		</button>
		<LoadingBar :progress="progress"/>
		<h2 v-if="n && n<1000">Produits affectés</h2>
		<ul v-if="n && n<1000" style="margin: auto">
			<li v-for="prod of prods" style="text-align: left">
				{{ prod?.Variete }}
			</li>
		</ul>
	</div>
</template>

<script lang="ts">

import {computed, defineComponent, ref} from "vue";
import {useStore} from "vuex";
import {Modifications} from "@/Modifications";
import {StoreState} from "@/store";
import LoadingBar from "@/components/LoadingBar.vue";

export default defineComponent({
	name: 'PriceCalc',
	components: {LoadingBar},
	setup() {
		const store = useStore<StoreState>();

		const vals = ref({});
		const mainPriceId = computed(() => {
			return Object.values(store.state.priceTitles).filter(p => p.Titre === '1')[0].ID
		})

		const prods = computed(() => {
			return Object.values(store.state.modifications).filter(mod => {
				return mod.changes.filter(c => c.resource === 'prices').length;
			}).flatMap(mod => {
				return mod.changes.filter(c => c.resource === 'prices').map(c => store.state.products[store.state.prices["create" in c ? c.create : c.key]?.Produit_ID]);
			});
		});

		const progress = ref(0);

		function applyFor(prod, priceByProdID, modifications: Modifications) {
			const prices = priceByProdID[prod.ID];
			if (!prices || !prices[mainPriceId.value])
				return store.dispatch("log", `Produit ${prod.Code} n'a pas de Prix 1`);

			const main = parseFloat(prices[mainPriceId.value].Prix);

			Object.entries(vals.value).forEach(([key, val]) => {
				modifications.add({
					type: "setPrice",
					val: main * ((val as number) / 100),
					Prix_ID: key,
					Produit_ID: prod.ID
				})
			})
		}

		return {
			progress,

			vals,
			prices: computed(() => {
				return Object.values(store.state.priceTitles).map(p => {
					return {
						...p,
						val: vals.value[p.ID]
					};
				});
			}),
			setVal(val, p) {
				val = parseFloat(val);
				if (Number.isNaN(val))
					vals.value[p.ID] = undefined;
				else
					vals.value[p.ID] = val;
			},

			n: computed(() => prods.value.length),
			prods,

			apply(all) {
				const modifications = new Modifications(store);

				const priceByProdID = Object.values(store.state.prices).reduce((a, v) => {
					a[v.Produit_ID] = a[v.Produit_ID] || {};
					a[v.Produit_ID][v.Prix_ID] = (v);
					return a;
				}, {});

				if (all) {
					const prods = Object.values(store.state.products);
					const len = prods.length;
					let i = 0;
					modifications.start(() => {
						if (!(i % 100) || i + 1 === len)
							progress.value = (i + 1) / len;

						applyFor(prods[i], priceByProdID, modifications);
						return ++i === len;
					})
				} else {
					prods.value.forEach(p => applyFor(p, priceByProdID, modifications))
					modifications.commit();
				}
			},
			applyFor
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
