<template>
	<div id="nav">
		<div class="nav">
			<router-link to="/">Home</router-link>
			<span>|</span>
			<router-link to="/edit">Edit</router-link>
			<span>|</span>
			<router-link to="/tools">Tools</router-link>
			<span>|</span>
			<router-link to="/about">About</router-link>
			<span>|</span>
			<a href="#" @click.prevent="loading = true">Logs</a>
			<span>|</span>
			<strong :class="{pill:true,canUp: canUpdate}" @click="update" :title="canUpdate?'Maintenir \'Ctrl\' et cliquez' : ''">{{ version }}</strong>
		</div>
		
		<div class="nav">
			<router-link to="/viewA">View A</router-link>
			<span>|</span>
			<router-link to="/viewA2">View A2</router-link>
			<span>|</span>
			<router-link to="/viewB">View B</router-link>
			<span>|</span>
      <router-link to="/viewD">View D</router-link>
      <span>|</span>
			<router-link to="/futur">Qty. Futur</router-link>
		</div>
	</div>
</template>

<script>

import {computed, defineComponent, ref} from "vue";
import HelloWorld from "@/components/HelloWorld";
import {useStore} from "vuex";
//import {app, autoUpdater} from "@electron/remote";

export default defineComponent({
	name: 'Menu',
	components: {
		HelloWorld,
	},
	props: ['loading'],
	emits: ['update:loading'],
	setup(props, {emit}) {
		const store = useStore();
		
		const isDev = process.env.NODE_ENV === "development";
		console.log(isDev);
		const canUpdate = ref(false);
		
		window.electronAPI.onUpdateAvailable(() => canUpdate.value = true);
		
		return {
			canUpdate,
			version: isDev ? "dev" : window.electronAPI.getVersion(),
			update() {
        console.log('update');
        const c = confirm('Voulez-vous faire la mise-à-jour ?');
        if(!c){
          return false;
        }
				window.electronAPI.quitAndInstall();
			},
			
			loading: computed({
				get() {
					return props.loading
				},
				set(v) {
					emit("update:loading", v)
				}
			})
		};
	}
});

</script>

<style lang="scss" scoped>
.pill {
	background-color: navy;
	color: white;
	border-radius: 25%;
	padding: .4em;
	font-size: .7rem;
	
	&.canUp {
		animation: flash .5s ease-in-out infinite alternate;
	}
}

@keyframes flash {
	0% {
		background-color: red;
	}
	50% {
		background-color: navy;
	}
	100% {
		background-color: darkgreen;
	}
}

#nav {
	padding-top: 30px;
	padding-bottom: 30px;
}

.nav {
	padding-bottom: .2rem;
	display: flex;
	justify-content: center;
	align-items: center;
	
	> span {
		padding-right: .1rem;
		padding-left: .1rem;
		font-weight: bolder;
		font-size: 1.2rem;
	}
	
	a {
		font-weight: bold;
		color: #fff;
		background-color: #8daa26;
		padding: .2rem;
		border-radius: 10px;
		text-decoration: none;
		
		&.router-link-exact-active {
			color: #ffa;
		}
	}
}
</style>
