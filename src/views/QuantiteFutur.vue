<template>
	<div class="home">
		<Pagination v-model:page="page" v-model:len="len"/>
		<h1>{{product.Variete}}</h1>
		<h2>{{product.Code}}</h2>
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
					<td :rowspan="line.rowSpan">{{ line.four?.Abbreviation ?? 'N/D' }}<button style="padding-block: 0; padding-inline: .3rem">+</button></td>
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
					<td>{{ $date(line.oa?.Date_reception) }} <button style="padding-block: 0; padding-inline: .3rem">+</button></td>
					<td>{{ line.oa?.Quantite_produire ?? 'N/D' }}</td>
				</tr>
			</template>
			</tbody>
		</table>
		<hr style="margin: 2rem">
		<h3>Achat Futur</h3>
		<div style="display: flex; justify-content: center">
			<table class="product">
				<thead>
				<tr>
					<th>Qty</th>
					<th>Fournisseur</th>
					<th>Date</th>
				</tr>
				</thead>
				<tbody>
				<tr>
					<td>
						<TableInput :model-value="Math.round(Math.random()*4000)" />
					</td>
					<td>GS</td>
					<td>
						<TableInput model-value="23 mars 2021" len="8" />
					</td>
				</tr>
				<tr>
					<td>
						<TableInput :model-value="Math.round(Math.random()*4000)" />
					</td>
					<td>GL</td>
					<td>
						<TableInput model-value="20 févr. 2022" len="8" />
					</td>
				</tr>
				</tbody>
			</table>
		</div>
	</div>
</template>

<script lang="ts">
import {defineComponent, ref, watchEffect} from "vue";
import TableInput from "@/components/TableInput.vue";
import {useMyServices} from "@/config/dataConfig";
import Pagination from "@/components/Pagination.vue";
import {LogService} from "@/services/logService";
import moment from "moment";

const logger = LogService.logger({name: "QuantiteFutur"})

export default defineComponent({
	name: "QuantiteFutur",
	components: {Pagination, TableInput},
	setup() {
		const services = useMyServices();
		
		const product = ref(null);
		const lines = ref([]);
		const len = ref(0);
		const page = ref(11);
		
		watchEffect(() => {
			logger.time("page");
			
			const products = Object.values(services.data.tables.produits.value).sort((a, b) => {
				return a.Type - b.Type || a.Variete?.localeCompare?.call(b.Variete) || a.Format - b.Format;
			}).filter(p => true);//filter here
			
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
						date: moment.unix(oa?.Date).format('ll')
					});
					mainLine.rowSpan++;
				});
			});
			
			logger.timeEnd("page")
			logger.log(lines.value)
		})
		
		return {
			product,lines, len, page,
		}
	}
})
</script>

<style scoped>

.top td{
	border-top: solid 1px black;
}

</style>
