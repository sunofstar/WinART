<template>
  <div style="border: 1px solid red">
    <h4>ChildView</h4>
    <button @click="showGrandChild">grandChild</button>
    <GrandChild v-show="isShowGrandChild" @grandChildEmitData="sendEmitFromChild" />
  </div>
</template>

<script setup lang="ts">
import GrandChild from './GrandChild.vue'
import { defineEmits, ref } from 'vue'

const emit = defineEmits(['childEmitData'])
const isShowGrandChild = ref(false)
const sendEmitFromChild = (data) => {
  emit('childEmitData', data)
}
const showGrandChild = () => {
  isShowGrandChild.value = !isShowGrandChild.value
}
</script>
