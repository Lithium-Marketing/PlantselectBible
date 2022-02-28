<template>
	<ul class="pagination">
		<li>
			<button @click="page = 0" :disabled="page===0">&lt;&lt;</button>
		</li>
		
		<li>
			<button @click="page = page-1" :disabled="page===0">&lt;</button>
		</li>
		
		<li>
			<button @click="edit=true">
				<span v-if="!edit">{{ page + 1 }}/{{ len }}</span>
				<input v-else :value="pageO" @change="pageO=$event.target.value" type="number" min="1" max="len" ref="input" @focusout="edit=false" style="width: 5rem">
			</button>
		</li>
		
		<li>
			<button @click="page = page+1" :disabled="page>=len-1">&gt;</button>
		</li>
		
		<li>
			<button @click="page = len-1" :disabled="page>=len-1">&gt;&gt;</button>
		</li>
	</ul>
</template>

<script lang="ts">
import {computed, defineComponent, nextTick, ref, watch, watchEffect} from "vue";

export default defineComponent({
	name: "Pagination",
	props: ["page", "len"],
	setup(props, {emit}) {
		
		watchEffect(() => {
			if (props.page > props.len)
				emit("update:page", 0);
		});
		
		const edit = ref(false);
		const input = ref<HTMLInputElement>(null);
		watch(edit, () => {
			if (edit.value)
				nextTick(() => {
					input.value.focus()
					input.value.select()
				})
		})
		
		return {
			edit,
			input,
			pageO: computed({
				get() {
					return props.page + 1
				},
				set(val: number) {
					emit("update:page", val - 1);
				}
			}),
			
			page: computed({
				get() {
					return props.page
				},
				set(val) {
					emit("update:page", val);
				}
			}),
			len: computed({
				get() {
					return props.len
				},
				set(val) {
					emit("update:len", val);
				}
			}),
		};
	}
});
</script>

<style scoped lang="scss">

.pagination {
	list-style: none;
	display: flex;
	justify-content: center;
	
	button {
		font-size: 1.2rem;
	}
}

</style>
