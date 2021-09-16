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

export default defineComponent({
	name: "ExcelBuilder",
	setup() {
		const store = useStore<StoreState>();
		const router = useRouter();

		return {
			async btn_prix() {
				const pricesIndex = Object.values(store.state._.priceTitles).reduce((a, v, i) => {
					a[v.ID] = i;
					return a;
				}, {});
				const pricesTitle = Object.values(store.state._.priceTitles).reduce((a, v, i) => {
					a[i] = v.Titre;
					return a;
				}, []);

				const pricesByProduct = {};
				for (const price of Object.values(store.state._.prices)) {
					pricesByProduct[price.Produit_ID] = pricesByProduct[price.Produit_ID] || new Array(pricesTitle.length);
					pricesByProduct[price.Produit_ID][pricesIndex[price.Prix_ID]] = price.Prix;
				}

				const products = [];
				Object.values(store.state._.products).forEach((p: any, i) => {
					products[i] = [
						p.Code,
						p.Variete,
						p.Format
					];
					if (pricesByProduct[p.ID])
						products[i].push(...pricesByProduct[p.ID]);
				});

				const workbook = new ExcelJS.Workbook();
				const sheet = workbook.addWorksheet('My Sheet', {});

				sheet.addRow(["Code", "Variete", "Format", ...pricesTitle]);
				sheet.addRows(products);


				const buffer = await workbook.xlsx.writeBuffer();

				const form = new FormData();
				form.append('file', new Blob([buffer], {
					type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
				}), "test.xlsx");

				const response = await axios.post("http://plantselect.lithiumwebsolutions.com/php/temp_file_server.php", form, {
					headers: {
					},
				});
				console.log(response.data);

				await router.push({name: "ExcelViewer", params: {file: response.data}})

				/*//const buffer = await workbook.xlsx.writeBuffer();
				const a = document.createElement("a"),
					url = URL.createObjectURL(new Blob([buffer], {
						type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
					}));
				a.href = url;
				a.download = "test.xlsx";
				document.body.appendChild(a);
				a.click();
				setTimeout(function () {
					document.body.removeChild(a);
					window.URL.revokeObjectURL(url);
				}, 0);*/

			}
		};
	}
})
</script>

<style scoped>

</style>
