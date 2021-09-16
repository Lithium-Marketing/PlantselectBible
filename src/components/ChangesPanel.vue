<template>
	<div>
		<div class="header">
			<ButtonConfirm @action="apply">Appliquer sélection</ButtonConfirm>
			<ButtonConfirm @action="annule" style="background-color: rgb(165 0 0)">Annuler tout</ButtonConfirm>
			<ButtonConfirm @action="refresh" style="background-color: rgb(0 0 145)">Rafraîchir</ButtonConfirm>
		</div>
		<Pagination :len="len" v-model:page="page"/>
		<table style="width: 100%">
			<tr>
				<th><span class="case" @click="coche(true)">☑</span><span class="case" @click="coche(false)">☒</span></th>
				<th>Type</th>
				<th>Ressource</th>
				<th>oldVal</th>
				<th>newVal</th>
			</tr>
			<tr>
				<th>{{ cocheTotal }}</th>
				<th><input v-model="filters.type"/></th>
				<th><input v-model="filters.resource"/></th>
				<th><input v-model="filters.old"/></th>
				<th><input v-model="filters.val"/></th>
			</tr>
			<tr v-for="(change,key) in changes">
				<td><input type="checkbox" :checked="coches[key]===undefined?true:coches[key]" @input="coches[key] = $event.target.checked"/></td>
				<th>{{ change.description?.type }}</th>
				<th>{{ change.description?.resource }}</th>
				<th>{{ change.description?.old }}</th>
				<th>{{ change.description?.val }}</th>
			</tr>
		</table>
	</div>
</template>

<script lang="ts">
import {computed, defineComponent, reactive, ref, watch} from "vue";
import ButtonConfirm from "./ButtonConfirm.vue";
import {useStore} from "vuex";
import {StoreState} from "../store";
import Pagination from "@/components/Pagination.vue";

export default defineComponent({
	name: "ChangesPanel",
	components: {Pagination, ButtonConfirm},
	setup() {
		const store = useStore<StoreState>();

		const filters = reactive({
			type: "", resource: "", old: "", val: ""
		});

		const coches = ref({});
		watch(store.state.changes, () => coches.value = {})

		const changes = computed(() => {
			return Object.entries(store.state.changes).filter((m) => {
				for (const filtersKey in filters) {
					if (!filters[filtersKey].length)
						continue;

					const val = m[1].description?.[filtersKey];
					if (typeof val !== "string")
						return false;
					if (!val.includes(filters[filtersKey]))
						return false;
				}
				return true;
			}).reduce((a, v) => {
				a[v[0]] = v[1];
				return a;
			}, {})
		});

		const page = ref(0);

		return {

			filters,

			changes: computed(() => {
				return Object.entries(changes.value).slice(page.value * store.state.settings.ipp, (page.value + 1) * store.state.settings.ipp).reduce((a, v) => {
					a[v[0]] = v[1]
					return a;
				}, {})
			}),

			coches,
			async coche(b: boolean) {
				Object.keys(changes.value).forEach(key => {
					coches.value[key] = b;
				});
			},

			len: computed(() => {
				return Math.ceil(Object.keys(changes.value).length / store.state.settings.ipp);
			}),
			page,
			cocheTotal: computed(() => {
				const sel = Object.entries(store.state.changes).filter(([v]) => coches.value[v] === undefined ? true : coches.value[v]).length
				return sel + "/" + Object.entries(store.state.changes).length
			}),

			async apply() {
				await store.dispatch("applyMod", Object.entries(store.state.changes).filter(([v, _]) => {
					return coches.value[v] === undefined ? true : coches.value[v];
				}).reduce((a, v) => {
					a[v[0]] = v[1];
					return a;
				}, {}));
				await store.dispatch("refresh", true);
			},
			async annule() {
				store.commit("clearMod");
				await store.dispatch("refresh", true);
			},
			refresh() {
				store.dispatch('refresh', true);
			},
		};
	}
})
</script>

<style lang="scss" scoped>
.header {
	display: flex;

	input {
		padding: 0.5rem 1rem;
		font-size: 1rem;
		margin: 0.2rem;
	}
}

.case {
	cursor: pointer;
}
</style>
