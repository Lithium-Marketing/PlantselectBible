<template>
  <div class="tools">
      <div class="tool-col">
        <button class="btn btn-secondary" @click="openColumnsSetting()"><font-awesome-icon :icon="['fas', 'gear']" /></button>
        <div ref="columnsSetting" :class="['columnsSetting',showColumnsSetting?'show':'', 'row']">
          <div class="setting-header">
            <h3>Colonnes visibles</h3>
          </div>
          <template v-for="(column, ckey) of columns">
              <div class="col-12 col-md-6 col-lg-4 col-xl-3 col-xxl-2"><input type="checkbox" v-model="columnVisible[column.key]"/><span v-html="column.name"></span></div>
          </template>
          <div class="setting-footer">
            <button class="btn btn-secondary" @click="closeColumnsSetting()">Fermer</button>
          </div>
        </div>
      </div>
  </div>
	<div class="home">
		<Pagination v-model:page="page" v-model:len="len"/>
    <table class="product" ref="tableRef">
			<thead>
			<tr>
        <template v-for="(column, ckey) of columns">
          <th :class="column.class" :style="getStyle(ckey,column,{})"  @click.mouse.right="changeColor(0,ckey,{},column);" v-if="columnVisible[column.key]">
            <span v-html="column.name"></span>
          </th>
        </template>
			</tr>
      <tr>
        <template v-for="(column, ckey) of columns">
          <th :class="column.class" :style="getStyle(ckey,column,{})" v-if="columnVisible[column.key]">
            <div><input class="search-input" v-if="column.search" v-model="search[column.search]"/></div>
          </th>
        </template>
      </tr>
			</thead>
			<tbody id="tBody">
			<template v-for="(line,lkey) of lines" :key="line.oa?.ID">
				<tr :style="getRowStyle(line)">
          <template v-for="(column, ckey) of columns">
          <td :class="column.class" :style="getStyle(ckey,column,line)" @click.mouse.right="changeColor(lkey,ckey,line,column);" @click.mouse.left="openPopper($event,column,line)" v-if="columnVisible[column.key]">
						  <template v-if="column.input">
                <TableInput2 :table="column.input.table" :field="column.input.field" :entity-id="getColumnValue(column.input.id, line)"/>
              </template>
              <template v-else-if="column.key">
                <div>
                {{ getColumnValue(column.key, line, column) }}
                <Popper arrow :show="showPopper[line.oa?.ID][column.key]" offset-distance="0" v-if="column.key!='product.Variete'">
                  <button></button>
                  <template #content="{close}">
                    <textarea rows="3" :value="getNote(column,line)" @change="setNote($event,column,line)"></textarea>
                    <span class="error small" v-if="errors.updateNotes">Erreur de connexion au serveur. Veuillez réessayer.</span>
                    <span class="small" v-if="saving">Sauvegarde en cours</span>
                    <span v-if="!saving"><Button @click="updateNotes($event)">Sauvegarder</Button><Button @click="closePopper($event)">X</Button></span>
                  </template>
                </Popper>
                  <div class="hasNote small" v-if="getNote(column,line)">{{getNote(column,line)}}</div>
                </div>
              </template>
					</td>
          </template>
				</tr>
			</template>
			</tbody>
		</table>
		<Pagination v-model:page="page" v-model:len="len"/>
    <div v-if="showColorPicker" class="colorPickerWraper">
      <div>
      <color-picker ref="colorpicker" color="selectedColor" @update:model-value="setSelectedColor($event)"></color-picker>
      <button class="btn btn-primary" @click="setColor()">Sauvegarder</button>
      <button class="btn btn-secondary" @click="closeColorPicker()">Annuler</button>
      </div>
    </div>
	</div>
</template>

<script lang="ts">
import {computed, ComputedRef, defineComponent, isProxy, reactive, ref} from "vue";
import {Store, useStore} from "vuex";
import {StoreState} from "@/store";
import Pagination from "@/components/Pagination.vue";
import TableInput from "@/components/TableInput.vue";
import ColorPicker from "@/components/ColorPicker.vue";
import {$pastTitle, currentYear, PricesId} from "@/helper/Const";
import moment from "moment";
import {LogService} from "@/services/logService";
import {MyTablesDef, useMyServices} from "@/config/dataConfig";
import TableInput2 from "@/components/TableInput2.vue";
import axios from "axios";
import {escape} from "mysql2";
import {RowDataPacket} from "mysql2/promise";
import Popper from "vue3-popper";
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

const logger = LogService.logger({name: "ViewD"});

export default defineComponent({
	name: "ViewD",
	components: {TableInput2, TableInput, Pagination,ColorPicker,Popper,FontAwesomeIcon },
  data(){
    return {
      freezeY: 0,
      styles: [],
      widths: [],
      showColorPicker: false,
      selectedColor: '#cccccc',
      focusCell: {},
      bible:{},
      bible_notes:{},
      currentPopper:{},
      errors: {
        updateNotes:false
      },
      saving: false,
      saving_retry: 3,
      columnVisible: {},
      showColumnsSetting: false
    };
  },
	setup() {
		const store = useStore<StoreState>();
		const services = useMyServices();
    const currentYear = moment().year();

    let columns = ref([
        {name:"Cultivars", key:'product.Variete', search:'variete', notooltip:true},
        {name:"Format", key:"product.Format"},
        {name:"pw", key:"oa.PW"},
        {name:"OA", key:"oa.ID", search:'id'},
        {name:"Vendant "+(currentYear-1), key:"oa.Vendant_1"},
        {name:"$ "+(currentYear-1), key:"oa.Coutant_1"},
        {name:"Transport "+(currentYear-1), key:"oa.Transport_1"},
        {name:"Vendant "+(currentYear), key:"oa.Vendant_0"},
        {name:"$ "+(currentYear), key:"oa.Coutant_0"},
        {name:"Transport "+(currentYear), key:"oa.Transport_0"},
        {name:"Botanix "+(currentYear-1), key:"oa.Botanix_1", class:"botanix"},
        {name:"Botanix "+(currentYear), key:"oa.Botanix_0", class:"botanix"},
        {name:"Groupex "+(currentYear-1), key:"oa.Groupex_1", class:"groupex"},
        {name:"Groupex "+(currentYear), key:"oa.Groupex_0", class:"groupex"},
        {name:"Réservation", key:"oa.Reservation"},
        {name:"Inventaire total", key:"oa.Inventaire"},
        {name:"Format", key:"oa.MP_Format"},
        {name:"Reception", key:"oa.Reception"},
        {name:"Fournisseur", key:"oa.Fournisseur"},
        {name:"Achat "+(currentYear), key:"oa.Achat_0"},
        {name:"Achat "+(currentYear)+" Confirmer", key:"oa.Achat_confirm_0"},
        {name:"Achat "+(currentYear+1), key:"oa.Achat_"},
        {name:"Achat "+(currentYear+1)+" Confirmer", key:"oa.Achat_confirm_"},
        {name:"Vente "+(currentYear-1), key:"oa.Vente_1"},
        {name:"Vente "+currentYear, key:"oa.Vente_0"},
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
        {name:"Ventes 16-17 "+(currentYear), key:"ventes.Semaine_16_17_0"},
        {name:"Ventes 16-17 "+(currentYear-1), key:"ventes.Semaine_16_17_1"},
        {name:"Ventes 18-19 "+(currentYear), key:"ventes.Semaine_18_19_0"},
        {name:"Ventes 18-19 "+(currentYear-1), key:"ventes.Semaine_18_19_1"},
        {name:"Ventes 20-21 "+(currentYear), key:"ventes.Semaine_20_21_0"},
        {name:"Ventes 20-21 "+(currentYear-1), key:"ventes.Semaine_20_21_1"},
        {name:"Ventes 22-23 "+(currentYear), key:"ventes.Semaine_22_23_0"},
        {name:"Ventes 22-23 "+(currentYear-1), key:"ventes.Semaine_22_23_1"},
        {name:"Ventes 24-25 "+(currentYear), key:"ventes.Semaine_24_25_0"},
        {name:"Ventes 24-25 "+(currentYear-1), key:"ventes.Semaine_24_25_1"},
        {name:"Ventes 26-27 "+(currentYear), key:"ventes.Semaine_26_27_0"},
        {name:"Ventes 26-27 "+(currentYear-1), key:"ventes.Semaine_26_27_1"},
        {name:"Ventes 28-30 "+(currentYear), key:"ventes.Semaine_28_30_0"},
        {name:"Ventes 28-30 "+(currentYear-1), key:"ventes.Semaine_28_30_1"},
        {name:"Ventes 31-34 "+(currentYear), key:"ventes.Semaine_31_34_0"},
        {name:"Ventes 31-34 "+(currentYear-1), key:"ventes.Semaine_31_34_1"},
        {name:"Ventes 35-38 "+(currentYear), key:"ventes.Semaine_35_38_0"},
        {name:"Ventes 35-38 "+(currentYear-1), key:"ventes.Semaine_35_38_1"},
    ]);
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
      variete: "",
      code:"",
      id:""
		});

    const showPopper = reactive([]);

    //console.log(Object.values(services.data.get("vue_bible_vueD").value));

    const all = computed(function allCompute() {//`produits`.`Type` asc,`vue_produits`.`Variete` asc,`vue_produits`.`Format` asc"
      logger.time("all viewd");
      try {
        const oas: MyTablesDef["vue_bible_vueD"][] = Object.values(services.data.get("vue_bible_vueD").value);
        const oasByProd = oas.reduce(function oasByProdReduce(a, oa) {
          const s = search.id;
          const s1 = s&&search.id==oa['ID'];
          if(s&&s1){
            a[oa.Produit] = a[oa.Produit] || [];
            a[oa.Produit].push(oa);
          }else if(!s){
            a[oa.Produit] = a[oa.Produit] || [];
            a[oa.Produit].push(oa);
          }
          return a;
        }, {});

        const bibleByProd = services.data.indexesByTable.bible.Produit.value;

        return Object.values(services.data.get("produits").value).filter(p => {
          if(!oasByProd[p.ID]){
            return false;
          }
          const s = search.variete||search.code;
          const s1 = search.variete&&p.Variete?.toLowerCase()?.indexOf(search.variete.toLocaleLowerCase()) !== -1;
          const s2 = search.code&&p.Code?.toLowerCase()?.indexOf(search.code.toLocaleLowerCase()) !== -1;
          if(s){
            //console.log('search '+s1+' : '+s2);
            return (s1 || s2);
          }
          return true;
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
            showPopper[oa.ID] = [];
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
		
		const {len, ipp, lines, page} = table(all, store);
    //console.log('showPopper');
    //console.log(showPopper.length);
		return {
      showPopper,
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
      async updateBible(){
        const val = escape(JSON.stringify(this.bible));
        const notes = escape(JSON.stringify(this.bible_notes));
        const conn = await services.data.conn.getConnection();
        try {
          await conn.beginTransaction();
          await conn.execute(`UPDATE bible_vueD SET Style=${val},Notes=${notes} WHERE ID=1`);
          await conn.commit()
        } catch (e) {
          if (conn) await conn.rollback();
          logger.error(e);
        } finally {
          if (conn) await conn.release();
        }
      },
      async getBible(){
        const conn = await services.data.conn.getConnection();
        const [rows, metas] = await conn.query(`SELECT * FROM bible_vueD WHERE ID=1`);
        if (Array.isArray(rows) && rows.length === 1) {
          const row = rows[0] as RowDataPacket;
          if(row['Style']){
            this.bible = row['Style'] ? JSON.parse(decodeURIComponent(row['Style'])) : {};
            this.bible_notes = row['Notes'] ? JSON.parse(decodeURIComponent(row['Notes'])) : {};
          }
        }
      },
      async updateNotes($event){
        this.saving = true
        const notes = escape(JSON.stringify(this.bible_notes));
        const conn = await services.data.conn.getConnection();
        try {
          await conn.beginTransaction();
          await conn.execute(`UPDATE bible_vueD SET Notes=${notes} WHERE ID=1`);
          await conn.commit();
          this.closePopper($event);
          this.saving = false;
          this.errors.updateNotes = false;
        } catch (e) {
          if (conn) await conn.rollback();
          this.saving = false;
          this.errors.updateNotes = true;
        } finally {
          if (conn) await conn.release();
          this.saving = false;
        }
      },

		};
	},
    methods:{
      openPopper($event,col,row){
        this.closePopper($event);
        if(!this.showPopper[row.oa?.ID]){
          this.showPopper[row.oa?.ID] = {};
        }
        this.showPopper[row.oa?.ID][col.key] = true;
        this.currentPopper = {col:col,row:row};
        console.log(this.showPopper[row.oa?.ID]);
      },
      closePopper(event){
        event.stopPropagation();
        if(this.currentPopper&&this.currentPopper.row){
          this.showPopper[this.currentPopper.row.oa?.ID][this.currentPopper.col.key] = false;
        }
      },
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
            //console.log(value);
          }
          return value;
        }
        return '';
      },
      getColumnStyle(ckey,line,column){
        return this.styles[ckey];
      },
      getBackgroundColor(ckey,column,line){
        let color = this.styles[ckey];
        if(column&&column.key){
          const row = this.bible[column.key];
          if(row){
            color = row||'';
          }
        }
        if(line&&column&&line.oa){
          const row_i = line.oa.ID;
          const row = this.bible[row_i];
          if(row){
            color = row.color||'';
          }
          if(row&&row[column.key]){
            color = row[column.key]||'';
          }
        }

        if(color=='#FFFFFF'){
          color = '';
        }

        //console.log(color);
        return color;
      },
      getPosition(ckey){
        let style = this.styles[ckey];
        if(style&&style.position){
          return style.position;
        }
        return '';
      },
      getLeft(ckey){
        let style = this.styles[ckey];
        if(style&&style.left){
          return style.left;
        }
        return '';
      },
      getRowStyle(line){
        let addon = {};
        /*if(line&&line.oa){
          const row_i = line.oa.ID;
          const row = this.bible[row_i];
          if(row){
            console.log('getRowStyle');
            addon = {backgroundColor:row.color||'#fff'};
            console.log(addon);
          }
        }*/
        return addon;
      },
      getStyle(ckey,column,line){
        let bgcolor = this.getBackgroundColor(ckey,column,line);
        let position = this.getPosition(ckey);
        let left = this.getLeft(ckey);
        const height = 1;
        let styles = {};
        if(!isProxy(bgcolor)&&bgcolor){
          styles['backgroundColor'] = bgcolor;
        }
        if(position){
          styles['position'] = position;
        }
        if(typeof(left)=='number'){
          styles['left'] = left;
        }
        if(height){
          styles['height'] = height;
        }
        if(column.key=='oa.Groupex_1'){
          //console.log(styles);
        }
        if(ckey==0){
          styles['zIndex'] = 1;
          styles['left'] = 0;
        }
        return styles;
      },
      setColumnW () {
        let ths = this.$refs.tableRef.tHead.rows.item(0).cells;
        for (let i = 0; i < ths.length; i++) {
          let w = ths[i].clientWidth;
          if(i==0){
            this.styles[i] = {position:'sticky',left:'0px'};
          }else if(i==1){
            this.styles[i] = {};
          }else{
            this.styles[i] = {};
          }
          this.widths[i] = w;
        }

      },
      changeColor(row_i,col_i,row,col){
        this.focusCell = {
          row_i:row_i,
          col_i:col_i,
          row:row,
          col:col
        };
        this.openColorPicker();
        //this.$refs.colorpicker.color;
      },
      setColor(){
        //console.log(this.focusCell);
        let isRow = false;
        let isCol = false;
        if(this.focusCell.col_i==0){
          isRow = true;
        }else if(this.focusCell.row_i==0&&!this.focusCell.row.oa){
          isCol = true;
        }
        if(isCol){//priorite colonne
          //console.log('set column color');
          if(this.selectedColor=='#FFFFFF'){
            //console.log('remove color');
            this.selectedColor = '';
          }
          this.bible[this.focusCell.col.key] = this.selectedColor;
        }else if(this.focusCell.row.oa){
          const code = this.focusCell.row.oa.ID;
          const key = this.focusCell.col.key;
          if(!this.bible[code]){
            this.bible[code] = {};
          }
          if(this.selectedColor=='#FFFFFF'){
            //console.log('remove color');
            this.selectedColor = '';
          }
          if(isRow){
            //console.log('set row color');
            this.bible[code]['color'] = this.selectedColor;
          }else{
            //console.log('set row column color');
            this.bible[code][key] = this.selectedColor;
          }
          //console.log(this.bible[code]);
        }
        //console.log(this.bible);
        //this.bible[]
        this.focusCell = {};
        this.closeColorPicker();
        this.updateBible();
      },
      setSelectedColor(color){
        //console.log(color);
        this.selectedColor = color;

      },
      openColorPicker(){
        this.showColorPicker = true;
      },
      closeColorPicker(){
        this.showColorPicker = false;
      },
      getNote(column,line){
        if(this.bible_notes[line.oa?.ID]&&this.bible_notes[line.oa?.ID][column.key]){
          console.log(this.bible_notes[line.oa?.ID][column.key]);
          return this.bible_notes[line.oa?.ID][column.key];
        }
        return '';
      },
      setNote(event,column,line){
        console.log(event);
        if(!this.bible_notes[line.oa?.ID]){
          this.bible_notes[line.oa?.ID] = {};
        }
        this.bible_notes[line.oa?.ID][column.key] = event.target.value;
        console.log(this.bible_notes[line.oa?.ID]);
      },
      openColumnsSetting(){
        this.showColumnsSetting = true;
      },
      closeColumnsSetting(){
        this.showColumnsSetting = false;
        this.saveColumnVisibility();
      },
      iniColumnVisibility(){
        //localStorage.setItem('columnVisible','');
        let columnVisible = localStorage.getItem('columnVisible');
        if(typeof(columnVisible)=='string'&&columnVisible){
          this.columnVisible = JSON.parse(columnVisible);
        }
        this.columns.forEach((col) => {
          if(typeof(this.columnVisible[col.key])!='boolean'){
            this.columnVisible[col.key] = true;
          }
        });
        if(!columnVisible){
          localStorage.setItem('columnVisible',JSON.stringify(this.columnVisible));
        }
      },
      saveColumnVisibility(){
        if(this.columnVisible){
          localStorage.setItem('columnVisible',JSON.stringify(this.columnVisible));
        }
      }
    },
    mounted () {
      this.iniColumnVisibility();
      this.setColumnW();
      this.getBible();
    }
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
th, td{
  /*white-space: nowrap;*/
  background-color: #FFFFFF;
}
td{
  padding: 0px;
}
td > div{
  padding: 5px;
  position: relative;
  height: 100%;
  box-sizing: border-box;
}
th:focus, td:focus, td:focus-within{
  border: green 2px solid;
}
thead{
  box-shadow: #000 1px 1px;
}

thead{
  position: sticky;
  left: 0px;
  top: 0px;
  z-index: 99;
}
tbody tr td:nth-child(0),
tbody tr td:nth-child(1),
thead tr th:nth-child(0),
thead tr th:nth-child(1){
  position: sticky;
}
tbody tr td:nth-child(0),
thead tr th:nth-child(0){
  left: 0px;
}

.hasNote{
  border:#8daa26 1px solid;
  padding: 0.3em;
  max-width: 100px;
  width: 100px;
}

.botanix{
  background-color: #DDEBF7;
}
.groupex{
  background-color: #FCE4D6;
}

.colorPickerWraper{
  position: fixed;
  background: #00000066;
  width: 100%;
  height: 100%;
  left: 0px;
  top: 0px;
  z-index: 9998;
}
.colorPickerWraper > div{
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%,-50%);
  z-index: 9999;
}
td::v-deep(.inline-block > div:nth-child(1)){
  visibility: hidden;
  position: absolute;
  top: 0px;
  height: 100%;
  width: 0px;
}
td::v-deep(.inline-block){
  position: relative;
}
td::v-deep(.popper){
  padding: 1em;
  background-color: #ffffff;
  border: #000000 1px solid;
  border-radius: 1em;
}
td::v-deep(.popper button){
  font-size: 0.8em;
}
td::v-deep(.popper:hover){
  background-color: #ffffff;
}
td::v-deep(.popper #arrow::before),
td::v-deep(.popper:hover #arrow::before){
  background: #8daa26;
}

.search-input{
  max-width: 100%;
  width: 100%;
  box-sizing: border-box;
}
.error{
  color: red;
}
.small{
  font-size: 0.7em;
}

.columnsSetting {
  padding: 3em;
  width: 90%;
  margin: auto;
  border: #ccc 1px solid;
  border-radius: 1em;
  background: #eee;
  display: none;
}
.columnsSetting.show {
  display: flex;
}
.columnsSetting > div:nth-child(1),
.columnsSetting > div:last-child{
  width: 100%;
  margin: 1em 0em;
}
.columnsSetting > div {
  display: flex;
  align-items: center;
}
.columnsSetting > div span br {
  display: none;
}
.columnsSetting > div input {
  margin-right: 1em;
}
.columnsSetting > div span {
  white-space: nowrap;
}
</style>
