<script setup lang="ts">
import {computed, defineProps, ref} from 'vue';
import TableInput2 from "@/components/TableInput2.vue";
import {useMyServices} from "@/config/dataConfig";
import {ContextMenu} from "@/helper/ContextMenu";

const services = useMyServices();

const cell = defineProps(["rowSpan", "action", "val", "edit", "color"])

const td = ref<HTMLTableCellElement>(null);
const color = computed<string>({
	get() {
		return services.data.tables[cell.color?.table]?.value[cell.color?.entityId]?.[cell.color?.field]
	},
	set(val) {
		services.modification.mod("manual", {
			table: cell.color.table,
			field: cell.color.field,
			id: cell.color.entityId,
			val
		}, "Changement de couleur")
	}
});

ContextMenu.addInSetup((x, y) => {
	if (!cell.color || !td.value)
		return false;
	
	const rect = td.value.getBoundingClientRect();
	if (rect.left < x && rect.right > x && rect.top < y && rect.bottom > y) {
		window.electronAPI.colorMenu(color.value, x, y).then((newColor) => newColor!==false && (color.value = newColor));
		return true;
	}
	return false;
})

</script>

<template>
	<td :rowspan="cell.rowSpan" ref="td" :class="color">
		<div v-if="cell.action && cell.val !== undefined" class="action-spacer">
			<button class="action" @click="cell.action">&#9998;</button>
		</div>
		<span v-if="!cell.edit">{{ cell.val }}</span>
		<TableInput2 v-else v-bind="cell.val"/>
	</td>
</template>

<style scoped>

</style>
