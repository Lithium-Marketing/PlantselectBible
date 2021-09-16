<template>
	<div class="tabview">
		<ul class="nav" role="tablist">
			<li role="presentation" v-for="(tab, i) of tabs" :key="getKey(tab,i)" :class="[{'active': (d_activeIndex === i)}]">
				<a role="tab" class="link" @click="onTabClick($event, i)" :tabindex="'0'" :aria-selected="d_activeIndex === i">
					<span class="title" v-if="tab.props && tab.props.header">{{ tab.props.header }}</span>
					<component :is="tab.children.header" v-if="tab.children && tab.children.header"></component>
				</a>
			</li>
		</ul>
		<div class="panels">
			<template v-for="(tab, i) of tabs" :key="getKey(tab,i)">
				<div class="p-tabview-panel" role="tabpanel" v-if="lazy ? (d_activeIndex === i) : true" v-show="lazy ? true: (d_activeIndex === i)">
					<component :is="tab"></component>
				</div>
			</template>
		</div>
	</div>
</template>

<script lang="ts">

import {ref, SetupContext, VNode, watchEffect} from "vue";

export default {
	name: 'Tabs',
	emits: ['update:activeIndex', 'tab-change', 'tab-click'],
	props: {
		activeIndex: {
			type: Number,
			default: 0
		},
		lazy: {
			type: Boolean,
			default: false
		}
	},
	setup(props, {emit, slots}: SetupContext) {
		function isTabPanel(child: any): child is VNode {
			return child?.type?.name === 'Tab'
		}

		const tabs = ref<VNode[]>([]);
		const def = slots.default();
		def.forEach(child => {
				if (isTabPanel(child)) {
					tabs.value.push(child);
				}
			}
		);

		const d_activeIndex = ref(0);
		watchEffect(() => {
			d_activeIndex.value = props.activeIndex;
		})

		return {
			tabs,

			d_activeIndex,
			onTabClick(event, i) {
				if (i !== this.d_activeIndex) {
					d_activeIndex.value = i;
					emit('update:activeIndex', i)

					emit('tab-change', {
						originalEvent: event,
						index: i
					});
				}

				emit('tab-click', {
					originalEvent: event,
					index: i
				});
			},
			getKey(tab, i) {
				return (tab.props && tab.props.header) ? tab.props.header : i;
			}
		};
	}
}
</script>

<style lang="scss" scoped>

.tabview {
	ul.nav {
		display: flex;
		list-style: none;
		margin-bottom: 0;
		padding-left: 0;
		align-content: start;

		li {
			border: 1px solid black;
			padding: .3rem;
			border-top-right-radius: 1rem;
			border-top-left-radius: 5px;

			&.active {
				background-color: #cccccc;
			}
		}

	}

	.panels {
		border: 1px solid black;
	}
}

</style>
