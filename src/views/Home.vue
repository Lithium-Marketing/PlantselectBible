<template>
	<div class="home">

		<Tabs :activeIndex="1" style="width: 90vw">
			<Tab header="Stats">
				<table class="stat">
					<tr v-for="(changes,type) in types">
						<td>{{ type }}</td>
						<td>{{ changes }}</td>
					</tr>
				</table>
			</Tab>
			<Tab header="Modifications">
				<ModificationsPanel/>
			</Tab>
			<Tab header="Sauvegarde">
				<div class="saves">
					<table>
						<tr>
							<th colspan="3" style="background-color: red;color: white">!!Attention!! Charger une sauvegarde va effacer les modification en cours</th>
						</tr>
						<tr>
							<td>
								<button @click="refresh()" style="background-color: rgb(160 160 160)">Rafraichir</button>
							</td>
							<td></td>
							<td></td>
						</tr>
						<tr v-for="save of saves">
							<td>
								<ButtonConfirm @action="load(save)">load</ButtonConfirm>
								<ButtonConfirm @action="del(save)" style="background-color: rgb(165 0 0)">X</ButtonConfirm>
							</td>
							<td>{{ save.Name }}</td>
							<td>{{ save.Date }}</td>
						</tr>
					</table>
				</div>
			</Tab>
		</Tabs>
	</div>
</template>

<script lang="ts">
import {computed, defineComponent, onMounted, onUnmounted, ref, watch} from 'vue';
import {useStore} from "vuex";
import moment from "moment";
import ButtonConfirm from "@/components/ButtonConfirm.vue";
import {StoreState} from "@/store";
import LoadingBar from "@/components/LoadingBar.vue";
import Tabs from "@/components/Tabs.vue";
import Tab from "@/components/Tab.vue";
import ChangesPanel from "@/components/ChangesPanel.vue";
import {Modification} from "@/helper/Modifications";
import {toText} from "@/helper/Const";
import ModificationsPanel from "@/components/ModificationsPanel.vue";
import {useMyServices} from "@/dataConfig";
import { SaveService } from '@/services/saveService';

export default defineComponent({
	name: 'Home',
	components: {ModificationsPanel, ChangesPanel, Tab, Tabs, LoadingBar, ButtonConfirm},
	setup() {
		const store = useStore<StoreState>();
		const services = useMyServices();

		const saves = ref<any>([]);
		
		async function refresh(){
			saves.value = (await services.save.getSaves()).map(s=>{
				return {
					...s,
					Date: moment(s.Date).format('lll')
				};
			});
		}
		
		return {
			saves,
			refresh,
			load(save){
				services.modification.fromJSON(save.Data)
			},
			async del(save){
				await services.save.delSave(save.ID);
				await refresh();
			},
			types: computed(() => {
				return Object.values(store.state.modifications).reduce((a, v: Modification) => {
					const t = toText(v.type);
					if (!a[t])
						a[t] = 0;
					a[t]++;
					return a;
				}, {});
			}),
		};
	}
});

function setupScroll(loadMorePosts) {
	onMounted(() => {
		window.addEventListener("scroll", handleScroll)
	})

	onUnmounted(() => {
		window.removeEventListener("scroll", handleScroll)
	})

	let isCalled = false;
	const handleScroll = async () => {
		if (isCalled)
			return;
		isCalled = true;

		let element = scrollComponent.value;
		let limit = 20;
		while (element && element.getBoundingClientRect().bottom < window.innerHeight && limit-- > 0)
			await loadMorePosts()

		isCalled = false;
	}

	const scrollComponent = ref(null);
	watch(scrollComponent, () => {
		handleScroll();
	});
	return scrollComponent;
}

</script>

<style scoped lang="scss">

.home {
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;

	.saves {
		width: 100%;

		table {
			width: 100%;
		}

		td {
			width: 100%;
		}

		td:nth-child(1) {
			display: flex;
			width: unset;

			button:nth-child(1) {
				flex-grow: 1;
			}
		}

		tr:nth-child(1) {
			background-color: #ccc;
		}
	}

	.stat {
		border-collapse: collapse;
		border: 1px solid #f2f2f2;

		tr {
			border-bottom: 1px solid #f2f2f2;
		}

		td {
			padding: .5rem;
			border-left: 1px solid #f2f2f2;
		}
	}


}

</style>
