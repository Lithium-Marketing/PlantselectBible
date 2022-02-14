<template>
	<div class="home">
		<Pagination v-model:page="page" v-model:len="len"/>
		<table class="product" ref="tableRef">
			<thead>
			<tr>
				<th v-for="col in table">{{ col.name }}</th>
			</tr>
			<tr>
				<th v-for="col in table">
					<input v-if="col.filter" v-model="search[col.name]">
				</th>
			</tr>
			</thead>
			<tbody>
			<template v-for="line in lines">
				<tr :class="line.classes">
					<template v-for="row in line.rows">
						<td :rowspan="row.rowSpan">
							<span v-if="!row.edit">{{ row.val }}</span>
							<TableInput2 v-else v-bind="row.val"/>
						</td>
					</template>
				</tr>
			</template>
			</tbody>
		</table>
		<Pagination v-model:page="page" v-model:len="len"/>
	</div>
</template>

<script lang="ts">
import {computed, ComputedRef, defineComponent, reactive, ref, watch, watchEffect} from 'vue';
import Pagination from "@/components/Pagination.vue";
import TableInput from "@/components/TableInput.vue";
import {ContextMenu} from "@/helper/ContextMenu";
import {MyCacheDef, MyTablesDef, useMyServices} from "@/config/dataConfig";
import moment from "moment";
import {LogService} from "@/services/logService";
import {$date, $pastTitle, $value, $valueI, currentYear, PricesId} from "@/helper/Const";
import TableInput2 from "@/components/TableInput2.vue";

const logger = LogService.logger({name: "ViewA2"})

interface Line {
	archives: ComputedRef<ReturnType<MyCacheDef["archives"]>>
	prodCache: ReturnType<MyCacheDef["byProd"]>[number]["value"],
	product: MyTablesDef["produits"],
	achat: {
		years_pastA0: number,
		years_pastA1: number,
	}
}

interface SubLine extends Line {
	oa: MyTablesDef["ordres_assemblages"]
	mp?: MyTablesDef["matieres_premieres"]
	fournisseur?: MyTablesDef["fournisseurs"]
}

type TableF2 = {
	sub: 0,
	val(line: Line): any
} | {
	sub: 1,
	val(line: SubLine): any
};

type TableF3 = { filter?(val: string, prodId: number, oaId?: number): boolean }

type TableF = {
	name: string,
	sub: number,
	edit?: boolean
} & TableF2 & TableF3;

type Table = TableF[];

export default defineComponent({
	name: 'ViewA2',
	components: {
		TableInput2,
		TableInput,
		Pagination
	},
	setup() {
		const services = useMyServices();
		const tableRef = ref<HTMLTableElement | undefined>();
		
		ContextMenu.addInSetup((x, y) => {
			
			const table = tableRef.value;
			if (!table)
				return false;
			
			for (const row of table.tBodies[0].rows) {
				
				const rect = row.getBoundingClientRect();
				if (rect.left < x && rect.right > x)
					if (rect.top < y && rect.bottom > y) {
						
						//const menu = Menu.buildFromTemplate(ColorMenu(store, modifications, row))
						// menu.popup({
						// 	x, y
						// });
						
						return true;
					}
			}
			
			return false;
		})
		
		const search = reactive({});
		
		const table: Table = [
			{
				name: "Produit",
				sub: 0,
				val: (line) => line.product.Variete,
				filter(val: string, prodId: number, oaId?: number): boolean {
					return oaId !== undefined || services.data.tables.produits.value[prodId]?.Variete?.toLowerCase().startsWith(val.toLowerCase())
				}
			},
			{
				name: "Format",
				sub: 0,
				val: (line) => line.product.Format
			},
			{
				name: "pw",
				sub: 1,
				val: (line) => line.mp?.pw
			},
			{
				name: "OA",
				sub: 1,
				val: (line) => line.oa.ID
			},
			{
				name: "Coutant Futur",
				sub: 1,
				edit: true,
				val: (line) => ({
					table: "bible",
					field: "PrixC",
					'entity-id': services.data.indexesByTable.bible.OA.value[line.oa.ID]?.[0],
					'create-info': {
						OA: line.oa.ID
					}
				})
			},
			{
				name: "Vendant Futur",
				sub: 0,
				edit: true,
				val: (line) => ({
					table: "bible",
					field: "Vendant",
					'entity-id': services.data.indexesByTable.bible.Produit.value[line.product.ID]?.[0],
					'create-info': {
						Produit: line.product.ID
					}
				})
			},
			{
				name: $pastTitle.years_pastC0,
				sub: 1,
				edit: true,
				val: (line) => ({
					table: "matieres_premieres",
					field: "Prix",
					'entity-id': line.mp?.ID
				})
			},
			{
				name: $pastTitle.years_pastT0,
				sub: 1,
				val: (line) => line.fournisseur?.Transport
			},
			{
				name: $pastTitle.years_pastV0,
				sub: 0,
				val: (line) => line.prodCache.prices?.[PricesId.Main]?.Prix
			},
			{
				name: $pastTitle.years_pastC1,
				sub: 1,
				val: (line) => $value(line.archives.value[1]?.[currentYear - 1]?.[line.oa.Matiere_premiere]?.value / 100)
			},
			{
				name: $pastTitle.years_pastT1,
				sub: 1,
				val: (line) => $value(line.archives.value[2]?.[currentYear - 1]?.[line.fournisseur?.ID]?.value / 100)
			},
			{
				name: $pastTitle.years_pastV1,
				sub: 0,
				val: (line) => $value(line.archives.value[0]?.[currentYear - 1]?.[line.product.ID]?.value / 100)
			},
			{
				name: $pastTitle.years_pastC2,
				sub: 1,
				val: (line) => $value(line.archives.value[1]?.[currentYear - 2]?.[line.oa.Matiere_premiere]?.value / 100)
			},
			{
				name: $pastTitle.years_pastT2,
				sub: 1,
				val: (line) => $value(line.archives.value[2]?.[currentYear - 2]?.[line.fournisseur?.ID]?.value / 100)
			},
			{
				name: $pastTitle.years_pastV2,
				sub: 0,
				val: (line) => $value(line.archives.value[0]?.[currentYear - 2]?.[line.product.ID]?.value / 100)
			},
			{
				name: "Format",
				sub: 1,
				val: (line) => line.mp?.Format
			},
			{
				name: "Fourn.",
				sub: 1,
				val: (line) => line.fournisseur?.Abbreviation,
			},
			{
				name: "Inv.",
				sub: 0,
				val: (line) => services.data.raw.vue_inventaire.value[line.product.ID]?.Quantite
			},
			{
				name: "Prevision",
				sub: 0,
				val: (line) => $valueI(services.data.indexesByTable.clients_previsions.Produit.value[line.product.ID]?.reduce((a, id) => a + services.data.tables.clients_previsions.value[id].Quantite, 0))
			},
			{
				name: $pastTitle.years_pastA0,
				sub: 1,
				val: (line) => line.achat.years_pastA0
			},
			{
				name: $pastTitle.years_pastA1,
				sub: 1,
				val: (line) => line.achat.years_pastA1
			},
			{
				name: "Recetion",
				sub: 1,
				val: (line) => $date(line.oa.Date_reception)
			},
			{
				name: "Recetion",
				sub: 1,
				val: (line) => $valueI(line.oa.Quantite_recu) + "/" + $valueI(line.oa.Quantite_recevoir)
			},
			{
				name: $pastTitle.years_pastVe0,
				sub: 0,
				val: (line) => $valueI(line.prodCache.vente(currentYear))
			},
			{
				name: $pastTitle.years_pastVe1,
				sub: 0,
				val: (line) => $valueI(line.prodCache.vente(currentYear - 1))
			},
			{
				name: $pastTitle.years_pastVe2,
				sub: 0,
				val: (line) => $valueI(line.prodCache.vente(currentYear - 2))
			}
		];
		
		const productsGroups = computed(() => {
			return Object.values(
				Object.values(services.data.tables.produits.value).filter(p => {
					for (const f of table) {
						if (f.filter && !f.filter(search[f.name] || "", p.ID))
							return false
					}
					return true;
				}).sort((a, b) => {
					return a.Type - b.Type || a.Variete?.localeCompare?.call(b.Variete) || a.Format - b.Format;
				}).reduce((a, v) => {
					const code = v.Code?.slice(0, 4) as string | undefined;
					a[code] = a[code] || [];
					a[code].push(v);
					return a;
				}, {} as Record<any, MyTablesDef["produits"][]>)
			);
		});
		
		const len = computed(() => {
			return productsGroups.value.length;
		});
		const page = ref(0);
		watch(productsGroups, () => {
			page.value = 0;
		})
		
		const products = computed<MyTablesDef["produits"][]>(() => {
			return productsGroups.value[page.value];
		});
		
		const lines = ref([]);
		
		watchEffect(() => {
			logger.time("page");
			
			lines.value.length = 0;
			
			products.value.forEach(function oneProduct(product) {
				const archives = services.cache.caches.archives;
				const prodCache = services.cache.caches.byProd.value[product.ID].value;
				
				const oasByProd = services.data.indexesByTable.ordres_assemblages.Produit.value[product.ID]
				const oas = (oasByProd && oasByProd.length ? oasByProd : []).map(oaId => {
					return services.data.tables.ordres_assemblages.value[oaId];
				});
				
				const achat = {
					years_pastA0: 0,
					years_pastA1: 0,
				};
				oas.forEach((oa) => {
					const year = moment.unix(oa.Date_reception).year();
					if (currentYear == year)
						achat.years_pastA0 += oa.Quantite_recevoir;
					if (currentYear - 1 == year)
						achat.years_pastA1 += oa.Quantite_recevoir;
				});
				
				const line: Line = {
					archives,
					prodCache,
					product,
					achat
				};
				const cols = table.map(c => []);
				
				oas.map(function oasByProdMap(oa) {
					const mp = services.data.get("matieres_premieres", oa.Matiere_premiere ?? false).value;
					const four = services.data.get("fournisseurs", mp?.Fournisseur ?? false).value;
					
					const subLine: SubLine = {
						...line,
						oa: oa,
						mp: mp,
						fournisseur: four
					};
					
					cols.forEach((v, i) => {
						const f = table[i];
						if (f.sub)
							v.push(f.val(subLine))
						else
							v.push(undefined);
					});
				});
				
				table.forEach((v, i) => {
					const f = table[i];
					if (!f.sub)
						//@ts-ignore
						cols[i][0] = f.val(line);
				});
				
				const h = cols[0].length;
				for (let y = 0; y < h; y++) {
					lines.value.push({
						classes: y === 0 ? "top" : "",
						
						rows: cols.map((c, i) => {
							if (!table[i].sub && y !== 0)
								return false;
							return {
								edit: table[i].edit,
								val: c[y],
								rowSpan: (!table[i].sub && y === 0) ? h : 1,
							}
						}).filter(r => !!r)
					});
				}
			})
			
			logger.timeEnd("page")
			logger.log(lines.value.length)
		})
		
		return {
			tableRef,
			search,
			table,
			lines, len, page,
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
		&:nth-child(odd):not(.top) {
			background-color: #f8f8f8;
		}
		
		&:hover {
			background-color: #f0f0f0;
		}
	}
	
	.top td {
		border-top: solid 1px black;
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
		
		pre {
			font-size: 1rem;
		}
	}
	
	&:hover .tooltiptext {
		visibility: visible;
	}
}

</style>
