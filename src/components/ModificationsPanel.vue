<template>
	<div>
		<div class="header">
			<div>
				<ButtonConfirm @action="apply">Appliquer</ButtonConfirm>
				<ButtonConfirm @action="recalc" style="background-color: rgb(0 0 145)">Recalculer</ButtonConfirm>
				<ButtonConfirm @action="annule" style="background-color: rgb(165 0 0)">Annuler</ButtonConfirm>
			</div>
			<div>
				<ButtonConfirm @action="refresh" style="background-color: rgb(0 0 145)">Rafraîchir</ButtonConfirm>
			</div>
			<hr style="opacity: 0;">
			<input v-model="saveName"/>
			<button @click="save" :disabled="saveName.length<3">Sauvegarder tout</button>
		</div>
		<table style="margin-top: 1rem; margin-inline: auto">
			<tr>
				<th>Op.</th>
				<th>Desc.</th>
				<th>#</th>
			</tr>
			<tr>
				<th><input v-model="filters.op"/></th>
				<th><input v-model="filters.desc"/></th>
				<th></th>
			</tr>
			<tr v-for="(change,key) in changes" :key="key">
				<td>{{ change.data.op }}</td>
				<td>{{ change.data.desc }}</td>
				<td>{{ change.data.len }}</td>
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
import {MyServices, useMyServices} from "@/config/dataConfig";

export default defineComponent({
	name: "ModificationsPanel",
	components: {Pagination, ButtonConfirm},
	setup() {
		const store = useStore<StoreState>();
		const services = useMyServices();
		
		const filters = reactive({
			op: "",
			modId: "",
			desc: "",
		});
		
		const changes = computed(() => {
			
			const result = services.modification.raw.reduce((a,v)=>{
				a[v.name] = a[v.name] || {};
				a[v.name][v.desc] = (a[v.name][v.desc] ?? 0)+1;
				return a;
			},{});
			
			return Object.entries(result).flatMap(([op,descs]) => {
				return Object.entries(descs).map(([desc,len])=>{
					return {
						data: {
							op,
							desc,
							len
						}
					};
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
				})
			}),
			
			len: computed(() => {
				return Math.ceil(changes.value.length / store.state.settings.ipp);
			}),
			page,
			
			async annule() {
				services.modification.removeAll();
			},
			
			saveName,
			save() {
				services.save.createSave(saveName.value);
			},
			async apply() {
				await services.save.apply(false);
				services.modification.removeAll();
			},
			async recalc(){
				services.modification.reapply();
			},
			async refresh() {
				await services.data.refresh();
				services.modification.reapply();
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
	
	> div {
		margin: 2px;
		border: 1px solid black;
	}
	
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
