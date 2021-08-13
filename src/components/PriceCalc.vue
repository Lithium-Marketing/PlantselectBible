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
		<div class="progress">
			<span :style="{width:(progress*100)+'%'}"></span>
			<strong>{{ (progress * 100).toFixed(0) }}%</strong>
		</div>
		<h2 v-if="n && n<1000">Produits affectés</h2>
		<ul v-if="n && n<1000" style="margin: auto">
			<li v-for="prod of prods" style="text-align: left">
				{{ prod?.Variete }}
			</li>
		</ul>
	</div>
</template>

<script>

import {computed, defineComponent, ref} from "vue";
import {useStore} from "vuex";
import {Modifications} from "@/Modifications";

export default defineComponent({
	name: 'PriceCalc',
	components: {},
	setup() {
		const store = useStore();

		const vals = ref({});
		const mainPriceId = computed(() => {
			return Object.values(store.state.priceTitles).filter(p => p.Titre === '1')[0].ID
		})

		const prods = computed(() => {
			return Object.values(store.state.changes).filter(c => {
				return c.resourceKey === 'prices'
			}).map(c => store.state.products[store.state.prices[c.key]?.Produit_ID]);
		});

		const progress = ref(0);

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

						this.applyFor(prods[i], priceByProdID, modifications);
						return ++i === len;
					})
				} else {
					prods.value.forEach(p => this.applyFor(p, priceByProdID, modifications))
					modifications.commit();
				}
			},
			applyFor(prod, priceByProdID, modifications) {
				const prices = priceByProdID[prod.ID];
				if (!prices || !prices[mainPriceId.value])
					return store.dispatch("log", `Produit ${prod.Code} n'a pas de Prix 1`);

				const main = parseFloat(prices[mainPriceId.value].Prix);

				Object.entries(vals.value).forEach(([key, val]) => {
					modifications.setPrice({
						key: prices[key]?.ID,
						val: main * (val / 100),
						Prix_ID: key,
						Produit_ID: prod.ID
					})
				})
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

.progress {
	position: relative;
	z-index: 0;
	width: 100%;
	max-width: 500px;
	height: 1.5rem;
	margin: 2rem auto;
	border-radius: 5px;
	overflow: hidden;
	text-align: center;
	background-color: #f2f2f2;

	strong{
		position: relative;
		line-height: 1.5rem;
		z-index: 1;
		color: #000;
		text-shadow: 0 0 2px #fff;
	}

	span {
		position: absolute;
		height: 100%;
		display: block;
		background-color: #8daa26;
		top: 0;
		z-index: 0;
	}
}

</style>
