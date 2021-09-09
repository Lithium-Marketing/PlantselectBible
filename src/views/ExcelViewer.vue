<template>
	<div style="flex-grow: 1">
		<LoadingBar v-if="loading" :progress="-1"/>
		<iframe v-else :src='src' width='100%' style="height: 80vh" frameborder='0'>

		</iframe>
	</div>
</template>

<script>
import LoadingBar from "@/components/LoadingBar";
import {computed, ref} from "vue";
import {useRoute} from "vue-router";

export default {
	name: "ExcelViewer",
	components: {LoadingBar},
	setup(props,{}) {
		const route = useRoute();

		const loading = ref(false);
		// "https://file-examples-com.github.io/uploads/2017/02/file_example_XLS_10.xls"
		const src = computed(()=>{
			return route.params.file
		});

		return {
			loading,
			src: computed(() => {
				//return "https://view.officeapps.live.com/op/embed.aspx?src=http://plantselect.lithiumwebsolutions.com/php/temp_file_server.php?file=" + src.value
				return "https://view.officeapps.live.com/op/view.aspx?src=http://plantselect.lithiumwebsolutions.com/php/temp_file_server.php?file=" + src.value
			})
		};
	}
}
</script>

<style scoped>

</style>
