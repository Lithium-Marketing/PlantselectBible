<template>
	<div v-if="show">
		<input v-if="type==='date'" type="date" :value="toDate(value)" @change="value = fromDate($event.target.value)" :style="{width: width}">
		<input v-else :type="type" :value="value" @change="value = $event.target.value" :style="{width: width}">
		<span v-if="changed">X</span>
	</div>
	<span v-else>-</span>
</template>

<script>
import {computed} from "vue";
import {useMyServices} from "@/config/dataConfig";
import moment from "moment";

export default {
	name: "TableInput2",
	props: ["table", "entityId", "field", "createInfo", "type","len"],
	emits: ["change"],
	setup(props, {emit}) {
		const services = useMyServices();
		
		const value = computed({
			get() {
				return services.data.tables[props.table]?.value[props.entityId]?.[props.field]
			},
			set(val) {
				services.modification.mod("manual", {
					table: props.table,
					field: props.field,
					id: props.entityId,
					val,
					createInfo: props.createInfo
				}, "Modification manuel")
			}
		});
		
		return {
			changed: computed(() => value.value !== services.data.raw[props.table]?.value[props.entityId]?.[props.field]),
			show: computed(() => (value.value !== undefined && value.value !== null) || !!props.createInfo),
			value,
			
			width: computed(() => props.len !== undefined ? props.len+"rem" : "4rem"),
			
			toDate(val){
				console.log(val);
				return moment.unix(val).format('YYYY-MM-DD');
			},
			fromDate(val){
				return moment(val).unix()
			}
		}
	}
}
</script>

<style scoped lang="scss">
input {
	border: none;
	border-radius: 0;
	border-bottom: 1px solid #ccc;
	background-color: transparent;
	outline: none;
	font-size: 1rem;
	line-height: 1rem;
	padding: 0.1rem;
	
	&[type=date]{
		padding-right: 1rem;
	}
}

div {
	position: relative;
	
	> span {
		position: absolute;
		top: 0;
		transform: translateX(-100%);
		color: #ccc;
		
		cursor: pointer;
		
		&:hover {
			text-shadow: 0px 0px 3px #aaa;
		}
	}
}
</style>
