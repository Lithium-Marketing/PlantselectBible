<template>
	<div>
		<div class="header">
			<ButtonConfirm @action="annule" style="background-color: rgb(165 0 0)">Annuler selection</ButtonConfirm>
			<ButtonConfirm @action="refresh" style="background-color: rgb(0 0 145)">Rafraîchir</ButtonConfirm>
			<ButtonConfirm @action="apply" disabled>Appliquer sélection</ButtonConfirm>
			<hr style="opacity: 0;">
			<input v-model="saveName"/>
			<button @click="save" disabled>Sauvegarder sélection</button>
		</div>
		<Pagination :len="len" v-model:page="page"/>
		<table style="width: 100%">
			<tr>
				<th><span class="case" @click="coche(true)">☑</span><span class="case" @click="coche(false)">☒</span></th>
				<th>Nom</th>
				<th>Desc</th>
				<th>Valeur</th>
			</tr>
			<tr>
				<th>{{ cocheTotal }}</th>
				<th><input v-model="filters.txt"/></th>
				<th><input v-model="filters.desc"/></th>
				<th><input v-model="filters.val"/></th>
			</tr>
			<tr v-for="(change,key) in changes">
				<td><input type="checkbox" :checked="coches[key]===undefined?true:coches[key]" @input="coches[key] = $event.target.checked"/></td>
				<th>{{ change.txt }}</th>
				<th>{{ change.desc }}</th>
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
import Pagination from "@/components/Pagination.vue";
import {Services, Tables, useServices} from "@/services";
import {Mod} from "@/services/ModificationService";

export default defineComponent({
	name: "ModificationsPanel",
	components: {Pagination, ButtonConfirm},
	setup() {
		const store = useStore<StoreState>();
		const services = useServices();

		const filters = reactive({
			txt: "",
			desc: "",
			val: "",
		});

		const coches = ref({});

		const changes = computed<(Mod<Tables> & { key: string,txt:string })[]>(() => {
			return services.modification.asList().value.reduce((a, v) => {
				a.push({...v, key: Object.values(v).join(),txt: translateMod(v,services)})
				return a;
			}, [])
		});

		const page = ref(0);
		const saveName = ref("");


		return {
			filters,

			changes: computed(() => {
				const filterA = Object.entries(filters).map(v=>[v[0],v[1].toUpperCase()]);
				return changes.value.filter(v=>{
					return filterA.filter(([name,val])=>{
						return val==="" || v[name].toUpperCase().indexOf(val)!==-1;
					}).length == filterA.length;
				}).slice(page.value * store.state.settings.ipp, (page.value + 1) * store.state.settings.ipp).reduce((a, v) => {
					a[v.key] = v
					return a;
				}, {})
			}),

			coches,
			async coche(b: boolean) {
				changes.value.forEach(v => {
					coches.value[v.key] = b;
				});
			},
			cocheTotal: computed(() => {
				const sel = changes.value.filter((v) => coches.value[v.key] === undefined ? true : coches.value[v.key]).length
				return sel + "/" + changes.value.length
			}),

			len: computed(() => {
				return Math.ceil(changes.value.length / store.state.settings.ipp);
			}),
			page,

			async annule() {
				changes.value.forEach(v => {
					if (coches.value[v.key] === undefined ? true : coches.value[v.key]) {
						services.modification.remove(v.table, v.id, v.field);
						coches.value[v.key] = undefined;
					}
				});
			},

			saveName,
			save() {

			},
			async apply() {
			},
			refresh() {
				services.data.refresh();
			},
		};
	}
});

function translateMod(mod: Mod<Tables>, services: Services) {
	switch (mod.table) {
		case "produits":
			return services.data.get(mod.table,mod.id).value?.Code + " " + services.data.get(mod.table,mod.id).value?.Variete;
		default:
			return mod.table + " " + mod.id
	}
}

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
