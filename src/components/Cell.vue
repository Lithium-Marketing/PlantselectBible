<script setup lang="ts">
import {computed, defineProps, ref} from 'vue';
import TableInput2 from "@/components/TableInput2.vue";
import {useMyServices} from "@/config/dataConfig";

const services = useMyServices();

const cell = defineProps(["rowSpan", "action", "val", "edit", "color"])

const td = ref<HTMLTableCellElement>(null);

</script>

<template>
	<td :rowspan="cell.rowSpan" ref="td">
		<div v-if="cell.action && cell.val !== undefined" class="action-spacer">
			<button class="action" @click="cell.action">&#9998;</button>
		</div>
		<span v-if="!cell.edit">{{ cell.val }}</span>
		<TableInput2 v-else v-bind="cell.val"/>
	</td>
</template>

<style scoped>

</style>
