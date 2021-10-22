<template>
	<Menu v-if="!loading" v-model:loading="loading"/>
	<div v-if="loading" class="loading">
		<h1>Operation {{ loadingDone ? "fini" : "en cour" }}</h1>

		<template v-for="progress of progresses">
			<h2>{{progress[0]}}</h2>
			<LoadingBar  :progress="progress[1]"/>
		</template>

		<button :disabled="!loadingDone" @click="closeLoading">Done</button>
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
import {useServices} from "@/services";

export default defineComponent({
	name: 'Home',
	components: {
		LoadingBar,
		Menu,
		HelloWorld,
	},
	setup() {
		const store = useStore();
		const services = useServices();

		const isDev = process.env.NODE_ENV === "development";

		const loading = ref(false);
		const lastJobs = ref({});
		watchEffect(() => {
			if(!Object.entries(services.job.running.value).length && !loading.value)
				lastJobs.value = {};

			Object.entries(services.job.running.value).forEach(([name,percent])=>{
				if(lastJobs.value[name]===undefined)
					loading.value = true;
				lastJobs.value[name] = percent;
			});
			Object.keys(lastJobs.value).forEach(k=>{
				if(services.job.running.value[k]===undefined)
					lastJobs.value[k] = 1;
			})
		});

		return {
			loading,
			closeLoading() {
				loading.value = false;
			},

			loadingDone: computed(() => {
				return true
			}),
			progresses: computed(() => Object.entries(lastJobs.value)),

			version: isDev ? "dev" : app.getVersion(),

			logs: computed(() => {
				return [...store.state._.logs].reverse().map(l => moment(l.date).format('HH:ss') + ":" + l.text)
			}),
		};
	}
});

</script>

<style lang="scss" scoped>

.logContainer {
	height: 70vh;
	overflow-y: scroll;
	border: 1px solid black;
	border-radius: 5px;
	box-sizing: border-box;
	margin-inline: 1rem;

	li {
		text-align: left;
	}
}

</style>
