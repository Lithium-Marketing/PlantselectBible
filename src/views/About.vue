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
import {Modification} from "@/helper/Modifications";
import {toText} from "@/helper/Const";
import {useMyServices} from "@/config/dataConfig";

export default defineComponent({
	name: 'About',
	components: {},
	setup() {
		const versions = ref(process.versions);
		const store = useStore<StoreState>();
		const service = useMyServices();

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
					return JSON.stringify(service.data.mysqlLogin.value);
				},
				set(val: string) {
					service.data.mysqlLogin.value = JSON.parse(val);
				}
			}),

			productsLen: computed(() => Object.entries(store.state._.products).length),
			oasLen: computed(() => Object.entries(store.state._.oas).length),
			pricesLen: computed(() => Object.entries(store.state._.prices).length),
			changesLen: computed(() => Object.entries(store.state._.changes).length),
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
</style>
