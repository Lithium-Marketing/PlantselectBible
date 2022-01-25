<script lang="ts">
import {defineComponent, h} from "vue";

export default defineComponent({
	name: "Fatals",
	props: ["fatals"],
	setup(props, {slots}) {
		
		return () => {
			const tabs = props.fatals?.map(f => {
				const s = slots.default({fatal: f});
				return h(require("./Tab.vue").default, {header: f?.message}, () => s)
			});
			return h(require("./Tabs.vue").default, {}, ()=>tabs);
		}
	}
});
</script>

<style scoped>

</style>
