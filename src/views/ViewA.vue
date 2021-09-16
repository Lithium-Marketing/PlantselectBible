<template>
	<div class="home">
		<Pagination v-model:page="page" v-model:len="len"/>
		<table class="product" ref="tableRef">
			<thead>
			<tr>
				<th></th>
				<th></th>
				<th>Produit</th>
				<th>Format</th>
				<th>pw</th>
				<th>OA</th>
				<th>Coutant Futur</th>
				<th>Vendant Futur</th>
				<th>{{ $pastTitle.years_pastC0 }}</th>
				<th>{{ $pastTitle.years_pastT0 }}</th>
				<th>{{ $pastTitle.years_pastV0 }}</th>
				<th>{{ $pastTitle.years_pastC1 }}</th>
				<th>{{ $pastTitle.years_pastT1 }}</th>
				<th>{{ $pastTitle.years_pastV1 }}</th>
				<th>{{ $pastTitle.years_pastC2 }}</th>
				<th>{{ $pastTitle.years_pastT2 }}</th>
				<th>{{ $pastTitle.years_pastV2 }}</th>
				<th>Format</th>
				<th>Fourn.</th>
				<th>Inv.</th>
				<th>{{ $pastTitle.years_pastA0 }}</th>
				<th>{{ $pastTitle.years_pastA0 }} Confirmer</th>
				<th>{{ $pastTitle.years_pastA1 }}</th>
				<th>Reception</th>
				<th>Reception</th>
				<th>{{ $pastTitle.years_pastVe0 }}</th>
				<th>{{ $pastTitle.years_pastVe1 }}</th>
				<th>{{ $pastTitle.years_pastVe2 }}</th>
			</tr>
			<tr>
				<th></th>
				<th></th>
				<th><input v-model="search.variete"/></th>
				<th></th>
				<th></th>
				<th></th>
				<th></th>
				<th></th>
				<th></th>
				<th></th>
				<th></th>
				<th></th>
				<th></th>
				<th></th>
				<th></th>
				<th></th>
				<th></th>
				<th></th>
				<th></th>
				<th></th>
				<th></th>
				<th></th>
				<th></th>
				<th></th>
				<th></th>
				<th></th>
				<th></th>
				<th></th>
			</tr>
			</thead>
			<tbody>
			<template v-for="(oa,val) in oas" :key="val">
				<tr :class="[oa.product.Color]" :data-pid="oa.product.ID" :data-oaid="oa.ID">
					<td>
						<button @click="$load(oa.ID,oa.product.ID)">load</button>
					</td>
					<td>
						<button class="tooltip" :style="{'background-color':oa.Note ? '#8daa26':'#888'}" @click="$load(oa.ID,oa.product.ID,'note')">
							N
							<span class="tooltiptext" v-if="oa.Note"><pre>{{oa.Note}}</pre></span>
						</button>
					</td>
					<td :class="oa.c?.Variete">{{ oa.product.Variete }}</td>
					<td>{{ oa.product.Format }}</td>
					<td>{{ oa.pw }}</td>
					<td>{{ oa.ID }}</td>
					<td>
						<!--						<TableInput :modelValue="oa.years_pastC0" :original="oa.years_pastC0O" @update:modelValue="upCost($event,oa)"/>-->
					</td>
					<td>
						<TableInput :always="true" :modelValue="oa.product['bible.Vendant']" :original="oa.product['bible.VendantO']" @update:modelValue="upVendantF($event,oa.product)"/>
					</td>
					<td>
						<TableInput :modelValue="oa.years_pastC0" :original="oa.years_pastC0O" @update:modelValue="upCost($event,oa)"/>
					</td>
					<td>{{ $value(oa.years_pastT0) }}</td>
					<td :class="oa.c?.v0">
						<TableInput :modelValue="oa.product.years_pastV0" :original="oa.product.years_pastV0O" @update:modelValue="upPrice($event,oa.product)"/>
					</td>
					<td>{{ $value(oa.years_pastC1) }}</td>
					<td>{{ $value(oa.years_pastT1) }}</td>
					<td>{{ $value(oa.product.years_pastV1) }}</td>
					<td>{{ $value(oa.years_pastC2) }}</td>
					<td>{{ $value(oa.years_pastT2) }}</td>
					<td>{{ $value(oa.product.years_pastV2) }}</td>
					<td>{{ oa.Format }}</td>
					<td>{{ oa.Fournisseur }}</td>
					<td :class="oa.c?.Inventaire">{{ oa.product.Quantite }}</td>
					<td :class="oa.c?.qtyF">
						<TableInput :always="true" :modelValue="oa['bible.Quantite']" :original="oa['bible.QuantiteO']" @update:modelValue="upAchat($event,oa,oa.product)"/>
					</td>
					<td :class="oa.c?.a0">{{ $valueI(oa.product.years_pastA0) }}</td>
					<td>{{ $valueI(oa.product.years_pastA1) }}</td>
					<td :class="oa.c?.dateReception">{{ $date(oa.Date_reception) }}</td>
					<td>{{ $valueI(oa.Quantite_recu) }}/{{ $valueI(oa.Quantite_recevoir) }}</td>
					<td>{{ $valueI(oa.product.years_pastVe0) }}</td>
					<td>{{ $valueI(oa.product.years_pastVe1) }}</td>
					<td>{{ $valueI(oa.product.years_pastVe2) }}</td>
				</tr>
				<!--				<tr>-->
				<!--					<td colspan="25">{{ Object.keys(oa) }}</td>-->
				<!--				</tr>-->
				<!--								<tr>-->
				<!--									<td colspan="25">{{ Object.keys(oa.product) }}</td>-->
				<!--								</tr>-->
			</template>
			</tbody>
		</table>
		<Pagination v-model:page="page" v-model:len="len"/>
	</div>
</template>

<script lang="ts">
import {computed, defineComponent, reactive, ref} from 'vue';
import HelloWorld from '@/components/HelloWorld.vue';
import {useStore} from "vuex";
import Pagination from "@/components/Pagination.vue";
import TableInput from "@/components/TableInput.vue";
import {Modifications} from "@/Modifications";
import {ContextMenu} from "@/ContextMenu";
import {Menu} from "@electron/remote";
import {ColorMenu} from "@/Const";
import {StoreState} from "@/store";

export default defineComponent({
	name: 'ViewA',
	components: {
		TableInput,
		Pagination,
		HelloWorld,
	},
	setup() {
		const store = useStore<StoreState>();
		const modifications = new Modifications(store);
		const tableRef = ref<HTMLTableElement | undefined>();

		ContextMenu.addInSetup((x, y) => {

			const table = tableRef.value;
			if (!table)
				return false;

			for (const row of table.tBodies[0].rows) {

				const rect = row.getBoundingClientRect();
				if (rect.left < x && rect.right > x)
					if (rect.top < y && rect.bottom > y) {

						const menu = Menu.buildFromTemplate(ColorMenu(store, modifications, row))
						menu.popup({
							x, y
						});

						return true;
					}
			}

			return false;
		})

		const search = reactive({
			variete: ""
		});
		const allOAs = computed(() => {
			const oas = store.state._.oas;
			const products = store.state._.products;
			const productIds = store.state._.productsOrder;
			const oasByProd = {};

			for (const oasKey in oas) {
				const oa: any = oas[oasKey];
				oasByProd[oa.Produit] = oasByProd[oa.Produit] || [];
				oasByProd[oa.Produit].push(oasKey);
			}

			const result = [];

			for (const productsKey of productIds) {
				const prod = products[productsKey];
				if(prod.Variete && prod.Variete.toLowerCase().indexOf(search.variete.toLowerCase())===-1)
					continue;

				if (oasByProd[productsKey])
					for (const oaKey of oasByProd[productsKey]) {
						result.push({
							...oas[oaKey],
							product: {
								...prod,
								Variete: prod?.Variete || '-',
								Inv: prod?.Quantite ?? '-'
							}
						});
					}
				else {
					result.push({
						product: {
							...prod,
							Variete: prod?.Variete || '-',
							Inv: prod?.Quantite ?? '-'
						}
					});
				}
			}

			return result;
		});
		const page = ref(0);
		const len = computed(() => store.state.settings.ipp);

		//watch([variSearch], () => productPage.value = 0)

		const pricesByProduct = computed(() => {
			const result = {};
			for (const price of Object.values(store.state._.prices)) {
				result[price.Produit_ID] = result[price.Produit_ID] || [];
				result[price.Produit_ID].push(price);
			}
			return result;
		})

		return {
			search,
			oas: computed(() => allOAs.value.slice(len.value * page.value, len.value * (page.value + 1)).map(oa => {
				try {
					oa.c = JSON.parse(oa['bible.Color']);
				} catch (e) {
				}

				const price = modifications.getMainPrice(oa.product.ID, pricesByProduct.value);
				oa.product.years_pastV0 = price?.Prix || "0.00";
				oa.product.years_pastV0O = price?.Prix ? price?.PrixO : "0.00";

				//oa.product['bible.VendantO'] = oa.product['bible.Vendant'] ? oa.product['bible.VendantO'] : "0.00"
				//oa.product['bible.Vendant'] = oa.product['bible.Vendant'] || "0.00"

				return oa;
			})),
			//loading: computed(() => store.state.loading),

			page,
			len: computed(() => Math.ceil(allOAs.value.length / len.value)),

			tableRef,

			upCost(val, oa) {
				modifications.add({
					type: "setCost",
					OA_ID: oa.ID,
					val
				});
				modifications.commit();
			},
			upPrice(val, product) {
				modifications.add({
					type: "setPriceOne",
					val,
					Produit_ID: product.ID
				});
				modifications.commit();
			},
			upAchat(val, oa, product) {
				modifications.add({
					type: "setAchat",
					OA_ID: oa.ID,
					Produit_ID: product.ID,
					val: val
				});
				modifications.commit();
			},
			upVendantF(val, product) {
				modifications.add({
					type: "setVenteFutur",
					Produit_ID: product.ID,
					val: val
				});
				modifications.commit();
			},
			upNote(val, oa) {
				modifications.add({
					type: "setNote",
					OA_ID: oa.ID,
					val: val
				});
				modifications.commit();
			}
		};
	}
});
</script>

<style scoped lang="scss">

.product {
	table-layout: fixed;
}

.product td {
	white-space: nowrap;
}


table {
	tr {
		&:nth-child(odd) {
			background-color: #f8f8f8;
		}

		&:hover {
			background-color: #f0f0f0;
		}
	}

	td {
		button {
			padding: .3rem .5rem;
			font-size: .8rem;
		}
	}
}

.tooltip {
	position: relative;
	display: inline-block;

	.tooltiptext {
		visibility: hidden;
		background-color: black;
		color: #fff;
		text-align: center;
		padding: .2rem 1rem;
		border-radius: 6px;

		/* Position the tooltip text - see examples below! */
		position: absolute;
		z-index: 1;

		pre{
			font-size: 1rem;
		}
	}

	&:hover .tooltiptext {
		visibility: visible;
	}
}

</style>
