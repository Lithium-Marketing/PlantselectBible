<template>
	<div class="home">
		<div>
			<div>
				<button :disabled="tab==='price'" @click="tab='price'">Prix Calculateur</button>
				<button :disabled="tab==='rapport'" @click="tab='rapport'">Rapports</button>
			</div>
			
			<div>
				<div v-if="tab==='price'" class="prodTab">
					<PriceCalc></PriceCalc>
				</div>
				<div v-if="tab==='rapport'" class="prodTab">
					<ExcelBuilder/>
				</div>
			</div>
		</div>
	</div>
</template>

<script>

import {defineComponent, ref} from "vue";
import {useStore} from "vuex";
import PriceCalc from "@/components/PriceCalc";
import ExcelBuilder from "@/components/ExcelBuilder";

export default defineComponent({
	name: 'Tools',
	components: {ExcelBuilder, PriceCalc},
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
