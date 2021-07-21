<template>
	<div class="home">
		<div v-if="loading">
			Loading...
		</div>
		<table class="product" v-else>
			<tr>
				<th></th>
				<th>Variete</th>
				<th>Format</th>
				<th>Inv.</th>
				<th>reservation</th>
				<th>{{ pastTitle['years_pastM0'] }}</th>
				<th>{{ pastTitle['years_pastM1'] }}</th>
				<th>{{ pastTitle['years_pastM2'] }}</th>
				<th>{{ pastTitle['years_pastVe0'] }}</th>
				<th>{{ pastTitle['years_pastVe1'] }}</th>
				<th>{{ pastTitle['years_pastVe2'] }}</th>
				<th>{{ pastTitle['years_pastA0'] }}</th>
				<th>{{ pastTitle['years_pastA1'] }}</th>
				<th>{{ pastTitle['years_pastA2'] }}</th>
				<th>{{ pastTitle['years_pastV0'] }}</th>
				<th>{{ pastTitle['years_pastV1'] }}</th>
				<th>{{ pastTitle['years_pastV2'] }}</th>
			</tr>
			<template v-for="(prod,val) in products" :key="val">
				<tr :class="[prod.Color]">
					<td>
						<button @click="load(prod.ID)">load</button>
					</td>
					<td>{{ prod.Variete }}</td>
					<td>{{ prod.Format }}</td>
					<td :class="{'red': prod.Quantite<0}">{{ prod.Quantite }}</td>
					<td>{{ value(prod.reservation) }}</td>
					<td>{{ value(prod.years_pastM0) }}</td>
					<td>{{ value(prod.years_pastM1) }}</td>
					<td>{{ value(prod.years_pastM2) }}</td>
					<td>{{ value(prod.years_pastVe0) }}</td>
					<td>{{ value(prod.years_pastVe1) }}</td>
					<td>{{ value(prod.years_pastVe2) }}</td>
					<td>{{ value(prod.years_pastA0) }}</td>
					<td>{{ value(prod.years_pastA1) }}</td>
					<td>{{ value(prod.years_pastA2) }}</td>
					<td>{{ money(prod.years_pastV0) }}</td>
					<td>{{ money(prod.years_pastV1) }}</td>
					<td>{{ money(prod.years_pastV2) }}</td>
				</tr>
			</template>
		</table>

	</div>
</template>

<script lang="ts">
import {defineComponent, ref, computed, onMounted, onUnmounted, watch} from 'vue';
import HelloWorld from '@/components/HelloWorld.vue';
import {useStore} from "vuex";
import moment from "moment";

export default defineComponent({
	name: 'Home',
	components: {
		HelloWorld,
	},
	setup() {
		const store = useStore();
		store.dispatch('refreshProducts');

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

		return {
			load(ID) {
				store.dispatch('load', ID)
			},

			products: computed(() => store.state.products),
			oas: computed(() => store.state.oas),
			loading: computed(() => store.state.loading),

			pastTitle,

			money(val) {
				return val ? (parseFloat(val).toFixed(2) + "$") : "-";
			},
			value(val) {
				return val ? val : "-";
			}
		};
	}
});

function setupScroll(loadMorePosts) {
	onMounted(() => {
		window.addEventListener("scroll", handleScroll)
	})

	onUnmounted(() => {
		window.removeEventListener("scroll", handleScroll)
	})

	let isCalled = false;
	const handleScroll = async () => {
		if (isCalled)
			return;
		isCalled = true;

		let element = scrollComponent.value;
		let limit = 20;
		while (element && element.getBoundingClientRect().bottom < window.innerHeight && limit-- > 0)
			await loadMorePosts()

		isCalled = false;
	}

	const scrollComponent = ref(null);
	watch(scrollComponent, () => {
		handleScroll();
	});
	return scrollComponent;
}

</script>

<style scoped lang="scss">
.product {
	.red {
		background-color: #ff000085;
	}

	.yellow {
		background-color: #ffff0085;
	}

	.green {
		background-color: #00800085;
	}

	.blue {
		background-color: #0000ff85;
	}

	.violet {
		background-color: #ee82ee85;
	}

	.grey {
		background-color: #80808085;
	}
}

.product td {
	white-space: nowrap;
}
</style>
