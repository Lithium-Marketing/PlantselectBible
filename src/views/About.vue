<template>
  <div class="about">
    <h1>This is an about page</h1>
	  <table>
		  <tr v-for="(version,name) in versions">
			  <th>{{name}}</th>
			  <td>{{version}}</td>
		  </tr>
	  </table>
  </div>
</template>

<script>

import {defineComponent, ref} from "vue";

export default defineComponent({
	name: 'About',
	components: {
	},
	setup(){
		const versions = ref(process.versions);
		return {versions};
	}
});

</script>

<style scoped>
.about{
	display: flex;
	align-items: center;
	flex-direction: column;
}
table{
	width: 0;
}
</style>
