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
						<button @click="$load(oa.ID,oa.Produit_ID)">load</button>
					</td>
					<td>{{ oa.ID }}</td>
					<td>{{ oa.Variete }}</td>
					<td>{{ oa.Inv }}</td>
					<td>{{ oa.Fournisseur }}</td>
					<td>{{ $date(oa.Date_reception) }}</td>
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
import {computed, defineComponent, ref} from 'vue';
import HelloWorld from '@/components/HelloWorld.vue';
import {useStore} from "vuex";
import Pagination from "@/components/Pagination.vue";

export default defineComponent({
	name: 'OAs',
	components: {
		Pagination,
		HelloWorld,
	},
	setup() {
		const store = useStore();
		
		const products = computed(() => store.state._.products);
		
		const allOAs = computed(() => {
			const oas = Object.values(store.state._.oas);
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
			oas: computed(() => allOAs.value.slice(len.value * page.value, len.value * (page.value + 1))),
			products,
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
