<template>
	<div class="home">
		<Pagination v-model:page="productPage" v-model:len="productPageLen"/>
		<table class="product">
			<tr>
				<th></th>
				<th>Code</th>
				<th>Variete</th>
				<th>Format</th>
				<th>Inv.</th>
				<th>reservation</th>
				<th>{{ $pastTitle.years_pastM0 }}</th>
				<th>{{ $pastTitle.years_pastM1 }}</th>
				<th>{{ $pastTitle.years_pastM2 }}</th>
				<th>{{ $pastTitle.years_pastVe0 }}</th>
				<th>{{ $pastTitle.years_pastVe1 }}</th>
				<th>{{ $pastTitle.years_pastVe2 }}</th>
				<th>{{ $pastTitle.years_pastA0 }}</th>
				<th>{{ $pastTitle.years_pastA1 }}</th>
				<th>{{ $pastTitle.years_pastA2 }}</th>
				<th>{{ $pastTitle.years_pastV0 }}</th>
				<th>{{ $pastTitle.years_pastV1 }}</th>
				<th>{{ $pastTitle.years_pastV2 }}</th>
			</tr>
			<tr>
				<th></th>
				<th></th>
				<th><input v-model="variSearch"></th>
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
			<template v-for="(prod,val) in products" :key="val">
				<tr :class="[prod.Color]">
					<td>
						<button @click="$load(undefined,prod.ID)">load</button>
					</td>
					<td>{{ prod.Code }}</td>
					<td>{{ prod.Variete }}</td>
					<td>{{ prod.Format }}</td>
					<td :class="{'red': prod.Quantite<0}">{{ prod.Quantite }}</td>
					<td>{{ $value(prod.reservation) }}</td>
					<td>{{ $value(prod.years_pastM0) }}</td>
					<td>{{ $value(prod.years_pastM1) }}</td>
					<td>{{ $value(prod.years_pastM2) }}</td>
					<td>{{ $value(prod.years_pastVe0) }}</td>
					<td>{{ $value(prod.years_pastVe1) }}</td>
					<td>{{ $value(prod.years_pastVe2) }}</td>
					<td>{{ $value(prod.years_pastA0) }}</td>
					<td>{{ $value(prod.years_pastA1) }}</td>
					<td>{{ $value(prod.years_pastA2) }}</td>
					<td>{{ $money(prod.years_pastV0) }}</td>
					<td>{{ $money(prod.years_pastV1) }}</td>
					<td>{{ $money(prod.years_pastV2) }}</td>
				</tr>
			</template>
		</table>
		<Pagination v-model:page="productPage" v-model:len="productPageLen"/>
	</div>
</template>

<script lang="ts">
import {computed, defineComponent, ref, watch} from 'vue';
import HelloWorld from '@/components/HelloWorld.vue';
import {useStore} from "vuex";
import Pagination from "@/components/Pagination.vue";

export default defineComponent({
	name: 'Products',
	components: {
		Pagination,
		HelloWorld,
	},
	setup() {
		const store = useStore();
		
		const variSearch = ref("");
		
		const allProducts = computed(() => {
			const prod = Object.values(store.state._.products);
			
			if (variSearch.value === "")
				return prod;
			
			const match = new RegExp(variSearch.value.toLowerCase())
			return prod.filter((prod: any) => {
				return match.test(prod.Variete?.toLowerCase())
			});
		});
		const productPage = ref(0);
		const len = computed(() => store.state.settings.ipp);
		
		watch([variSearch], () => productPage.value = 0)
		
		return {
			products: computed(() => allProducts.value.slice(len.value * productPage.value, len.value * (productPage.value + 1))),
			oas: computed(() => store.state._.oas),
			loading: computed(() => store.state.loading),
			
			productPage,
			productPageLen: computed(() => Math.ceil(allProducts.value.length / len.value)),
			
			variSearch,
			
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

.pagination {
	list-style: none;
	display: flex;
	justify-content: center;
	
	button {
		padding: .5rem;
		margin: .2rem;
		font-size: 1.3rem;
		
		&:not(:disabled) {
			cursor: pointer;
		}
	}
}

</style>
