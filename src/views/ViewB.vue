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
				<th v-for="titles in prices">{{ titles.Titre }}</th>
			</tr>
			<tr>
				<th></th>
				<th><input v-model="search.variete"/></th>
				<th></th>
				<th></th>
				<th v-for="titles in prices"></th>
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
					<td v-for="titles in prices" style="padding-inline: 1rem" :class="{diff:product.pricesDiff[titles.ID]}">
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
import {useServices} from "@/services";
import {MyTablesConfig, MyTablesDef, useMyServices} from "@/config/dataConfig";
import {LogService} from "@/services/logService";

const logger = LogService.logger({name:"ViewB"})

export default defineComponent({
	name: 'ViewB',
	components: {
		TableInput,
		Pagination,
		HelloWorld,
	},
	setup() {
		const store = useStore<StoreState>();
		const services = useMyServices();

		const page = ref(0);
		const ipp = computed(() => store.state.settings.ipp);
		const len = ref({});
		const products = ref([]);
		const search = reactive({
			variete: ""
		});

		watchEffect(() => {
			logger.time("all");
			
			products.value.length = 0;

			const filtered = Object.values(services.data.get("produits").value).sort((a, b) => {
				return a.Type - b.Type || String(a.Variete).localeCompare(b.Variete) || a.Format - b.Format;
			}).filter((p: any) => {
				return !p.Variete || p.Variete.toLowerCase().indexOf(search.variete.toLowerCase()) !== -1
			});

			const newLen = Math.ceil(filtered.length / ipp.value);
			if (newLen !== len.value)
				page.value = 0;
			len.value = newLen;

			const byProd = services.cache.caches.byProd.value;
			filtered.slice(ipp.value * page.value, ipp.value * (page.value + 1)).forEach((p: any, i) => {
				products.value[i] = {
					...p,
					prices: byProd[p.ID].value.prices,
					pricesDiff: Object.entries(byProd[p.ID].value.prices ?? {}).reduce((a, v) => {
						a[v[0]] = services.data.raw.produits_prix.value[v[1].ID]?.Prix !== v[1].Prix;
						return a;
					}, {})
				};
			});
			
			logger.timeEnd("all");
		})

		const prices = computed(() => {
			return services.data.raw.prix.value;
		})
		return {
			search,
			products,
			prices,

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
