<template>
	<div class="about">

		<div class="row">
			<div>
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
			</div>

			<div>
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
				<table class="stat">
					<tr v-for="(changes,type) in types">
						<td>{{ type }}</td>
						<td>{{ changes }}</td>
					</tr>
				</table>
			</div>
		</div>

		<h2>Versions</h2>
		<table>
			<tr v-for="(version,name) in versions">
				<th>{{ name }}</th>
				<td>{{ version }}</td>
			</tr>
		</table>
	</div>
</template>

<script lang="ts">

import {computed, defineComponent, ref} from "vue";
import {useStore} from "vuex";
import {StoreState} from "@/store";
import {ModificationType} from "@/Modifications";
import {toText} from "@/Const";

export default defineComponent({
	name: 'About',
	components: {},
	setup() {
		const versions = ref(process.versions);
		const store = useStore<StoreState>();

		return {
			versions,

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
				set(val: string) {
					store.commit('mysqlLogin', JSON.parse(val));
				}
			}),

			types: computed(() => {
				return Object.values(store.state.modificationsRaw).reduce((a, v: ModificationType) => {
					const t = toText(v.type);
					if (!a[t])
						a[t] = 0;
					a[t]++;
					return a;
				}, {});
			}),

			productsLen: computed(() => Object.entries(store.state.products).length),
			oasLen: computed(() => Object.entries(store.state.oas).length),
			pricesLen: computed(() => Object.entries(store.state.prices).length),
			changesLen: computed(() => Object.entries(store.state.modifications).length),
		};
	}
});

</script>

<style scoped lang="scss">
.about {
	display: flex;
	align-items: center;
	flex-direction: column;
}

table {
	width: 0;
}

.row {
	display: flex;
	flex-wrap: wrap;
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
</style>
