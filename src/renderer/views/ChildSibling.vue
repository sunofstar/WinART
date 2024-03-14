<template>
  <div>
    <div class="input-section">
      <label>state:</label>
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
const props = defineProps<{ data: any; state: any }>('parentPropsData')
const propsData = ref(props.parentPropsData)
const propsState = ref(props.parentPropsState)
const siblingKey = ref<string>('')
const siblingValue = ref<string>('')

const sendEmitToParent = () => {
  // 부모 컴포넌트로 데이터를 전달합니다.
  emit('siblingEmitData', { siblingKey: siblingKey.value, siblingValue: siblingValue.value })
}
</script>
