<template>
	<slot></slot>
</template>

<script>
import {defineComponent} from "vue";

export default defineComponent({
	name: "Tab",
	props: ["header"]
})
</script>

<style scoped>

</style>
