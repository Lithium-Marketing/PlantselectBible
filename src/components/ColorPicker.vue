<template>
  <div :style="{background: color}">
    <ColorPicker
        theme="light"
        :color="color"
        :colors-default="colors"
        :sucker-hide="false"
        :sucker-canvas="suckerCanvas"
        :sucker-area="suckerArea"
        @changeColor="changeColor"
        @openSucker="openSucker"
    />
  </div>
</template>

<script lang="ts">
import { ColorPicker } from 'vue-color-kit';
import 'vue-color-kit/dist/vue-color-kit.css';
import {ref} from "vue";
export default {
  components: {
    ColorPicker,
  },
  data() {
    return {
      suckerCanvas: null,
      suckerArea: [],
      isSucking: false
    }
  },
  props:{
    color: String,
    colors: Array
  },
  setup(props,{emit}){
    let color = '#59c7f9';
    if(props.color){
      color = props.color;
    }

    let colors = ref([]);
    console.log('props.colors');
    console.log(props.colors);
    if(props.colors){
      colors.value = [...colors.value,...props.colors];
    }
    colors.value.push('rgba(0,0,0,0)');

    return {
      color,
      colors,
      changeColor(color) {
        console.log(color);
        //this.color = `rgba(${r}, ${g}, ${b}, ${a})`;
        emit('update:modelValue',color.hex);
      }
    };
  },
  methods: {
    openSucker(isOpen) {
      if (isOpen) {
        // ... canvas be created
        // this.suckerCanvas = canvas
        // this.suckerArea = [x1, y1, x2, y2]
      } else {
        // this.suckerCanvas && this.suckerCanvas.remove
      }
    }
  },
}
</script>

<style lang="scss" scoped>
::v-deep(.hu-color-picker){
  width: 230px !important;
}
</style>
