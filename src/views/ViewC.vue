<template>
	<div class="home">
		<Pagination v-model:page="page" v-model:len="len"/>
		<table class="product" ref="tableRef">
			<thead>
			<tr>
				<th></th>
				<th></th>
				<th>Produit</th>
				<th>Format</th>
				<th>pw</th>
				<th>OA</th>
				<th>Coutant Futur</th>
				<th>Vendant Futur</th>
				<th>{{ $pastTitle.years_pastC0 }}</th>
				<th>{{ $pastTitle.years_pastT0 }}</th>
				<th>{{ $pastTitle.years_pastV0 }}</th>
				<th>{{ $pastTitle.years_pastC1 }}</th>
				<th>{{ $pastTitle.years_pastT1 }}</th>
				<th>{{ $pastTitle.years_pastV1 }}</th>
				<th>{{ $pastTitle.years_pastC2 }}</th>
				<th>{{ $pastTitle.years_pastT2 }}</th>
				<th>{{ $pastTitle.years_pastV2 }}</th>
				<th>Format</th>
				<th>Fourn.</th>
				<th>Inv.</th>
				<th>Prevision</th>
				<th>{{ $pastTitle.years_pastA0 }}</th>
				<th>{{ $pastTitle.years_pastA0 }} Confirmer</th>
				<th>{{ $pastTitle.years_pastA1 }}</th>
				<th>Reception</th>
				<th>Reception</th>
				<th>{{ $pastTitle.years_pastVe0 }}</th>
				<th>{{ $pastTitle.years_pastVe1 }}</th>
				<th>{{ $pastTitle.years_pastVe2 }}</th>
			</tr>
			<tr>
				<th></th>
				<th></th>
				<th><input v-model="search.variete"/></th>
				<th></th>
				<th></th>
				<th></th>
				<th></th>
				<th></th>
				<th></th>
				<th></th>
				<th></th>
				<th></th>
				<th></th>
				<th></th>
				<th></th>
				<th></th>
				<th></th>
				<th></th>
				<th></th>
				<th></th>
				<th></th>
				<th></th>
				<th></th>
				<th></th>
				<th></th>
				<th></th>
				<th></th>
				<th></th>
				<th></th>
			</tr>
			</thead>
			<tbody>
			<template v-for="line of lines" :key="line.oa?.ID">
				<tr :class="[line.product.Color]" :data-pid="line.product.ID" :data-oaid="line.oa?.ID">
					<td>
						<button @click="$load(line.oa?.ID,line.product.ID)">load</button>
					</td>
					<td>
						<button class="tooltip" :style="{'background-color':line.oa?.Note ? '#8daa26':'#888'}" @click="$load(line.oa?.ID,line.product.ID,'note')">
							N
							<span class="tooltiptext" v-if="line.oa?.Note"><pre>{{ line.oa?.Note }}</pre></span>
						</button>
					</td>
					<td :class="line.c?.Variete">{{ line.product.Variete }}</td>
					<td>{{ line.product.Format }}</td>
					<td>{{ line.oa?.pw }}</td>
					<td>{{ line.oa?.ID }}</td>
					<td>
						<!--						<TableInput :modelValue="line.years_pastC0" :original="line.years_pastC0O" @update:modelValue="upCost($event,line)"/>-->
					</td>
					<td>
						<TableInput2 table="bible" field="Vendant" :entity-id="line.bible.ID" :create-info="line.bible.createInfo"/>
					</td>
					<td>
						<TableInput2 table="matieres_premieres" field="Prix" :entity-id="line.matiere_premiere?.ID"/>
					</td>
					<td>{{ $value(line.years_pastT0) }}</td>
					<td :class="line.c?.v0">
						<TableInput2 table="produits_prix" field="Prix" :entity-id="line.mainPrice?.ID"/>
					</td>
					<td>{{ $value(line.years_pastC1) }}</td>
					<td>{{ $value(line.years_pastT1) }}</td>
					<td>{{ $value(line.years_pastV1) }}</td>
					<td>{{ $value(line.years_pastC2) }}</td>
					<td>{{ $value(line.years_pastT2) }}</td>
					<td>{{ $value(line.years_pastV2) }}</td>
					<td>{{ line.matiere_premiere?.Format }}</td>
					<td>{{ line.fournisseur }}</td>
					<td>{{ line.Inventaire }}</td>
					<td>{{ $valueI(line.prevision) }}</td>
					<td :class="line.c?.qtyF">
					
					</td>
					<td :class="line.c?.a0">{{ $valueI(line.achat.years_pastA0) }}</td>
					<td>{{ $valueI(line.achat.years_pastA1) }}</td>
					<td :class="line.c?.dateReception">{{ $date(line.oa?.Date_reception) }}</td>
					<td>{{ $valueI(line.oa?.Quantite_recu) }}/{{ $valueI(line.oa?.Quantite_recevoir) }}</td>
					<td>{{ $valueI(line.years_pastVe0) }}</td>
					<td>{{ $valueI(line.years_pastVe1) }}</td>
					<td>{{ $valueI(line.years_pastVe2) }}</td>
				</tr>
			</template>
			</tbody>
		</table>
		<Pagination v-model:page="page" v-model:len="len"/>
	</div>
</template>

<script lang="ts">
import {computed, ComputedRef, defineComponent, reactive, ref} from "vue";
import {Store, useStore} from "vuex";
import {StoreState} from "@/store";
import Pagination from "@/components/Pagination.vue";
import TableInput from "@/components/TableInput.vue";
import {currentYear, PricesId} from "@/helper/Const";
import moment from "moment";
import {LogService} from "@/services/logService";
import {MyTablesDef, useMyServices} from "@/config/dataConfig";
import TableInput2 from "@/components/TableInput2.vue";

const logger = LogService.logger({name: "ViewC"});

export default defineComponent({
	name: "ViewC",
	components: {TableInput2, TableInput, Pagination},
	setup() {
		const store = useStore<StoreState>();
		const services = useMyServices();
		
		const search = reactive({
			variete: ""
		});
		
		const all = computed(function allCompute() {//`produits`.`Type` asc,`vue_produits`.`Variete` asc,`vue_produits`.`Format` asc"
			logger.time("all viewc");
			try {
				const oasByProd: Record<any, MyTablesDef["ordres_assemblages"][]> = Object.values(services.data.get("ordres_assemblages").value).reduce(function oasByProdReduce(a, oa) {
					a[oa.Produit] = a[oa.Produit] || [];
					a[oa.Produit].push(oa);
					return a;
				}, {});
				
				const bibleByProd = services.data.indexesByTable.bible.Produit.value;
				
				return Object.values(services.data.get("produits").value).filter(p => {
					return p.Variete?.toLowerCase()?.indexOf(search.variete.toLocaleLowerCase()) !== -1;
				}).sort((a, b) => {
					return a.Type - b.Type || String(a.Variete).localeCompare(b.Variete) || a.Format - b.Format;
				}).flatMap(function allFlatMap(product) {
					const prodCache = services.cache.caches.byProd.value[product.ID].value;
					const prices = prodCache.prices;
					
					const bibleId = bibleByProd[product.ID]?.[0];
					const bibleData = bibleId !== undefined ? services.data.get("bible", bibleId).value : undefined;
					
					const bible = {
						ID: bibleId,
						createInfo: {
							Produit: product.ID
						},
						Quantite: bibleData?.Quantite,
						$Quantite: services.data.raw.bible.value[bibleId]?.Quantite
					}
					
					const achat = {
						years_pastA0: 0,
						years_pastA1: 0,
					};
					
					oasByProd[product.ID]?.forEach((oa) => {
						const year = moment.unix(oa.Date_reception).year();
						if (currentYear == year)
							achat.years_pastA0 += oa.Quantite_recevoir;
						if (currentYear - 1 == year)
							achat.years_pastA1 += oa.Quantite_recevoir;
					});
					
					return oasByProd[product.ID]?.map(function oasByProdMap(oa) {
						return {
							oa,
							product,
							prices,
							bible,
							achat
						}
					}) || [{
						product,
						prices,
						bible,
						achat
					}]
				})
			} finally {
				logger.timeEnd("all viewc");
			}
		});
		
		const {len, ipp, lines, page} = table(all, store);
		logger.log(moment().add(7, "month").year());
		return {
			search,
			len, ipp, page,
			lines: computed(() => {
				logger.time("page viewc");
				try {
					return lines.value.map(line => {
						try {
							line.c = JSON.parse(line['bible.Color']);
						} catch (e) {
						}
						
						const byProd = services.cache.caches.byProd;
						const archives = services.cache.caches.archives;
						
						const prodCache = byProd.value[line.product.ID].value;
						
						line.mainPrice = line.prices?.[PricesId.Main];
						
						line.years_pastV1 = archives.value[0]?.[currentYear - 1]?.[line.product.ID]?.value;
						line.years_pastV1 = (line.years_pastV1 ?? 0) / 100;
						
						line.years_pastV2 = archives.value[0]?.[currentYear - 2]?.[line.product.ID]?.value;
						line.years_pastV2 = (line.years_pastV2 ?? 0) / 100;
						
						line.years_pastVe0 = prodCache.vente(currentYear);
						line.years_pastVe1 = prodCache.vente(currentYear - 1);
						line.years_pastVe2 = prodCache.vente(currentYear - 2);
						
						line.prevision = services.data.indexesByTable.clients_previsions.Produit.value[line.product.ID]?.map(id => services.data.tables.clients_previsions.value[id]).reduce((a, v) => a + v.Quantite, 0);
						
						const mp = services.data.get("matieres_premieres", line.oa?.Matiere_premiere ?? false).value;
						
						line.matiere_premiere = mp;
						
						line.years_pastC1 = archives.value[1]?.[currentYear - 1]?.[line.oa?.Matiere_premiere]?.value;
						line.years_pastC1 = (line.years_pastC1 ?? 0) / 100;
						
						line.years_pastC2 = archives.value[1]?.[currentYear - 2]?.[line.oa?.Matiere_premiere]?.value;
						line.years_pastC2 = (line.years_pastC2 ?? 0) / 100;
						
						const four = services.data.get("fournisseurs", mp?.Fournisseur ?? false).value;
						
						line.fournisseur = four?.Abbreviation;
						
						line.years_pastT0 = four?.Transport * (services.data.raw.currency_rates.value[four?.Currency + ",CAD"]?.rate ?? -1);
						
						line.years_pastT1 = archives.value[2]?.[currentYear - 1]?.[four?.ID]?.value;
						line.years_pastT1 = (line.years_pastT1 ?? 0) / 100;
						
						line.years_pastT2 = archives.value[2]?.[currentYear - 2]?.[four?.ID]?.value;
						line.years_pastT2 = (line.years_pastT2 ?? 0) / 100;
						
						line.Inventaire = services.data.raw.vue_inventaire.value[line.product?.ID]?.Quantite
						
						return line;
					});
				} finally {
					logger.timeEnd("page viewc");
				}
			}),
		};
	}
});

function table(all: ComputedRef<any[]>, store: Store<StoreState>) {
	const page = ref(0);
	const ipp = computed(() => store.state.settings.ipp);
	const len = computed(() => Math.ceil(all.value.length / ipp.value));
	
	return {
		page, ipp, len,
		lines: computed(() => {
			return all.value.slice(ipp.value * page.value, ipp.value * (page.value + 1));
		})
	};
}
</script>

<style scoped>
table{
  border-collapse: collapse;
}
th, td{
  border: #ccc 1px solid;
  padding: 5px;
}
th{
  /*white-space: nowrap;*/
  background-color: #FFFFFF;
}
thead{
  box-shadow: #000 1px 1px;
}

thead{
  position: sticky;
  left: 0px;
  top: 0px;
  z-index: 99;
}
tbody tr td:nth-child(2),
thead tr th:nth-child(2){
  position: sticky;
  left: 0px;
}
</style>
