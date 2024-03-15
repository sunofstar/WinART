<template>
  <div style="border: 1px solid blue">
    <h4>grandChildView</h4>
    <div>store: {{ log }}</div>
    <div class="input-section">
      <label>state:</label>
      <input type="text" v-model="injectState" />
    </div>
    <div class="textarea-section">
      <textarea readonly style="width: 100%; height: 75px" v-model="injectData"></textarea>
    </div>
    <div class="input-section">
      <label>Key:</label>
      <input type="text" v-model="grandChildKey" />
      <label>Value:</label>
      <input type="text" v-model="grandChildValue" />
    </div>
    <div>
      <button @click="sendEmitFromGrandChild">change</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject, ref, defineEmits } from 'vue'
import { storeToRefs } from 'pinia'
import { useTestStore } from '@renderer/stores/testStore'

const provideData = inject<{ seletedData: any; nowState: any }>('parentProvideData')
const injectData = ref(provideData?.seletedData)
const injectState = ref(provideData?.nowState)
const grandChildKey = ref<string>('')
const grandChildValue = ref<string>('')
const emit = defineEmits(['grandChildEmitData'])
const testStore = useTestStore()
const { log } = storeToRefs(testStore)
const sendEmitFromGrandChild = () => {
  emit('grandChildEmitData', {
    grandChildKey: grandChildKey.value,
    grandChildValue: grandChildValue.value
  })
}
</script>
