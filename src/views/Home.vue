<template>
	<div class="home">
		<div class="op">
			<ButtonConfirm @action="refresh" style="background-color: rgb(165 0 0)">Rafraîchir les données & Annuler les changements</ButtonConfirm>
			<ButtonConfirm @action="save">Sauvegarder les changements & Rafraîchir les données</ButtonConfirm>
		</div>
		<h2>Statistique</h2>
		<table class="stat">
			<tr>
				<td>Nombre de produit:</td>
				<td>{{ productsLen }}</td>
			</tr>
			<tr>
				<td>Nombre de OA:</td>
				<td>{{ oasLen }}</td>
			</tr>
			<tr>
				<td>Nombre de Prix:</td>
				<td>{{ pricesLen }}</td>
			</tr>
			<tr>
				<td>Nombre de Changement:</td>
				<td>{{ changesLen }}</td>
			</tr>
		</table>
		<h2>Configuration</h2>
		<table>
			<tr>
				<td>Elements par page:</td>
				<td><select v-model="ipp">
					<option v-for="n in 10" :value="n*10">{{ n * 10 }}</option>
				</select></td>
			</tr>
			<tr>
				<td>Chaine de connexion:</td>
				<td><input v-model="mysqlLogin"></td>
			</tr>
		</table>
		<h2 v-if="changesLen">Changements</h2>
		<table>
			<tr v-for="change of changes">
				<td><strong>{{ change.text }}</strong></td>
				<td><small>{{ change.sql }}</small></td>
			</tr>
		</table>
	</div>
</template>

<script>
import {computed, defineComponent, onMounted, onUnmounted, ref, watch} from 'vue';
import {useStore} from "vuex";
import moment from "moment";
import ButtonConfirm from "@/components/ButtonConfirm";

export default defineComponent({
	name: 'Home',
	components: {ButtonConfirm},
	setup() {
		const store = useStore();

		const year = moment().add(7, 'M').year();

		return {
			productsLen: computed(() => Object.entries(store.state.products).length),
			oasLen: computed(() => Object.entries(store.state.oas).length),
			pricesLen: computed(() => Object.entries(store.state.prices).length),
			changesLen: computed(() => Object.entries(store.state.changes).length),

			changes: computed(() => Object.values(store.state.changes)),

			ipp: computed({
				get() {
					return store.state.settings.ipp;
				},
				set(val) {
					store.commit('ipp', val);
				}
			}),
			mysqlLogin: computed({
				get() {
					return JSON.stringify(store.state.mysqlLogin);
				},
				set(val) {
					store.commit('mysqlLogin', JSON.parse(val));
				}
			}),

			refresh() {
				store.dispatch('refresh', true);
			},
			async save() {
				console.log("applyMod");
				await store.dispatch("applyMod");
				console.log("refresh");
				await store.dispatch("refresh", true);
				console.log("done");
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

.home {
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;

	.msg {
		font-size: 1.3rem;
		font-weight: bold;
		padding-bottom: 1rem;
	}

	.op {
		display: flex;
		justify-content: center;
		gap: 1rem;

		width: 100%;
		padding: 1rem;

		button {
		}
	}

	.stat {
		border-collapse: collapse;
		border: 1px solid #f2f2f2;

		tr {
			border-bottom: 1px solid #f2f2f2;
		}

		td {
			padding: .5rem;
			border-left: 1px solid #f2f2f2;
		}
	}
}

</style>
