<template>
	<button :class="btnClasses" @click="clicked">
		<slot v-if="!confirm"></slot>
		<span v-else>
			Cliquer pour confirmer
		</span>
	</button>
</template>

<script>
import {computed, ref} from 'vue';

export default {
	name: "ButtonConfirm",
	events: ["action"],
	setup(props, {emit}) {
		const btnClasses = computed(() => {
			if (confirm.value)
				return "btnConfirm";
			return "";
		});
		const confirm = ref(false);
		
		const tick = delay(() => {
			confirm.value = true;
		}, () => {
			confirm.value = false;
		}, () => {
			confirm.value = false;
		})
		
		return {
			btnClasses,
			confirm,
			clicked() {
				if (confirm.value) {
					confirm.value = false;
					emit("action");
					return;
				}
				tick();
			}
		};
	}
}

let _reset = false;

function delay(start, done, reset) {
	let timer = false;
	return function () {
		if (timer)
			clearTimeout(timer);
		
		if (_reset)
			_reset();
		_reset = reset;
		
		start();
		
		timer = setTimeout(() => {
			_reset = false;
			timer = false;
			done();
		}, 5000);
	}
}


</script>

<style scoped>

</style>
