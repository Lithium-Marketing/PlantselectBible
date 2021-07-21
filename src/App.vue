<template>
	<div id="nav">
		<router-link to="/">Home</router-link>
		|
		<router-link to="/about">About</router-link>
	</div>
	<div v-if="loading">
		Loading...
	</div>
	<router-view v-slot="{ Component }" v-else>
		<keep-alive>
			<component :is="Component" />
		</keep-alive>
	</router-view>

</template>

<script>

import {computed, defineComponent} from "vue";
import HelloWorld from "@/components/HelloWorld";
import {useStore} from "vuex";

export default defineComponent({
	name: 'Home',
	components: {
		HelloWorld,
	},
	setup() {
		const store = useStore();
		store.dispatch('refreshProducts');

		return {
			loading: computed(() => store.state.loading),
		};
	}
});

</script>

<style lang="scss">
#app {
	font-family: Avenir, Helvetica, Arial, sans-serif;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
	text-align: center;
	color: #2c3e50;
}

#nav {
	padding: 30px;

	a {
		font-weight: bold;
		color: #2c3e50;

		&.router-link-exact-active {
			color: #42b983;
		}
	}
}
</style>
