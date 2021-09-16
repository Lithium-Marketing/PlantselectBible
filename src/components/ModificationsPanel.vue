<template>
	<div>
		<div class="header">
			<ButtonConfirm @action="annule" style="background-color: rgb(165 0 0)">Annuler selection</ButtonConfirm>
		</div>
		<table style="width: 100%">
			<tr>
				<th><span class="case" @click="coche(true)">☑</span><span class="case" @click="coche(false)">☒</span></th>
				<th>Type</th>
				<th>Produit</th>
				<th>OA</th>
				<th>Valeur</th>
			</tr>
			<tr>
				<th>{{ cocheTotal }}</th>
				<th><input v-model="filters.type"/></th>
				<th><input v-model="filters.Produit"/></th>
				<th><input v-model="filters.OA_ID"/></th>
				<th><input v-model="filters.val"/></th>
			</tr>
			<tr v-for="(change,key) in changes">
				<td><input type="checkbox" :checked="coches[key]===undefined?true:coches[key]" @input="coches[key] = $event.target.checked"/></td>
				<th>{{ change.type }}</th>
				<th>{{ change.Produit }}</th>
				<th>{{ change.OA_ID }}</th>
				<th>{{ change.val }}</th>
			</tr>
		</table>
	</div>
</template>

<script lang="ts">
import {computed, defineComponent, reactive, ref} from "vue";
import ButtonConfirm from "./ButtonConfirm.vue";
import {useStore} from "vuex";
import {StoreState} from "../store";

export default defineComponent({
	name: "ModificationsPanel",
	components: {ButtonConfirm},
	setup() {
		const store = useStore<StoreState>();

		const filters = reactive({
			type: "",
			Produit: "",
			OA_ID: "",
			val: "",
		});

		const coches = ref({});

		const changes = computed(() => {
			return Object.entries(store.state.modificationsRaw).map((v: [string, any]) => {
				const mod = v[1];
				if ('Produit_ID' in mod)
					v = [v[0], {
						...mod,
						Produit: store.state.products[mod.Produit_ID].Variete + " " + store.state.products[mod.Produit_ID].Format + "g",
						val: mod.val
					}]
				if('colorType' in mod)
					v[1].val = mod.colorType + " -> " + mod.val;
				return v;
			}).filter((m) => {
				for (const filtersKey in filters) {
					if (!filters[filtersKey].length)
						continue;

					const val = m[1]?.[filtersKey];
					if (typeof val !== "string")
						return false;
					if (!val.includes(filters[filtersKey]))
						return false;
				}
				return true;
			}).reduce((a, v) => {
				a[v[0]] = v[1]
				return a;
			}, {})
		});

		return {

			filters,

			changes,

			coches,
			async coche(b: boolean) {
				Object.keys(changes.value).forEach(key => {
					coches.value[key] = b;
				});
			},
			cocheTotal: computed(() => {
				const sel = Object.entries(store.state.modificationsRaw).filter(([v]) => coches.value[v] === undefined ? true : coches.value[v]).length
				return sel + "/" + Object.entries(store.state.modificationsRaw).length
			}),
			async annule() {
				const mods =  Object.entries(store.state.modificationsRaw).filter(([v, _]) => {
					return !(coches.value[v] === undefined ? true : coches.value[v]);
				}).reduce((a, v) => {
					a[v[0]] = {...v[1]};
					return a;
				}, {});
				store.commit("clearMod");
				store.commit("modificationsRaw",mods);
				await store.dispatch("refresh", true);
			}
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
