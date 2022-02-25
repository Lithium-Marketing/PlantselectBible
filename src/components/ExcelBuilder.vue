<template>
	<div>
		<button @click="btn_prix">Prix</button>
	</div>
</template>

<script lang="ts">
import * as ExcelJS from "exceljs";
import {useStore} from "vuex";
import {StoreState} from "@/store";
import {defineComponent} from "vue";
import axios from "axios";
import {useRouter} from "vue-router";
import {MyTablesDef, useMyServices} from "@/config/dataConfig";

export default defineComponent({
	name: "ExcelBuilder",
	setup() {
		const store = useStore<StoreState>();
		const router = useRouter();
		const services = useMyServices();
		
		return {
			async btn_prix() {
				const pricesByID = services.data.tables.prix.value;
				const pricesOrdered = Object.values(pricesByID).sort((a, b) => b.Position - a.Position);
				
				const pricesByProduct: Record<number, Record<number, MyTablesDef["produits_prix"]>> = {};
				for (const price of Object.values(services.data.tables.produits_prix.value)) {
					pricesByProduct[price.Produit_ID] = pricesByProduct[price.Produit_ID] || new Array(Object.keys(pricesByID).length);
					pricesByProduct[price.Produit_ID][price.Prix_ID] = price;
				}
				
				const products = [];
				Object.values(services.data.tables.produits.value).forEach((p) => {
					products.push([
						p.Code,
						p.Variete,
						p.Format,
						...pricesOrdered.map(v => pricesByProduct[p.ID]?.[v.ID]?.Prix)
					]);
				});
				
				const workbook = new ExcelJS.Workbook();
				const sheet = workbook.addWorksheet('My Sheet', {});
				
				sheet.addRow(["Code", "Variete", "Format", ...pricesOrdered.map(v => v.Titre)]);
				sheet.addRows(products);
				
				const buffer = await workbook.xlsx.writeBuffer();
				
				const form = new FormData();
				form.append('file', new Blob([buffer], {
					type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
				}), "test.xlsx");
				
				const response = await axios.post("http://plantselect.lithiumwebsolutions.com/php/temp_file_server.php", form, {
					headers: {},
				});
				
				await router.push({name: "ExcelViewer", params: {file: response.data}})
			}
		};
	}
})
</script>

<style scoped>

</style>
