<template>
	<div class="home">
		<div v-if="loading">
			Loading...
		</div>
		<table class="product" v-else>
			<tr>
				<th>Variete</th>
				<th>Format</th>
				<th>Inv.</th>
			</tr>
			<template v-for="(prod,val) in products">
				<tr>
					<td>{{ prod.Variete }}</td>
					<td>{{ prod.Format }}</td>
					<td :class="{'red': prod.Quantite<0}">{{ prod.Quantite }}</td>
				</tr>
			</template>
		</table>

	</div>
</template>

<script lang="ts">
import {defineComponent, ref, computed} from 'vue';
import HelloWorld from '@/components/HelloWorld.vue';
import {useStore} from "vuex";

export default defineComponent({
	name: 'Home',
	components: {
		HelloWorld,
	},
	setup() {
		const store = useStore();
		store.dispatch('refreshProducts')

		return {
			products: computed(() => store.state.products),
			oas: computed(() => store.state.oas),
			loading: computed(() => store.state.loading),
		};
	}
});
</script>

<style scoped>
.product .red {
	background-color: red;
}
</style>
