<template>
	<div class="home">
		<Pagination v-model:page="page" v-model:len="len"/>
		<table class="product">
			<tr>
				<th></th>
				<th>Produit</th>
				<th>Format</th>
				<th>pw</th>
				<th>OA</th>
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
				<th>{{ $pastTitle.years_pastA1 }}</th>
				<th>Reception</th>
				<th>Reception</th>
				<th>{{ $pastTitle.years_pastVe0 }}</th>
				<th>{{ $pastTitle.years_pastVe1 }}</th>
				<th>{{ $pastTitle.years_pastVe2 }}</th>
			</tr>
			<tr>
			</tr>
			<template v-for="(oa,val) in oas" :key="val">
				<tr :class="[oa.Color]">
					<td>
						<button @click="$load(oa.ID,oa.product.ID)">load</button>
					</td>
					<td>{{ oa.product.Variete }}</td>
					<td>{{ oa.product.Format }}</td>
					<td>{{ oa.pw }}</td>
					<td>{{ oa.ID }}</td>
					<td>{{ $value(oa.years_pastC0) }}</td>
					<td>{{ $value(oa.years_pastT0) }}</td>
					<td>{{ $value(oa.product.years_pastV0) }}</td>
					<td>{{ $value(oa.years_pastC1) }}</td>
					<td>{{ $value(oa.years_pastT1) }}</td>
					<td>{{ $value(oa.product.years_pastV1) }}</td>
					<td>{{ $value(oa.years_pastC2) }}</td>
					<td>{{ $value(oa.years_pastT2) }}</td>
					<td>{{ $value(oa.product.years_pastV2) }}</td>
					<td>{{ oa.Format }}</td>
					<td>{{ oa.Fournisseur }}</td>
					<td :class="{'red': oa.product.Quantite<=0}">{{ oa.product.Quantite }}</td>
					<td>{{ $valueI(oa.product.years_pastA0) }}</td>
					<td>{{ $valueI(oa.product.years_pastA1) }}</td>
					<td>{{ $date(oa.Date_reception) }}</td>
					<td>{{ $valueI(oa.Quantite_recu) }}/{{ $valueI(oa.Quantite_recevoir) }}</td>
					<td>{{ $valueI(oa.product.years_pastVe0) }}</td>
					<td>{{ $valueI(oa.product.years_pastVe1) }}</td>
					<td>{{ $valueI(oa.product.years_pastVe2) }}</td>
				</tr>
			</template>
		</table>
		<Pagination v-model:page="page" v-model:len="len"/>
	</div>
</template>

<script lang="ts">
import {computed, defineComponent, ref} from 'vue';
import HelloWorld from '@/components/HelloWorld.vue';
import {useStore} from "vuex";
import Pagination from "@/components/Pagination.vue";
import {useRouter} from "vue-router";

export default defineComponent({
	name: 'ViewA',
	components: {
		Pagination,
		HelloWorld,
	},
	setup() {
		const store = useStore();
		const router = useRouter();

		const allOAs = computed(() => {
			const oas = store.state.oas;
			const products = store.state.products;
			const oasByProd = {};

			for (const oasKey in oas) {
				const oa: any = oas[oasKey];
				oasByProd[oa.Produit] = oasByProd[oa.Produit] || [];
				oasByProd[oa.Produit].push(oasKey);
			}

			const result = [];

			for (const productsKey in products) {
				const prod = products[productsKey];
				if (oasByProd[productsKey])
					for (const oaKey of oasByProd[productsKey]) {
						result.push({
							...oas[oaKey],
							product: {
								...prod,
								Variete: prod?.Variete || '-',
								Inv: prod?.Quantite ?? '-'
							}
						});
					}
				else {
					result.push({
						product: {
							...prod,
							Variete: prod?.Variete || '-',
							Inv: prod?.Quantite ?? '-'
						}
					});
				}
			}

			return result;
		});
		const page = ref(0);
		const len = computed(() => store.state.settings.ipp);

		//watch([variSearch], () => productPage.value = 0)

		return {
			oas: computed(() => allOAs.value.slice(len.value * page.value, len.value * (page.value + 1))),
			loading: computed(() => store.state.loading),

			page,
			len: computed(() => Math.ceil(allOAs.value.length / len.value)),


		};
	}
});
</script>

<style scoped lang="scss">

.product {
	table-layout: fixed;
}

.product td {
	white-space: nowrap;
}


table {
	tr {
		&:nth-child(odd) {
			background-color: #f8f8f8;
		}

		&:hover {
			background-color: #f3f3f3;
		}
	}

	td{
		button{
			padding: .3rem .5rem;
			font-size: .8rem;
		}
	}
}

</style>
