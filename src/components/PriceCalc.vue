<template>
	<div style="display: flex;flex-direction: column">
		<div v-for="price of prices" class="priceCalc">
			<span>{{ price.Titre }}.</span>
			<input :value="states[price.ID] ? 1/vals[price.ID] : vals[price.ID]" @change="setVal(states[price.ID] ? 1/$event.target.value : $event.target.value,price)" :disabled="price.Titre==='1'" placeholder="-">
			<button @click="states[price.ID] = !states[price.ID]">{{ states[price.ID] ? "/" : "X" }}</button>
			<div class="help" v-if="price.Titre==='2'">
				<span v-if="states[price.ID]">
					ex: 10.00$ / {{ 1 / vals[price.ID] }} = {{ $money(10 / (1 / vals[price.ID])) }}
				</span>
				<span v-else>
					ex: 10.00$ * {{ vals[price.ID] }} = {{ $money(10 * vals[price.ID]) }}
				</span>
			</div>
		</div>
		<hr>
		<button @click="apply(true,false)" style="margin: auto">
			Appliquer sur tout les produits
		</button>
		<hr>
		<button @click="apply(true,true)" style="margin: auto">
			Appliquer sur les produits avec un vendant futur
		</button>
	</div>
</template>

<script lang="ts">

import {computed, defineComponent, ref} from "vue";
import {useMyServices} from "@/dataConfig";
import {LogService} from "@/services/logService";

const logger = LogService.logger({name: "PriceCalc"});

export default defineComponent({
	name: 'PriceCalc',
	setup() {
		const services = useMyServices();
		
		const vals = ref({});
		
		const prices = computed(() => {
			return services.data.raw.prix.value;
		})
		
		return {
			states: ref({}),
			vals,
			prices,
			setVal(val, p) {
				logger.trace("setVal", val, p)
				val = parseFloat(val);
				if (Number.isNaN(val))
					vals.value[p.ID] = undefined;
				else
					vals.value[p.ID] = val;
			},
			
			apply(all: boolean, vF: boolean) {
				services.modification.mod("priceCalc", {
					vals: vals.value,
					vF: vF
				}, "Calculateur de prix");
			}
		};
	}
});

</script>

<style scoped lang="scss">

.priceCalc {
	position: relative;
	
	.help {
		z-index: -10;
		position: absolute;
		right: 1rem;
		top: 50%;
		transform: translateY(-50%);
	}
	
	input {
		font-size: 1.2rem;
		width: 5rem;
		padding: .2rem .6rem;
	}
}

</style>
