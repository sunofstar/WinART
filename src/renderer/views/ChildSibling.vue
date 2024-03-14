<template>
  <div>
    <div class="input-section">
      <label>cstate:</label>
      <input type="text" v-model="propsState" />
    </div>
    <div class="textarea-section">
      <textarea style="width: 50%; height: 200px" v-model="propsData"></textarea>
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
import { defineProps, defineEmits, ref } from 'vue'

const emit = defineEmits(['siblingEmitData'])
const props = defineProps<{
  nowState: any,
  seletedData: any
}>()

// props로부터 값을 가져와 ref로 초기화합니다.
const propsData = ref(props?.seletedData)
const propsState = ref(props?.nowState)
const siblingKey = ref<string>('')
const siblingValue = ref<string>('')

const sendEmitToParent = () => {
  console.log(props)
  emit('siblingEmitData', { siblingKey: siblingKey.value, siblingValue: siblingValue.value })
}
</script>

