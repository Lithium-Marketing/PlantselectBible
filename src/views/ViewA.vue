<template>
	<div class="home">
		<Pagination v-model:page="page" v-model:len="len"/>
		<div>
			<h2>{{ family }}</h2>
		</div>
		<table class="product" ref="tableRef">
			<thead>
			<tr>
				<th v-for="col in table">{{ col.name }}</th>
			</tr>
			<tr>
				<th v-for="col in table">
					<div style="display: flex">
						<input v-if="col.filter" v-model="search[col.name]" style="width: 150%;">
					</div>
				</th>
			</tr>
			</thead>
			<tbody>
			<template v-for="line in lines">
				<tr :class="line.classes">
					<Cell v-for="cell in line.cells" v-bind="cell">
					</Cell>
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
import {$date, $load, $pastTitle, $value, $valueI, currentYear, PricesId} from "@/helper/Const";
import TableInput2 from "@/components/TableInput2.vue";
import Cell from "@/components/Cell.vue";

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

type Color<T extends keyof MyTablesDef, F extends keyof MyTablesDef[T]> = {
	table: T,
	field: keyof MyTablesDef[T],
	id(ctx?: Line | SubLine): any
}

function color<T extends keyof MyTablesDef, F extends keyof MyTablesDef[T]>(table: T, field: F, id: (ctx?: Line | SubLine) => number) {
	return {
		table, field,
		id(ctx?: Line | SubLine) {
			return id(ctx);
		}
	};
}

type TableF2 = {
	sub: 0,
	val(line: Line): any
} | {
	sub: 1,
	val(line: SubLine): any
};

type TableF3 = { filter?(val: string, prodId: number, oaId?: number): boolean, filterProductOnly?: boolean }

type TableF = {
	name: string,
	sub: number,
	edit?: boolean,
	action?: (ctx?: Line | SubLine) => void,
	color?: Color<any, any>
} & TableF2 & TableF3;

type Table = TableF[];

export default defineComponent({
	name: 'ViewA2',
	components: {
		Cell,
		TableInput2,
		TableInput,
		Pagination
	},
	setup() {
		const services = useMyServices();
		const tableRef = ref<HTMLTableElement | undefined>();
		
		const search = reactive({});
		
		const table: Table = [
			{
				name: "Code",
				sub: 0,
				val: (line) => line.product.Code,
				filterProductOnly: true,
				filter(val: string, prodId: number): boolean {
					return services.data.tables.produits.value[prodId]?.Code?.toLowerCase().indexOf(val.toLowerCase()) !== -1
				},
				action(ctx) {
					$load(undefined, ctx.product.ID)
				}
			},
			{
				name: "Produit",
				sub: 0,
				val: (line) => line.product.Variete,
				filterProductOnly: true,
				filter(val: string, prodId: number): boolean {
					return services.data.tables.produits.value[prodId]?.Variete?.toLowerCase().indexOf(val.toLowerCase()) !== -1
				},
				color: color("produits", "Color", (ctx) => ctx.product.ID)
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
				val: (line) => line.oa.ID,
				filter(val: string, prodId: number, oaId?: number): boolean {
					return String(oaId).startsWith(val)
				},
				action(ctx) {
					if ('oa' in ctx)
						$load(ctx.oa.ID, ctx.product.ID)
				},
				color: color("ordres_assemblages", "Color", (ctx) => ctx && 'oa' in ctx && ctx.oa.ID)
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
				}),
				color: color("produits", "Color_V0", (ctx) => ctx.product.ID)
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
				val: (line) => services.data.raw.vue_inventaire.value[line.product.ID]?.Quantite,
				color: color("produits", "Color_Inv", (ctx) => ctx.product.ID)
			},
			{
				name: "Prevision",
				sub: 0,
				val: (line) => $valueI(services.data.indexesByTable.clients_previsions.Produit.value[line.product.ID]?.reduce((a, id) => a + services.data.tables.clients_previsions.value[id].Quantite, 0))
			},
			{
				name: $pastTitle.years_pastA0,
				sub: 0,
				val: (line) => line.achat.years_pastA0,
				color: color("produits", "Color_A0", (ctx) => ctx.product.ID)
			},
			{
				name: $pastTitle.years_pastA1,
				sub: 0,
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
		
		const productsGroups = computed(timed("products", () => {
			return Object.values(services.data.tables.produits.value).filter(p => {
				const oasByProd = services.data.indexesByTable.ordres_assemblages.Produit.value[p.ID];
				fields:
					for (const f of table) {
						if (!search[f.name] || !search[f.name].length)
							continue;
						
						if (f.filter && f.filterProductOnly && !f.filter(search[f.name], p.ID))
							return false;
						
						if (!f.filterProductOnly)
							if (oasByProd && oasByProd.length) {
								for (const oa of oasByProd)
									if (f.filter && f.filter(search[f.name], p.ID, oa))
										continue fields;
								return false;
							} else if (f.filter && !f.filter(search[f.name], p.ID))
								return false;
					}
				return true;
			}).sort((a, b) => {
				return a.Type - b.Type || String(a.Variete).localeCompare(b.Variete) || a.Format - b.Format;
			}).reduce((a, v) => {
				const code = v.Code?.slice(0, 4) as string | undefined;
				a[code] = a[code] || [];
				a[code].push(v);
				return a;
			}, {} as Record<any, MyTablesDef["produits"][]>);
		}));
		
		const len = computed(() => {
			return Object.values(productsGroups.value).length;
		});
		const page = ref(0);
		watch(search, () => {
			page.value = 0;
		})
		
		const products = computed<MyTablesDef["produits"][]>(() => {
			return Object.values(productsGroups.value)[page.value];
		});
		
		const lines = ref([]);
		
		watchEffect(() => {
			logger.time("page");
			
			lines.value.length = 0;
			
			products.value?.forEach(function oneProduct(product) {
				const archives = services.cache.caches.archives;
				const prodCache = services.cache.caches.byProd.value[product.ID].value;
				
				const oasByProd = services.data.indexesByTable.ordres_assemblages.Produit.value[product.ID]
				const oas = (oasByProd && oasByProd.length ? oasByProd : []).filter(oa => {
					for (const f of table) {
						if (!search[f.name] || !search[f.name].length || f.filterProductOnly)
							continue;
						
						if (f.filter && !f.filter(search[f.name], product.ID, oa))
							return false;
					}
					return true;
				}).map(oaId => {
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
				const cols: { val: any, ctx: SubLine | Line }[][] = table.map(c => []);
				
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
							v.push({
								val: f.val(subLine),
								ctx: subLine
							})
						else
							v.push(undefined);
					});
				});
				
				table.forEach((v, i) => {
					const f = table[i];
					if (f.sub === 0)
						cols[i][0] = {
							val: f.val(line),
							ctx: line
						};
				});
				
				const h = cols[0].length;
				for (let y = 0; y < h; y++) {
					lines.value.push({
						classes: y === 0 ? "top" : "",
						
						cells: cols.map((c, i) => {
							if (!table[i].sub && y !== 0)
								return false;
							return {
								edit: table[i].edit,
								val: c[y]?.val,
								rowSpan: (!table[i].sub && y === 0) ? h : 1,
								action: table[i].action && (() => table[i].action?.(c[y]?.ctx)),
								color: table[i].color && {
									table: table[i].color.table,
									field: table[i].color.field,
									entityId: table[i].color.id(c[y]?.ctx)
								},
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
			
			family: computed(() => Object.keys(productsGroups.value)[page.value])
		};
	}
});

function timed<T>(name: string, fn: () => T): () => T {
	return () => {
		logger.time(name);
		const result = fn();
		logger.timeEnd(name);
		return result;
	}
}
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
