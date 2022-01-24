<template>
	<div>
		<div class="header">
			<ButtonConfirm @action="annule" style="background-color: rgb(165 0 0)">Annuler selection</ButtonConfirm>
			<ButtonConfirm @action="refresh" style="background-color: rgb(0 0 145)">Rafraîchir</ButtonConfirm>
			<ButtonConfirm @action="apply">Appliquer sélection</ButtonConfirm>
			<hr style="opacity: 0;">
			<input v-model="saveName"/>
			<button @click="save" disabled>Sauvegarder sélection</button>
		</div>
		<Pagination :len="len" v-model:page="page"/>
		<table style="width: 100%">
			<tr>
				<th><span class="case" @click="coche(true)">☑</span><span class="case" @click="coche(false)">☒</span></th>
				<th>Op.</th>
				<th>Nom</th>
				<th>Desc</th>
				<th>Champ</th>
				<th>Valeur</th>
			</tr>
			<tr>
				<th>{{ cocheTotal }}</th>
				<th><input v-model="filters.op"/></th>
				<th><input v-model="filters.txt"/></th>
				<th><input v-model="filters.desc"/></th>
				<th><input v-model="filters.field"/></th>
				<th><input v-model="filters.val"/></th>
			</tr>
			<tr v-for="(change,key) in changes" :key="key">
				<td><input type="checkbox" :checked="coches[change.modId]===undefined?true:coches[change.modId]" @input="coches[change.modId] = $event.target.checked"/></td>
				<th>{{ change.data.op }}</th>
				<th>{{ change.data.txt }}</th>
				<th>{{ change.data.desc }}</th>
				<th>{{ change.data.field }}</th>
				<th>{{ change.data.val }}</th>
			</tr>
		</table>
	</div>
</template>

<script lang="ts">
import {computed, defineComponent, reactive, ref} from "vue";
import ButtonConfirm from "./ButtonConfirm.vue";
import {useStore} from "vuex";
import {StoreState} from "@/store";
import Pagination from "@/components/Pagination.vue";
import {Services} from "@/services";
import {Mod} from "@/services/ModificationService";
import {tablesConfig, MyTablesConfig, MyTablesDef, useMyServices, MyServices} from "@/dataConfig";

export default defineComponent({
	name: "ModificationsPanel",
	components: {Pagination, ButtonConfirm},
	setup() {
		const store = useStore<StoreState>();
		const services = useMyServices();
		
		const filters = reactive({
			modId: "",
			txt: "",
			desc: "",
			field: "",
			val: "",
		});
		
		const coches = ref({});
		
		const changes = computed(() => {
			return Object.values(services.modification.raw).flatMap((v) => {
				return Object.entries(v.result.mods).flatMap(([table, mods]) => {
					return Object.entries(mods).flatMap(([id, fields]) => {
						return Object.entries(fields).map(([field, value]) => {
							return {
								modId: v.result.id,
								key: [table, id, field].join(":"),
								data: {
									op: v.name,
									txt: translateMod(services, table, id),
									desc: v.desc,
									field: field,
									val: value
								}
							};
						})
					})
				})
			}).filter(s => s);
		});
		
		const page = ref(0);
		const saveName = ref("");
		
		
		return {
			filters,
			
			changes: computed(() => {
				const filterA = Object.entries(filters).map(v => [v[0], v[1].toUpperCase()]);
				return changes.value.filter(v => {
					return filterA.filter(([name, val]) => {
						return val === "" ||
							(typeof v.data[name] === "string" && v.data[name].toUpperCase().indexOf(val) !== -1) ||
							(typeof v.data[name] === "number" && Math.abs(v.data[name] - parseFloat(val)) < 1.1)
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
				const sel = changes.value.filter((v) => coches.value[v.modId] === undefined ? true : coches.value[v.modId]).length
				return sel + "/" + changes.value.length
			}),
			
			len: computed(() => {
				return Math.ceil(changes.value.length / store.state.settings.ipp);
			}),
			page,
			
			async annule() {
				changes.value.forEach(v => {
					if (coches.value[v.modId] === undefined ? true : coches.value[v.modId]) {
						delete services.modification.raw[v.modId];
						coches.value[v.modId] = undefined;
					}
				});
			},
			
			saveName,
			save() {
			
			},
			async apply() {
				services.save.apply();
			},
			refresh() {
				services.data.refresh();
				
			},
		};
	}
});

function translateMod(services: MyServices, table: string, id: any) {
	switch (table) {
		case "produits":
			return services.data.get("produits", id).value?.Code + " " + services.data.get("produits", id).value?.Variete;
		case "produits_prix":
			const prod_id = services.data.get("produits_prix", id).value?.Produit_ID;
			return services.data.get("produits", prod_id).value?.Code + " " + services.data.get("produits", prod_id).value?.Variete;
		default:
			return table + " " + id
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
