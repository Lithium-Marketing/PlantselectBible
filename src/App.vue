<template>
	<div v-if="fatalError.length" class="fatals">
		<h1>Une erreur Fatal est survenue</h1>
		<Fatals :fatals="fatalError" #="{fatal}">
			<div class="fatal">
				<h2>{{ fatal?.message }}</h2>
				<pre>{{ fatal?.stack }}</pre>
			</div>
		</Fatals>
		<button-confirm @action="clearAll()">Supprimer tout les donner en memoire (non reversible)</button-confirm>
		<button @click="copy()">Copier les logs dans le press-papier</button>
	</div>
	<template v-else>
		<Menu v-if="!loading" v-model:loading="loading"/>
		<div v-if="loading" class="loading">
			<h1>Operation {{ loadingDone ? "fini" : "en cour" }}</h1>
			<button v-if="progresses.length" :disabled="!loadingDone" @click="closeLoading">Done</button>
			
			<template v-for="progress of progresses">
				<h2>{{ progress[0] }}</h2>
				<LoadingBar :progress="progress[1]"/>
			</template>
			
			<button :disabled="!loadingDone" @click="closeLoading">Done</button>
			<button @click="copy()">Copier les logs dans le press-papier</button>
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
</template>

<script>

import {computed, defineComponent, ref, watchEffect} from "vue";
import HelloWorld from "@/components/HelloWorld";
import {useStore} from "vuex";
import Menu from "@/components/Menu";
import LoadingBar from "@/components/LoadingBar";
import {useServices} from "@/services";
import Fatals from "@/components/Fatals";
import ButtonConfirm from "@/components/ButtonConfirm";

export default defineComponent({
	name: 'Home',
	components: {
		ButtonConfirm,
		Fatals,
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
			if (!Object.entries(services.job.running.value).length && !loading.value)
				lastJobs.value = {};
			
			Object.entries(services.job.running.value).forEach(([name, percent]) => {
				if (lastJobs.value[name] === undefined)
					loading.value = true;
				lastJobs.value[name] = percent;
			});
			Object.keys(lastJobs.value).forEach(k => {
				if (services.job.running.value[k] === undefined)
					lastJobs.value[k] = 1;
			})
		});
		
		return {
			fatalError: services.fatals,
			clearAll() {
				localStorage.clear();
			},
			copy() {
				navigator.clipboard.writeText(services.logs.json())
			},
			
			loading,
			closeLoading() {
				loading.value = false;
			},
			
			loadingDone: computed(() => {
				return true
			}),
			progresses: computed(() => Object.entries(lastJobs.value)),
			
			version: isDev ? "dev" : "N/D",
			
			logs: computed(() => {
				return ["TODO"]
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

.fatals {
	padding: 1rem;
	margin: 0;
	
	.fatal {
		padding: 1rem;
		color: darkred;
		
		pre {
			text-align: left;
		}
	}
}

</style>
