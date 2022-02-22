<template>
	<div class="home">
		<Pagination v-model:page="page" v-model:len="len"/>
		<h1>{{ product.Variete }}</h1>
		<h2>{{ product.Code }}</h2>
		<input v-model="filter">
		<table class="product" style="width: 100%">
			<thead>
			<tr>
				<th>Fournisseur</th>
				<th>Matière</th>
				<th>PW</th>
				<th>Cout</th>
				<th>Transport</th>
				<th>OA</th>
				<th>Creation</th>
				<th>Reception</th>
				<th>Qty</th>
			</tr>
			</thead>
			<tbody>
			<template v-for="line of lines">
				<tr v-if="line.type === 0" class="top">
					<td :rowspan="line.rowSpan">{{ line.four?.Abbreviation ?? 'N/D' }}
						<button style="padding-block: 0; padding-inline: .3rem" @click="add(line)">+</button>
					</td>
					<td :rowspan="line.rowSpan">{{ line.mp?.Code ?? 'N/D' }}</td>
					<td :rowspan="line.rowSpan">{{ line.mp?.pw ?? 'N/D' }}</td>
					<td :rowspan="line.rowSpan">{{ line.mp?.Prix ?? 'N/D' }}</td>
					<td :rowspan="line.rowSpan">{{ line.four?.Transport ?? 'N/D' }}</td>
					<td></td>
					<td></td>
					<td></td>
					<td></td>
				</tr>
				<tr v-if="line.type === 1">
					<td>{{ line.oa?.ID ?? 'N/D' }}</td>
					<td>{{ $date(line.oa?.Date) }}</td>
					<td>{{ $date(line.oa?.Date_reception) }}
						<button style="padding-block: 0; padding-inline: .3rem" @click="add(line)">+</button>
					</td>
					<td>{{ line.oa?.Quantite_produire ?? 'N/D' }}</td>
				</tr>
			</template>
			</tbody>
		</table>
		<hr style="margin: 2rem">
		<h3>Achat Futur</h3>
		<div style="display: flex; justify-content: center">
			<table class="achatfutur">
				<thead>
				<tr>
					<th>Qty</th>
					<th>Matière</th>
					<th>Date</th>
					<th></th>
				</tr>
				</thead>
				<tbody>
				<tr v-for="achat in achats">
					<td>
						<TableInput2 table="achats_futur" field="qty" :entity-id="achat.ID"/>
					</td>
					<td>{{ achat.info }}</td>
					<td>
						<TableInput2 type="date" len="20" table="achats_futur" field="reception" :entity-id="achat.ID"/>
					</td>
					<td>
						<a style="color: red" @click="del(achat)">X</a>
					</td>
				</tr>
				</tbody>
			</table>
		</div>
	</div>
</template>

<script lang="ts">
import {computed, defineComponent, ref, watchEffect} from "vue";
import TableInput from "@/components/TableInput.vue";
import {MyTablesDef, useMyServices} from "@/config/dataConfig";
import Pagination from "@/components/Pagination.vue";
import {LogService} from "@/services/logService";
import moment from "moment";
import TableInput2 from "@/components/TableInput2.vue";

const logger = LogService.logger({name: "QuantiteFutur"})

export default defineComponent({
	name: "QuantiteFutur",
	components: {TableInput2, Pagination, TableInput},
	setup() {
		const services = useMyServices();
		
		const product = ref<MyTablesDef["produits"]>(null);
		const filter = ref("");
		const lines = ref([]);
		const len = ref(0);
		const page = ref(0);
		
		watchEffect(() => {
			logger.time("page");
			
			const products = Object.values(services.data.tables.produits.value).filter(p=>{
				const lower = filter.value.toLowerCase();
				return p.Code?.toLowerCase().indexOf(lower) !== -1 || p.Variete?.toLowerCase().indexOf(lower) !== -1
			}).sort((a, b) => {
				return a.Type - b.Type || String(a.Variete).localeCompare(b.Variete) || a.Format - b.Format;
			});
			
			product.value = products[page.value];
			len.value = products.length;
			lines.value.length = 0;
			
			// const productLine = {
			// 	rowSpan: 1,
			// 	rows: []
			// };
			// lines.value.push(productLine);
			
			const mps = services.data.indexesByTable.matieres_premieres.Produit.value[product.value.ID] ?? [];
			
			mps.map(id => services.data.tables.matieres_premieres.value[id]).forEach(mp => {
				if (!mp)
					return;
				
				const four = services.data.tables.fournisseurs.value[mp.Fournisseur];
				
				const mainLine = {
					type: 0,
					rowSpan: 1,
					mp, four
				};
				lines.value.push(mainLine);
				
				const oas = services.data.indexesByTable.ordres_assemblages.Matiere_premiere.value[mp.ID] ?? [];
				oas.map(id => services.data.tables.ordres_assemblages.value[id]).forEach(oa => {
					lines.value.push({
						type: 1,
						oa,
						mp
					});
					mainLine.rowSpan++;
				});
			});
			
			logger.timeEnd("page")
			logger.log(lines.value)
		})
		
		const achats = computed(() => {
			return services.cache.caches.achatFuturByProd.value[product.value.ID]?.map(a => {
				const mp = services.data.tables.matieres_premieres.value[a.matiere];
				const four = services.data.tables.fournisseurs.value[mp.Fournisseur];
				return {
					...a,
					info: mp.Code + " / " + four.Abbreviation
				}
			}) ?? []
		});
		
		return {
			product, lines, len, page, achats, filter,
			add(line) {
				services.modification.mod("create", {
					createInfo: {
						qty: 0,
						matiere: line.mp.ID,
						reception: line.oa?.Date_reception || moment().unix()
					},
					table: "achats_futur",
				}, "Creation Achat Futur");
			},
			del(achat){
				services.modification.mod('delete',{
					table: "achats_futur",
					id: achat.ID
				},"Delete Achat Futur")
			}
		}
	}
})
</script>

<style scoped>

.achatfutur td{
	padding: .5rem;
}

.top td {
	border-top: solid 1px black;
}

.product{
	margin-top: 2rem;
}

</style>
