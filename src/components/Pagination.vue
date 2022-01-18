<template>
	<ul class="pagination">
		<li>
			<button @click="page = 0" :disabled="page===0">&lt;&lt;</button>
		</li>

		<li>
			<button @click="page = page-1" :disabled="page===0">&lt;</button>
		</li>

		<li>
			<button>
				{{ page + 1 }}/{{ len }}
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

<script>
import {computed, defineComponent, watchEffect} from "vue";

export default defineComponent({
	name: "Pagination",
	props: ["page", "len"],
	setup(props, {emit}) {

		watchEffect(() => {
			if (props.page > props.len)
				emit("update:page", 0);
		})

		return {
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
