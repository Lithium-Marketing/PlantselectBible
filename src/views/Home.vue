<template>
	<div class="home">
		<div class="row">
			<div>
				<h2>Actions</h2>
				<ButtonConfirm @action="apply">Appliquer les changements</ButtonConfirm>
				<ButtonConfirm @action="refresh" style="background-color: rgb(0 0 145)">Rafraîchir les données</ButtonConfirm>
				<hr style="width: 100%">
				<ButtonConfirm @action="annule" style="background-color: rgb(165 0 0)">Annuler les changements</ButtonConfirm>
			</div>
			<div class="saves">
				<h2>Sauvegarde</h2>
				<loading-bar :progress="-1" v-if="$store.state._.loadingSaves"/>
				<table v-else>
					<tr>
						<td>
							<button @click="$store.dispatch('createSave',saveName)">nouvelle sauvgarde</button>
							<button @click="$store.dispatch('refreshSaves')" style="background-color: rgb(160 160 160)">R</button>
						</td>
						<td><input v-model="saveName"/></td>
					</tr>
					<tr v-for="save of $store.state.saves">
						<td>
							<ButtonConfirm @action="$store.dispatch('loadSave',save.Data)">load</ButtonConfirm>
							<ButtonConfirm @action="$store.dispatch('deleteSave',save.ID)" style="background-color: rgb(165 0 0)">X</ButtonConfirm>
						</td>
						<td>{{ save.Name }}</td>
					</tr>
				</table>
			</div>
		</div>

		<h2>Changements</h2>
		<table>
			<tr v-for="change of changes">
				<td><strong>{{ change.text }}</strong></td>
				<td><small>{{ change.sql }}</small></td>
			</tr>
		</table>
	</div>
</template>

<script lang="ts">
import {computed, defineComponent, onMounted, onUnmounted, ref, watch} from 'vue';
import {useStore} from "vuex";
import moment from "moment";
import ButtonConfirm from "@/components/ButtonConfirm.vue";
import {StoreState} from "@/store";
import LoadingBar from "@/components/LoadingBar.vue";

export default defineComponent({
	name: 'Home',
	components: {LoadingBar, ButtonConfirm},
	setup() {
		const store = useStore<StoreState>();

		const year = moment().add(7, 'M').year();

		return {
			saveName: ref(""),

			changes: computed(() => Object.values(store.state.modifications)),

			refresh() {
				store.dispatch('refresh', true);
			},
			async apply() {
				await store.dispatch("applyMod");
				await store.dispatch("refresh", true);
			},
			async annule() {
				store.commit("clearMod");
				await store.dispatch("refresh", true);
			},
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

	.row {
		display: flex;
		justify-content: center;
		gap: 1rem;

		width: 100%;
		padding-block: 1rem;

		> div {
			display: flex;
			flex-direction: column;
			border: 1px solid black;
			padding: 1rem;
		}
	}

	.saves {
		td:nth-child(1) {
			display: flex;

			button:nth-child(1) {
				flex-grow: 1;
			}
		}

		tr:nth-child(1) {
			background-color: #ccc;
		}
	}


}

</style>
