<template>
	<div class="home">
		<div class="op">
			<ButtonConfirm @action="refresh">Rafraîchir les données</ButtonConfirm>
			<ButtonConfirm @action="save">Sauvegarder les changements</ButtonConfirm>
			<ButtonConfirm @action="annule">Annuler les changements</ButtonConfirm>
		</div>
		<table>
			<tr>
				<td>Nombre de produit:</td>
				<td>{{ productsLen }}</td>
			</tr>
			<tr>
				<td>Nombre de OA:</td>
				<td>{{ oasLen }}</td>
			</tr>
			<tr>
				<td>Nombre de Changement:</td>
				<td>{{ changesLen }}</td>
			</tr>
		</table>
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
	</div>
</template>

<script>
import {defineComponent, ref, computed, onMounted, onUnmounted, watch} from 'vue';
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
			changesLen: computed(() => Object.entries(store.state.changes).length),

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
			save() {

			},
			annule() {


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
}

</style>
