<template>
	<Menu/>
	<div v-if="loading" class="loading">
		<LoadingBar :progress="progress"/>
	</div>
	<router-view v-slot="{ Component }" v-else>
		<keep-alive>
			<component :is="Component"/>
		</keep-alive>
	</router-view>
</template>

<script>

import {computed, defineComponent} from "vue";
import HelloWorld from "@/components/HelloWorld";
import {useStore} from "vuex";
import {app} from '@electron/remote';
import Menu from "@/components/Menu";
import LoadingBar from "@/components/LoadingBar";

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

		return {
			loading: computed(() => store.state._.loading),
			progress: computed(() => store.state._['%']),
			version: isDev ? "dev" : app.getVersion()
		};
	}
});

</script>

<style lang="scss" scoped>


.loading{
}

</style>
