<script setup lang="ts">
import {defineProps, ref} from 'vue';
import TableInput2 from "@/components/TableInput2.vue";
import {useMyServices} from "@/config/dataConfig";
import {colorMenu} from "@/helper/Color";

const services = useMyServices();

const cell = defineProps(["rowSpan", "action", "val", "edit", "color"])

const td = ref<HTMLTableCellElement>(null);
const color = colorMenu(services, td, cell.color);

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

<style scoped lang="scss">
.action-spacer {
	display: inline-block;
	width: 2rem;
	height: 1rem;
	margin-top: .5rem;
	
	.action {
		position: absolute;
		
		left: 2px;
		top: 50%;
		transform: translateY(-50%);
		
		border-radius: 1rem;
		padding: .3rem .4rem;
		font-size: .8rem;
		
		margin: 0;
	}
}

td {
	position: relative;
	
	> span {
		line-height: 2rem
	}
}
</style>
