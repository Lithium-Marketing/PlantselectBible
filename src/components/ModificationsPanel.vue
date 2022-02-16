<template>
	<div>
		<div class="header">
			<ButtonConfirm @action="annule" style="background-color: rgb(165 0 0)">Annuler tout</ButtonConfirm>
			<ButtonConfirm @action="refresh" style="background-color: rgb(0 0 145)">Rafraîchir</ButtonConfirm>
			<ButtonConfirm @action="apply">Appliquer tout</ButtonConfirm>
			<hr style="opacity: 0;">
			<input v-model="saveName"/>
			<button @click="save" :disabled="saveName.length<3">Sauvegarder tout</button>
		</div>
		<Pagination :len="len" v-model:page="page"/>
		<table style="width: 100%">
			<tr>
				<th><span class="case" @click="coche(true)">☑</span><span class="case" @click="coche(false)">☒</span></th>
				<th>Id.</th>
				<th>Op.</th>
				<th>Desc.</th>
				<th># Mod.</th>
			</tr>
			<tr>
				<th>{{ cocheTotal }}</th>
				<th><input v-model="filters.modId"/></th>
				<th><input v-model="filters.op"/></th>
				<th><input v-model="filters.desc"/></th>
				<th></th>
			</tr>
			<tr v-for="(change,key) in changes" :key="key">
				<td><input type="checkbox" :checked="coches[change.modId]===undefined?true:coches[change.modId]" @input="coches[change.modId] = $event.target.checked"/></td>
				<th>{{ change.data.modId }}</th>
				<th>{{ change.data.op }}</th>
				<th>{{ change.data.desc }}</th>
				<th>{{ change.data.nMod }}</th>
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
import {useMyServices, MyServices} from "@/config/dataConfig";

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
		
		const coches = ref({});
		
		const changes = computed(() => {
			return Object.entries(services.modification.raw).flatMap(([id,v]) => {
				const nMod = services.modification.results[id]?.nOp;
				
				return {
					modId: id,
					key: [id].join(":"),
					data: {
						modId: id,
						op: v.name,
						desc: v.desc,
						nMod
					}
				};
				
			}).filter(s => s);
		});
		
		const page = ref(0);
		const saveName = ref("");
		
		const selection = computed(() => changes.value.filter((v) => coches.value[v.modId] === undefined ? true : coches.value[v.modId]).map(v => v.modId))
		
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
				services.modification.removeAll();
			},
			
			saveName,
			save() {
				services.save.createSave(saveName.value);
			},
			async apply() {
				await services.save.apply(false);
				Object.keys(services.modification.raw).forEach(k => delete services.modification.raw[k])
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
