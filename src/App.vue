<template>
	<Menu v-if="!loading" v-model:loading="loading"/>
	<div v-if="loading" class="loading">
		<h1>Operation {{loadingDone?"fini":"en cour"}}</h1>
		<LoadingBar v-if="!loadingDone" :progress="progress"/>
		<button :disabled="!loadingDone" @click="doneLoading">Done</button>
		<hr/>
		<h2>Logs</h2>
		<div class="logContainer">
			<ul>
				<li v-for="log in logs">{{ log }}</li>
			</ul>
		</div>
	</div>
	<router-view v-slot="{ Component }" v-else>
		<keep-alive>
			<component :is="Component"/>
		</keep-alive>
	</router-view>
</template>

<script>

import {computed, defineComponent, ref, watchEffect} from "vue";
import HelloWorld from "@/components/HelloWorld";
import {useStore} from "vuex";
import {app} from '@electron/remote';
import Menu from "@/components/Menu";
import LoadingBar from "@/components/LoadingBar";
import moment from "moment";

export default defineComponent({
	name: 'Home',
	components: {
		LoadingBar,
		Menu,
		HelloWorld,
	},
	setup() {
		const store = useStore();

		const isDev = process.env.NODE_ENV === "development";

		const loading = ref(false);
		const loadingDone = ref(false);

		watchEffect(() => {
			if (store.state._.loading) {
				loading.value = true;
				loadingDone.value = false;
			} else
				loadingDone.value = true;
		});

		return {
			loading,
			loadingDone,
			doneLoading() {
				loading.value = false;
			},

			progress: computed(() => store.state._['%']),
			version: isDev ? "dev" : app.getVersion(),

			logs: computed(() => {
				return [...store.state._.logs].reverse().map(l => moment(l.date).format('HH:ss') + ":" + l.text)
			}),
		};
	}
});

</script>

<style lang="scss" scoped>

.logContainer{
	height: 75vh;
	overflow-y: scroll;
	border: 1px solid black;
	border-radius: 5px;
	box-sizing: border-box;
	margin-inline: 1rem;
	li{
		text-align: left;
	}
}

</style>
