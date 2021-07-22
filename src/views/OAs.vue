<template>
	<div class="home">
		<Pagination v-model:page="page" v-model:len="len"/>
		<table class="product">
			<tr>
				<th></th>
				<th>OA</th>
				<th>Produit</th>
				<th>Inv.</th>
				<th>Fournisseur</th>
				<th>Date de reception</th>
				<th>Semaine Finition</th>
				<th>Quantite produire</th>
				<th>Quantite recevoir</th>
				<th>Quantite recu</th>
			</tr>
			<tr>
				<th></th>
				<th></th>
				<th></th>
				<th></th>
				<th></th>
				<th></th>
				<th></th>
				<th></th>
			</tr>
			<template v-for="(oa,val) in oas" :key="val">
				<tr :class="[oa.Color]">
					<td>
						<button @click="load(oa.ID)">load</button>
					</td>
					<td>{{ oa.ID }}</td>
					<td>{{ oa.Variete }}</td>
					<td>{{ oa.Inv }}</td>
					<td>{{ oa.Fournisseur }}</td>
					<td>{{ date(oa.Date_reception) }}</td>
					<td>{{ oa.sem_fini }}</td>
					<td>{{ oa.Quantite_produire }}</td>
					<td>{{ oa.Quantite_recevoir }}</td>
					<td>{{ oa.Quantite_recu }}</td>
				</tr>
			</template>
		</table>
		<Pagination v-model:page="page" v-model:len="len"/>
	</div>
</template>

<script lang="ts">
import {defineComponent, ref, unref, computed, onMounted, onUnmounted, watch} from 'vue';
import HelloWorld from '@/components/HelloWorld.vue';
import {useStore} from "vuex";
import moment from "moment";
import Pagination from "@/components/Pagination.vue";

export default defineComponent({
	name: 'OAs',
	components: {
		Pagination,
		HelloWorld,
	},
	setup() {
		const store = useStore();

		const year = moment().add(7, 'M').year();
		const pastTitle = {
			years_pastM0: "Mort " + year,
			years_pastM1: "Mort " + (year - 1),
			years_pastM2: "Mort " + (year - 2),
			years_pastVe0: "Vente " + year,
			years_pastVe1: "Vente " + (year - 1),
			years_pastVe2: "Vente " + (year - 2),
			years_pastA0: "Achat " + year,
			years_pastA1: "Achat " + (year - 1),
			years_pastA2: "Achat " + (year - 2),
			years_pastV0: "Vendant " + year,
			years_pastV1: "Vendant " + (year - 1),
			years_pastV2: "Vendant " + (year - 2),
		};

		const products = computed(() => store.state.products);

		const allOAs = computed(() => {
			const oas = Object.values(store.state.oas);
			const result = [];

			for (let i = 0; i < oas.length; i++) {
				const oa: any = oas[i];

				result.push({
					...oa,
					Variete: products.value[oa.Produit]?.Variete || '-',
					Inv: products.value[oa.Produit]?.Quantite ?? '-'
				});
			}

			return result;
		});
		const page = ref(0);
		const len = computed(() => store.state.settings.ipp);

		//watch([variSearch], () => productPage.value = 0)

		return {
			load(ID) {

			},

			oas: computed(() => allOAs.value.slice(len.value * page.value, len.value * (page.value + 1))),
			products,
			loading: computed(() => store.state.loading),

			pastTitle,
			page,
			len: computed(() => Math.ceil(allOAs.value.length / len.value)),

			money(val) {
				return val ? (parseFloat(val).toFixed(2) + "$") : "-";
			},
			value(val) {
				return val ? val : "-";
			},
			date(val) {
				if (!val)
					return "-";
				return moment.unix(val).format('lll')
			}
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
