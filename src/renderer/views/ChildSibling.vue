<template>
  <div style="border: 1px solid red">
    <h4>ChildSiblingView</h4>
    <div class="input-section">
      <label>state:</label>
      <input type="text" v-model="propsState" />
    </div>
    <div class="textarea-section">
      <textarea readonly style="width: 100%; height: 150px" v-model="propsData"></textarea>
    </div>
    <div class="input-section">
      <label>Key:</label>
      <input type="text" v-model="siblingKey" />
      <label>Value:</label>
      <input type="text" v-model="siblingValue" />
    </div>
    <div>
      <button @click="sendEmitToParent">change</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, ref, watch } from 'vue'

const emit = defineEmits(['siblingEmitData'])
const props = defineProps<{
  seletedData: string
  nowState: string
}>()

const propsData = ref(props.seletedData)
const propsState = ref(props.nowState)
const siblingKey = ref<string>('')
const siblingValue = ref<string>('')

const sendEmitToParent = () => {
  emit('siblingEmitData', { siblingKey: siblingKey.value, siblingValue: siblingValue.value })
}

// nowState가 변경될 때마다 propsState 업데이트
watch(
  () => props,
  (newValue) => {
    propsState.value = newValue.nowState
    propsData.value = newValue.seletedData
  },
  { deep: true }
)
</script>
