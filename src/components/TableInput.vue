<template>
	<div v-if="show">
		<input :value="value" @change="value = $event.target.value">
		<span v-if="changed" @click="value = original">X</span>
	</div>
	<span v-else>-</span>
</template>

<script>
import {computed} from "vue";

export default {
	name: "TableInput",
	props: ["modelValue", "original", "always"],
	setup(props, {emit}) {
		return {
			changed: computed(() => props.modelValue !== props.original),
			show: computed(() => (props.modelValue!==undefined && props.modelValue!==null) || !!props.always),
			value: computed({
				get() {
					return props.modelValue
				},
				set(val) {
					emit("update:modelValue", val);
				}
			})
		}
	}
}
</script>

<style scoped lang="scss">
input {
	width: 4rem;
	border: none;
	border-radius: 0;
	border-bottom: 1px solid #ccc;
	background-color: transparent;
	outline: none;
	font-size: 1rem;
	line-height: 1rem;
	padding: 0.1rem;
}

div {
	position: relative;

	> span {
		position: absolute;
		transform: translateX(-100%);
		color: #ccc;

		cursor: pointer;

		&:hover {
			text-shadow: 0px 0px 3px #aaa;
		}
	}
}
</style>
