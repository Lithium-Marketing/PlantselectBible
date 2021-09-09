<template>
	<div class="home">
		<Pagination v-model:page="page" v-model:len="len"/>
		<table class="product" ref="tableRef">
			<thead>
			<tr>
				<th></th>
				<th>Produit</th>
				<th>Format</th>
				<th>Vendant Futur</th>
				<th v-for="titles in $store.state.priceTitles">{{ titles.Titre }}</th>
			</tr>
			<tr>
				<th></th>
				<th><input v-model="search.variete"/></th>
				<th></th>
				<th></th>
				<th v-for="titles in $store.state.priceTitles"></th>
			</tr>
			</thead>
			<tbody>
			<template v-for="(product,val) of products" :key="val">
				<tr :class="[product.Color]" :data-pid="product.ID">
					<td>
						<button @click="$load(undefined,product.ID)">load</button>
					</td>
					<td>{{ product.Variete }}</td>
					<td>{{ product.Format }}</td>
					<td>{{ product['bible.Vendant'] }}</td>
					<td v-for="titles in $store.state.priceTitles" style="padding-inline: 1rem" :class="{diff:product.prices?.[titles.ID]?.diff}">
						{{ product.prices?.[titles.ID]?.Prix }}
					</td>
				</tr>
				<!--				<tr>-->
				<!--					<td colspan="25">{{ Object.keys(oa) }}</td>-->
				<!--				</tr>-->
				<!--								<tr>-->
				<!--									<td colspan="25">{{ Object.keys(oa.product) }}</td>-->
				<!--								</tr>-->
			</template>
			</tbody>
		</table>
		<Pagination v-model:page="page" v-model:len="len"/>
	</div>
</template>

<script lang="ts">
import {computed, defineComponent, reactive, ref, watchEffect} from 'vue';
import HelloWorld from '@/components/HelloWorld.vue';
import {useStore} from "vuex";
import Pagination from "@/components/Pagination.vue";
import TableInput from "@/components/TableInput.vue";
import {StoreState} from "@/store";

export default defineComponent({
	name: 'ViewB',
	components: {
		TableInput,
		Pagination,
		HelloWorld,
	},
	setup() {
		const store = useStore<StoreState>();

		const pricesByProduct = computed(() => {
			const result = {};
			for (const price of Object.values(store.state.prices)) {
				result[price.Produit_ID] = result[price.Produit_ID] || [];
				result[price.Produit_ID].push(price);
			}
			return result;
		})

		const page = ref(0);
		const ipp = computed(() => store.state.settings.ipp);
		const len = ref({});
		const products = ref([]);
		const search = reactive({
			variete: ""
		});

		watchEffect(() => {
			products.value.length = 0;

			const filtered = Object.values(store.state.products).filter((p: any) => {
				return !p.Variete || p.Variete.toLowerCase().indexOf(search.variete.toLowerCase()) !== -1
			});

			const newLen = Math.ceil(filtered.length / ipp.value);
			if (newLen !== len.value)
				page.value = 0;
			len.value = newLen;

			filtered.slice(ipp.value * page.value, ipp.value * (page.value + 1)).forEach((p: any, i) => {
				products.value[i] = {
					...p,
					prices: pricesByProduct.value[p.ID]?.reduce((a, v) => {
						a[v.Prix_ID] = {
							...v,
							diff: v.Prix !== v.PrixO
						};
						return a;
					}, {})
				};
			});
		})

		return {
			search,
			products,

			page,
			len
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

.diff {
	background-color: rgba(195, 163, 225, 0.34);
}

table {
	tr {
		&:nth-child(odd) {
			background-color: #f8f8f8;
		}

		&:hover {
			background-color: #f0f0f0;
		}
	}

	td {
		button {
			padding: .3rem .5rem;
			font-size: .8rem;
		}
	}
}

</style>
