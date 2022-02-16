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
				<button :disabled="tab==='note'" @click="tab='note'">Notes</button>
			</div>
			
			<div>
				<div v-if="tab==='product' && prodID!==-1" class="prodTab">
					<div v-for="price of prices">
						<span>{{ price.Titre }}.</span>
						<input :value="price.o?.Prix" disabled>
						<TableInput2 table="produits_prix" field="Prix" :entity-id="price.id" :createInfo="price.c" style="display: inline;margin: 1rem"/>
					</div>
				</div>
				
				<div v-if="tab==='note' && prodID!==-1">
					<div>
						<div v-if="prodID!==undefined" class="noteCtn">
							<span>Note au produit</span>
							<textarea :value="oa.NoteP" style="width: 30rem;height: 10rem" @change="upNote($event.target.value,oa,true)"></textarea>
						</div>
						<div v-if="prodID!==undefined" class="noteCtn">
							<span>Note a l'ordre d'assemblage</span>
							<textarea :value="oa.NoteOA" style="width: 30rem;height: 10rem" @change="upNote($event.target.value,oa,false)"></textarea>
						</div>
					</div>
				</div>
				
				<div v-if="tab==='oa' && oaID!==-1" class="prodTab">
					<div>
						<span>Cost.</span>
						<input :value="oa.cost" disabled>
						<TableInput2 table="matieres_premieres" field="Prix" :entity-id="oa.mpId" style="display: inline;margin: 1rem"/>
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
import {MyTablesDef, useMyServices} from "@/config/dataConfig";
import TableInput2 from "@/components/TableInput2.vue";

export default defineComponent({
	name: 'Edit',
	components: {TableInput2},
	setup() {
		//const route = useRoute();
		const store = useStore<StoreState>();
		const services = useMyServices();
		
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
			prodVar: computed(() => services.data.tables.produits.value[store.state.editState.prodID]?.Variete),
			oaID: computed(() => store.state.editState.oaID),
			
			prices: computed(() => {
				const prodID = store.state.editState.prodID;
				const pricesByTitle = services.data.indexesByTable.produits_prix.Produit_ID.value[prodID]?.map(id => {
					return {
						id,
						o: services.data.raw.produits_prix.value[id],
						m: services.data.tables.produits_prix.value[id]
					};
				}).reduce((a, v) => {
					if (v.m.Prix_ID)
						a[v.m.Prix_ID] = v;
					return a;
				}, {}) ?? {};
				
				Object.values(services.data.raw.prix.value).forEach(prix => {
					if (!pricesByTitle[prix.ID])
						pricesByTitle[prix.ID] = {
							c: {
								Produit_ID: prodID,
								Prix_ID: prix.ID,
								Visible: 1
							} as MyTablesDef['produits_prix']
						}
				})
				
				return Object.values(services.data.tables.prix.value).map(t => ({...pricesByTitle[t.ID], Titre: t.Titre, Prix_ID: t.ID, Produit_ID: prodID}));
			}),
			
			oas: computed(() => {
				const prodID = store.state.editState.prodID;
				return services.data.indexesByTable.ordres_assemblages.Produit.value[prodID]?.map(id => services.data.tables.ordres_assemblages.value[id]);
			}),
			
			oa: computed(() => {
				const oaID = store.state.editState.oaID;
				const prodID = store.state.editState.prodID;
				
				const bibleP = services.data.indexesByTable.bible.Produit.value[prodID]?.[0];
				const bibleOA = services.data.indexesByTable.bible.OA.value[oaID]?.[0];
				
				const oa = services.data.tables.ordres_assemblages.value[oaID];
				const mp = services.data.raw.matieres_premieres.value[oa?.Matiere_premiere];
				
				return {
					mpId: mp?.ID, bibleP, bibleOA, prodID, oaID,
					cost: mp?.Prix,
					NoteP: services.data.tables.bible.value[bibleP]?.Note,
					NoteOA: services.data.tables.bible.value[bibleOA]?.Note
				};
			}),
			
			upNote(val, oa, isProd) {
				const createInfo = isProd ? {
					Produit: oa.prodID
				} : {
					OA: oa.oaID
				};
				services.modification.mod("manual", {
					val,
					id: isProd ? oa.bibleP : oa.bibleOA,
					table: "bible",
					field: "Note",
					createInfo
				}, "Note a" + (isProd ? "u produit" : " l'ordre d'assemblage"))
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

.noteCtn {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding-top: 2rem;
	
	> span {
		white-space: nowrap;
	}
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
