<template>
	<div class="home">
		<Pagination v-model:page="page" v-model:len="len"/>
		<table class="product" ref="tableRef">
			<thead>
			<tr>
        <template v-for="(column, key) of columns">
          <th :class="column.class">
            <span v-html="column.name"></span>
          </th>
        </template>
			</tr>
			</thead>
			<tbody>
			<template v-for="line of lines" :key="line.oa?.ID">
				<tr>
          <template v-for="(column, key) of columns">
          <td :class="column.class">
						  <template v-if="column.input">
                <TableInput2 :table="column.input.table" :field="column.input.field" :entity-id="getColumnValue(column.input.id, line)"/>
              </template>
              <template v-else-if="column.key">
                {{ getColumnValue(column.key, line, column) }}
              </template>
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
import {computed, ComputedRef, defineComponent, reactive, ref} from "vue";
import {Store, useStore} from "vuex";
import {StoreState} from "@/store";
import Pagination from "@/components/Pagination.vue";
import TableInput from "@/components/TableInput.vue";
import {$pastTitle, currentYear, PricesId} from "@/helper/Const";
import moment from "moment";
import {LogService} from "@/services/logService";
import {MyTablesDef, useMyServices} from "@/config/dataConfig";
import TableInput2 from "@/components/TableInput2.vue";

const logger = LogService.logger({name: "ViewD"});

export default defineComponent({
	name: "ViewD",
	components: {TableInput2, TableInput, Pagination},
	setup() {
		const store = useStore<StoreState>();
		const services = useMyServices();
    const currentYear = moment().year();

    let columns = [
        {name:"Code", key:'product.Code'},
        {name:"Cultivars", key:'product.Variete'},
        {name:"Format", key:"product.Format"},
        {name:"pw", key:"oa.PW"},
        {name:"OA", key:"oa.ID"},
        {name:"Vendant "+(currentYear-2), key:"oa.Vendant_2"},
        {name:"$ "+(currentYear-2), key:"oa.Coutant_2"},
        {name:"Transport "+(currentYear-2), key:"oa.Transport_2"},
        {name:"Vendant "+(currentYear-1), key:"oa.Vendant_1"},
        {name:"$ "+(currentYear-1), key:"oa.Coutant_1"},
        {name:"Transport "+(currentYear-1), key:"oa.Transport_1"},
        {name:"$ "+(currentYear), key:"oa.Coutant_0", input:{table:'produits_prix',field:'Prix',id:'mainPrice.ID'}},
        {name:"Botanix "+(currentYear-1), key:"oa.Botanix_1", class:"botanix"},
        {name:"Botanix "+(currentYear-1), key:"oa.Botanix_0", class:"botanix"},
        {name:"Prix Botanix<br>"+(currentYear-1), key:"oa.Botanix_prix_0", class:"botanix"},
        {name:"Groupex "+(currentYear-1), key:"oa.Groupex_1", class:"groupex"},
        {name:"Prix Groupex<br>"+(currentYear-1), key:"oa.Groupex_prix_0", class:"groupex"},
        {name:"Réservation", key:"oa.Reservation"},
        {name:"Total inventaire<br>"+(currentYear-1), key:"oa.Inventaire"},
        {name:"Format", key:"oa.MP_Format"},
        {name:"Fournisseur", key:"oa.Fournisseur"},
        {name:"Date prévue<br>reception", key:"oa.Reception"},
        {name:"Achat "+(currentYear), key:"oa.Achat_0"},
        {name:"Achat "+(currentYear)+"<br>Confirmer", key:"oa.Achat_confirm_0"},
        {name:"Reception "+(currentYear), key:"oa.Reception"},
        {name:"Vente "+currentYear, key:"oas.Vente_0"},
        {name:"Vente "+(currentYear-1), key:"oas.Vente_1"},
        {name:"Vente "+(currentYear-2), key:"oas.Vente_2"},
        {name:"Localisation A", key:"oa.Localisations", index:"0"},
        {name:"Quantité A", key:"oa.Localisations_Quantite", index:"0"},
        {name:"Localisation B", key:"oa.Localisations", index:"1"},
        {name:"Quantité B", key:"oa.Localisations_Quantite", index:"1"},
        {name:"Localisation C", key:"oa.Localisations", index:"2"},
        {name:"Quantité C", key:"oa.Localisations_Quantite", index:"2"},
        {name:"Localisation D", key:"oa.Localisations", index:"3"},
        {name:"Quantité D", key:"oa.Localisations_Quantite", index:"3"},
        {name:"Quantité A+B+C+D", key:"oa.Quantite"},
        {name:"Mort", key:"oa.Mort"},
        {name:"Nbr. Sem.", key:"oa.Semaines"},
        {name:"Ventes 16-17", key:"ventes.Semaine_16_17"},
        {name:"Ventes 18-19", key:"ventes.Semaine_18_19"},
        {name:"Ventes 20-21", key:"ventes.Semaine_20_21"},
        {name:"Ventes 22-23", key:"ventes.Semaine_22_23"},
        {name:"Ventes 24-25", key:"ventes.Semaine_24_25"},
        {name:"Ventes 26-27", key:"ventes.Semaine_26_27"},
        {name:"Ventes 28-30", key:"ventes.Semaine_28_30"},
        {name:"Ventes 31-34", key:"ventes.Semaine_31_34"},
        {name:"Ventes 35-38", key:"ventes.Semaine_35_38"},
    ];
    //ajout des vente semaine
    /*const coli = 16;
    for (let i = 16; i < 27; i++) {
        columns.push({
          name:"Ventes "+(i)+(i+1)+"<br>"+(currentYear-1)
        });
        columns.push({
          name:"Ventes"
        });
        i++;
    }*/
		
		const search = reactive({
			variete: ""
		});

    //console.log(Object.values(services.data.get("vue_bible_vueD").value));

    const all = computed(function allCompute() {//`produits`.`Type` asc,`vue_produits`.`Variete` asc,`vue_produits`.`Format` asc"
      logger.time("all viewd");
      try {
        const oas: MyTablesDef["vue_bible_vueD"][] = Object.values(services.data.get("vue_bible_vueD").value);
        const oasByProd = oas.reduce(function oasByProdReduce(a, oa) {
          a[oa.Produit] = a[oa.Produit] || [];
          a[oa.Produit].push(oa);
          return a;
        }, {});

        const bibleByProd = services.data.indexesByTable.bible.Produit.value;

        return Object.values(services.data.get("produits").value).filter(p => {
          return p.Variete?.toLowerCase()?.indexOf(search.variete.toLocaleLowerCase()) !== -1;
        }).sort((a, b) => {
          return a.Type - b.Type || String(a.Variete).localeCompare(b.Variete) || a.Format - b.Format;
        }).flatMap(function allFlatMap(product) {
          const prodCache = services.cache.caches.byProd.value[product.ID].value;
          const prices = prodCache.prices;
          const ventes = services.data.get("vue_ventes", product.ID).value;

          const bibleId = bibleByProd[product.ID]?.[0];
          const bibleData = bibleId !== undefined ? services.data.get("bible", bibleId).value : undefined;

          const bible = {
            ID: bibleId,
            createInfo: {
              Produit: product.ID
            },
            Quantite: bibleData?.Quantite,
            $Quantite: services.data.raw.bible.value[bibleId]?.Quantite
          }

          const achat = {
            years_pastA0: 0,
            years_pastA1: 0,
          };

          oasByProd[product.ID]?.forEach((oa) => {
            const year = moment.unix(oa.Date_reception).year();
            if (currentYear == year)
              achat.years_pastA0 += oa.Quantite_recevoir;
            if (currentYear - 1 == year)
              achat.years_pastA1 += oa.Quantite_recevoir;
          });

          return oasByProd[product.ID]?.map(function oasByProdMap(oa) {
            return {
              oa,
              product,
              ventes,
              prices,
              bible,
              achat
            }
          }) || [{
            product,
            prices,
            bible,
            achat
          }]
        })
      } finally {
        logger.timeEnd("all viewd");
      }
    });

    console.log(all);
		
		const {len, ipp, lines, page} = table(all, store);
		return {
      columns,
      search,
			len, ipp, page,
      lines: computed(() => {
        try {
          return lines.value.map(line => {
            return line;
          });
        } finally {}
      }),
		};
	},
    methods:{
      getColumnValue(key: string, line: object, column: object = {}){

        let keys = [];
        if(key.includes('.')){
          keys = key.split('.');
          let current = line;
          for (let i = 0; i < keys.length; i++) {
            if(typeof(current[keys[i]])!='object'){
              return this.getIndexedValue(current[keys[i]], column);
            }else if(typeof(current[keys[i]])=='object'){
              current = current[keys[i]];
            }
          }
        }else{
          if(typeof(line[key])=='string'){
            return this.getIndexedValue(line[key], column);
          }
        }
        return '';
      },
      getIndexedValue(value: string, column: object){
        if(value&&value!='undefined'){
          try{
            if(column['index']>-1){
              const v = value.split(',');
              return v[column['index']];
            }
            return value;
          }catch {
            console.log(value);
          }
          return value;
        }
        return '';
      }
    },

});

function table(all: ComputedRef<any[]>, store: Store<StoreState>) {
	const page = ref(0);
	const ipp = computed(() => store.state.settings.ipp);
	const len = computed(() => Math.ceil(all.value.length / ipp.value));
	
	return {
		page, ipp, len,
		lines: computed(() => {
			return all.value.slice(ipp.value * page.value, ipp.value * (page.value + 1));
		})
	};
}
</script>

<style scoped>
table{
  border-collapse: collapse;
}
th, td{
  border: #ccc 1px solid;
  padding: 5px;
}
th,td{
  white-space: nowrap;
}

.botanix{
  background-color: #DDEBF7;
}
.groupex{
  background-color: #FCE4D6;
}
</style>
