<template>
	<div class="about">
		<h1>This is an about page</h1>
		<h2>Versions</h2>
		<table>
			<tr v-for="(version,name) in versions">
				<th>{{ name }}</th>
				<td>{{ version }}</td>
			</tr>
		</table>
		<h2>Logs</h2>
		<ul>
			<li v-for="log in logs">{{log}}</li>
		</ul>
	</div>
</template>

<script>

import {defineComponent, ref, computed} from "vue";
import {useStore} from "vuex";

export default defineComponent({
	name: 'About',
	components: {},
	setup() {
		const versions = ref(process.versions);
		const store = useStore();

		return {versions, logs: computed(() => store.state.logs)};
	}
});

</script>

<style scoped>
.about {
	display: flex;
	align-items: center;
	flex-direction: column;
}

table {
	width: 0;
}
</style>
