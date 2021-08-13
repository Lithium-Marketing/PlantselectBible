<template>
	<div id="nav">
		<router-link to="/">Home</router-link>
		<span>|</span>
		<router-link to="/viewA">View A</router-link>
		<span>|</span>
		<router-link to="/products">Produits</router-link>
		<span>|</span>
		<router-link to="/oas">OAs</router-link>
		<span>|</span>
		<router-link to="/edit">Edit</router-link>
		<span>|</span>
		<router-link to="/tools">Tools</router-link>
		<span>|</span>
		<router-link to="/about">About</router-link>
		<span>|</span>
		<strong class="pill">{{ version }}</strong>
	</div>
	<div v-if="loading">
		Loading...
	</div>
	<router-view v-slot="{ Component }" v-else>
		<keep-alive>
			<component :is="Component"/>
		</keep-alive>
	</router-view>
</template>

<script>

import {computed, defineComponent,ref} from "vue";
import HelloWorld from "@/components/HelloWorld";
import {useStore} from "vuex";
import {app} from '@electron/remote';

export default defineComponent({
	name: 'Home',
	components: {
		HelloWorld,
	},
	setup() {
		const store = useStore();
		store.dispatch('refresh');

		const isDev = process.env.NODE_ENV === "development";

		return {
			loading: computed(() => store.state._.loading),
			version: isDev ? "dev" : app.getVersion()
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

.pill {
	background-color: navy;
	color: white;
	border-radius: 25%;
	padding: .3em;
	font-size: .6rem;
}

#nav {
	padding: 30px;
	display: flex;
	justify-content: center;
	align-items: center;

	> span {
		padding-right: .3rem;
		padding-left: .3rem;
		font-weight: bolder;
		font-size: 1.2rem;
	}

	a {
		font-weight: bold;
		color: #2c3e50;

		&.router-link-exact-active {
			color: #42b983;
		}
	}
}
</style>
