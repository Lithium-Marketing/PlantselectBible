<template>
	<div class="home">
		<div>
			<div>
				<button :disabled="tab==='price'" @click="tab='price'">Prix Calculateur</button>
			</div>

			<div>
				<div v-if="tab==='price'" class="prodTab">
					<PriceCalc></PriceCalc>
				</div>
			</div>
		</div>
	</div>
</template>

<script>

import {computed, defineComponent, ref} from "vue";
import {useStore} from "vuex";
import PriceCalc from "@/components/PriceCalc";

export default defineComponent({
	name: 'Tools',
	components: {PriceCalc},
	setup() {
		const store = useStore();

		const tab = ref('produit');

		return {
			tab,
		};
	}
});

</script>

<style scoped lang="scss">
.product {
	table-layout: fixed;
	margin: auto;
}

</style>
