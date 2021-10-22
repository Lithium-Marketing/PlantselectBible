<template>
	<div class="progress">
		<span :class="{inf: progress===-1}" :style="{width:(progress*100)+'%'}"></span>
		<strong v-if="progress===1">Complété</strong>
		<strong v-else-if="progress>=0">{{ (progress * 100).toFixed(0) }}%</strong>
		<strong v-else-if="progress===-2">En attente</strong>
	</div>
</template>

<script>
export default {
	name: "LoadingBar",
	props: ["progress"]
}
</script>

<style scoped lang="scss">
.progress {
	position: relative;
	z-index: 0;
	width: 100%;
	max-width: 500px;
	height: 1.5rem;
	margin: 2rem auto;
	border-radius: 5px;
	overflow: hidden;
	text-align: center;
	background-color: #f2f2f2;

	strong {
		position: relative;
		line-height: 1.5rem;
		z-index: 1;
		color: #000;
		text-shadow: 0 0 2px #fff;
	}

	span {
		position: absolute;
		height: 100%;
		display: block;
		background-color: #8daa26;
		top: 0;
		z-index: 0;

		&.inf {
			width: 100%;
			height: 50%;
			transform: translateY(50%);
			animation: borealisBar 2s linear infinite;
		}
	}
}

@keyframes borealisBar {
	0% {
		left: 0%;
		right: 100%;
		width: 0%;
	}
	10% {
		left: 0%;
		right: 75%;
		width: 25%;
	}
	90% {
		right: 0%;
		left: 75%;
		width: 25%;
	}
	100% {
		left: 100%;
		right: 0%;
		width: 0%;
	}
}
</style>
