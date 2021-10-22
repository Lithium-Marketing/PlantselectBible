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
				<th>{{ $pastTitle.years_pastA0 }}</th>
				<th>{{ $pastTitle.years_pastA0 }} Confirmer</th>
				<th>{{ $pastTitle.years_pastA1 }}</th>
				<th>Reception</th>
				<th>Reception</th>
				<th>{{ $pastTitle.years_pastVe0 }}</th>
				<th>{{ $pastTitle.years_pastVe1 }}</th>
				<th>{{ $pastTitle.years_pastVe2 }}</th>
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
						<TableInput :always="true" :modelValue="line.product['bible.Vendant']" :original="line.product['bible.VendantO']" @update:modelValue="upVendantF($event,line.product)"/>
					</td>
					<td>
						<TableInput :modelValue="line.years_pastC0" :original="line.years_pastC0O" @update:modelValue="upCost($event,line)"/>
					</td>
					<td>{{ $value(line.years_pastT0) }}</td>
					<td :class="line.c?.v0">
						<TableInput :modelValue="line.years_pastV0" :original="line.$years_pastV0" @update:modelValue="upPrice($event,line)"/>
					</td>
					<td>{{ $value(line.years_pastC1) }}</td>
					<td>{{ $value(line.years_pastT1) }}</td>
					<td>{{ $value(line.years_pastV1) }}</td>
					<td>{{ $value(line.years_pastC2) }}</td>
					<td>{{ $value(line.years_pastT2) }}</td>
					<td>{{ $value(line.years_pastV2) }}</td>
					<td>{{ line.oa?.Format }}</td>
					<td>{{ line.oa?.Fournisseur }}</td>
					<td :class="line.c?.Inventaire">{{ line.product.Quantite }}</td>
					<td :class="line.c?.qtyF">
						<TableInput :always="true" :modelValue="line['bible.Quantite']" :original="line['bible.QuantiteO']" @update:modelValue="upAchat($event,line,line.product)"/>
					</td>
					<td :class="line.c?.a0">{{ $valueI(line.product.years_pastA0) }}</td>
					<td>{{ $valueI(line.product.years_pastA1) }}</td>
					<td :class="line.c?.dateReception">{{ $date(line.oa?.Date_reception) }}</td>
					<td>{{ $valueI(line.Quantite_recu) }}/{{ $valueI(line.oa?.Quantite_recevoir) }}</td>
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
import {computed, ComputedRef, defineComponent, ref} from "vue";
import {useServices} from "@/services";
import {Store, useStore} from "vuex";
import {StoreState} from "@/store";
import Pagination from "@/components/Pagination.vue";
import TableInput from "@/components/TableInput.vue";
import {currentYear, PricesId} from "@/helper/Const";
import moment from "moment";

export default defineComponent({
	name: "ViewC",
	components: {TableInput, Pagination},
	setup() {
		const store = useStore<StoreState>();
		const services = useServices();

		const all = computed(function allCompute() {//`produits`.`Type` asc,`vue_produits`.`Variete` asc,`vue_produits`.`Format` asc"
			console.time("all viewc");
			try {
				const oasByProd: Record<any, any[]> = Object.values(services.data.get("ordres_assemblages").value).reduce(function oasByProdReduce(a, oa) {
					a[oa.value.Produit] = a[oa.value.Produit] || [];
					a[oa.value.Produit].push(oa.value);
					return a;
				}, {});

				return Object.values(services.data.get("produits").value).map(v => v.value).sort((a, b) => {
					return a.Type - b.Type || a.Variete?.localeCompare(b.Variete) || a.Format - b.Format;
				}).flatMap(function allFlatMap(product) {
					const prices = services.cache.pricesByProdById.value[product.ID];

					return oasByProd[product.ID]?.map(function oasByProdMap(oa) {
						return {
							oa,
							product,
							prices
						}
					}) || [{
						product,
						prices
					}]
				})
			} finally {
				console.timeEnd("all viewc");
			}
		});

		const {len, ipp, lines, page} = table(all, store);
		console.log(moment().add(7, "month").year());
		return {
			len, ipp, page,
			lines: computed(() => {
				console.time("page viewc");
				try {
					return lines.value.map(line => {
						try {
							line.c = JSON.parse(line['bible.Color']);
						} catch (e) {
						}

						line.years_pastV0 = services.cache.pricesByProdById.value[line.product.ID]?.[PricesId.Main].Prix;
						line.$years_pastV0 = services.cache.pricesByProdById.value[line.product.ID]?.[PricesId.Main].$Prix;

						line.years_pastV1 = services.cache.archives.value[0][currentYear - 1]?.[line.product.ID]?.value;
						line.years_pastV1 = (line.years_pastV1 ?? 0) / 100;

						line.years_pastV2 = services.cache.archives.value[0][currentYear - 2]?.[line.product.ID]?.value;
						line.years_pastV2 = (line.years_pastV2 ?? 0) / 100;

						line.years_pastVe0 = services.cache.cmdsByProdByYear.value[line.product.ID]?.vente(currentYear).value;
						line.years_pastVe1 = services.cache.cmdsByProdByYear.value[line.product.ID]?.vente(currentYear-1).value;
						line.years_pastVe2 = services.cache.cmdsByProdByYear.value[line.product.ID]?.vente(currentYear-2).value;

						return line;
					});
				} finally {
					console.timeEnd("page viewc");
				}
			}),

			upPrice(val, line) {
				services.modification.set("produits_prix", line.prices[PricesId.Main].ID, "Prix", val, "Prix principal")
			}
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

</style>
