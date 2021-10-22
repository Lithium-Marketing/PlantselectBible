<template>
	<div class="home">
		<div>
			<button @click="$router.back()">back</button>
		</div>

		<div>
			<div>
				<button :disabled="tab==='product'" @click="tab='product'">Produit: {{ prodVar }}</button>
				<button :disabled="tab==='oa'" @click="tab='oa'">OA: {{ oaID }}</button>
				<button :disabled="tab==='oas'" @click="tab='oas'">OAs</button>
			</div>

			<div>
				<div v-if="tab==='product' && prodID!==-1" class="prodTab">
					<div v-for="price of prices">
						<span>{{ price.Titre }}.</span>
						<input :value="price.PrixO" disabled>
						<input :value="price.Prix" @change="updatePrice($event.target.value,price.Prix_ID,price.Produit_ID)" :disabled="!price.Prix_ID">
					</div>
				</div>

				<div v-if="tab==='note' && prodID!==-1" class="prodTab">
					<div>
						<textarea :value="oa.Note" style="width: 30rem;height: 10rem" @change="upNote($event.target.value,oa)"></textarea>
					</div>
				</div>

				<div v-if="tab==='oa' && oaID!==-1" class="prodTab">
					<div>
						<span>Cost.</span>
						<input :value="oa.years_pastC0O" disabled>
						<input :value="oa.years_pastC0" @change="updateCost($event.target.value,oa)">
					</div>
				</div>

				<div v-if="tab==='oas'" class="prodTab">
					<table class="product">
						<tr>
							<th></th>
							<th>pw</th>
							<th>OA</th>
							<th>{{ $pastTitle.years_pastC0 }}</th>
							<th>{{ $pastTitle.years_pastT0 }}</th>
							<th>{{ $pastTitle.years_pastC1 }}</th>
							<th>{{ $pastTitle.years_pastT1 }}</th>
							<th>{{ $pastTitle.years_pastC2 }}</th>
							<th>{{ $pastTitle.years_pastT2 }}</th>
							<th>Format</th>
							<th>Fourn.</th>
						</tr>
						<tr>
						</tr>
						<template v-for="(oa,val) of oas" :key="val.ID">
							<tr :class="[oa.Color]">
								<td>
									<button @click="$load(oa.ID,prodID,'oa')">load</button>
								</td>
								<td>{{ oa.pw }}</td>
								<td>{{ oa.ID }}</td>
								<td>{{ $value(oa.years_pastC0) }}</td>
								<td>{{ $value(oa.years_pastT0) }}</td>
								<td>{{ $value(oa.years_pastC1) }}</td>
								<td>{{ $value(oa.years_pastT1) }}</td>
								<td>{{ $value(oa.years_pastC2) }}</td>
								<td>{{ $value(oa.years_pastT2) }}</td>
								<td>{{ oa.Format }}</td>
								<td>{{ oa.Fournisseur }}</td>
							</tr>
						</template>
					</table>
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">

import {computed, defineComponent} from "vue";
import {useStore} from "vuex";
import {Modifications} from "@/helper/Modifications";
import {StoreState} from "@/store";

export default defineComponent({
	name: 'Edit',
	components: {},
	setup() {
		//const route = useRoute();
		const store = useStore<StoreState>();

		const tab = computed({
			get() {
				return store.state.editState.tab;
			},
			set(val: string) {
				store.state.editState.tab = val;
			}
		});

		const modifications = new Modifications(store);

		return {
			tab,

			prodID: computed(() => store.state.editState.prodID),
			prodVar: computed(() => store.state._.products[store.state.editState.prodID]?.Variete),
			oaID: computed(() => store.state.editState.oaID),

			prices: computed(() => {
				const prodID = store.state.editState.prodID;
				const pricesByTitle = Object.values(store.state._.prices).filter(v => v.Produit_ID === prodID).reduce((a, v) => {
					a[v.Prix_ID] = v;
					return a;
				}, {});
				return Object.values(store.state._.priceTitles).map(t => ({...pricesByTitle[t.ID], Titre: t.Titre, Prix_ID:t.ID ,Produit_ID: prodID}));
			}),

			oas: computed(() => {
				const prodID = store.state.editState.prodID;
				return Object.values(store.state._.oas).filter(oa => oa.Produit === prodID);
			}),

			oa: computed(() => {
				const oaID = store.state.editState.oaID;
				return store.state._.oas[oaID];
			}),

			updatePrice(val, Prix_ID,Produit_ID) {
				modifications.add({
					type: "setPrice",
					val,
					Prix_ID: Prix_ID,
					Produit_ID: Produit_ID
				});
				modifications.commit();
			},
			updateCost(val, oa) {
				modifications.add({
					type: "setCost",
					OA_ID: oa.ID,
					val
				});
				modifications.commit();
			},
			upNote(val, oa) {
				modifications.add({
					type: "setNote",
					OA_ID: oa.ID,
					val: val
				});
				modifications.commit();
			}
		};
	}
});

</script>

<style scoped lang="scss">
.product {
	table-layout: fixed;
	margin: auto;
}

.prodTab {
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
