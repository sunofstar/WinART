<template>
  <div>
    <div class="input-section">
      <label>state:</label>
      <input type="text" v-model="injectState" />
    </div>
    <div class="textarea-section">
      <textarea style="width: 50%; height: 200px" v-model="injectData"></textarea>
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
// const provideData = inject<{ data: any; state: any }>('parentProvideData')
const injectData = ref(1)
const injectState = ref(2)
const grandChildKey = ref<string>('')
const grandChildValue = ref<string>('')
const emit = defineEmits(['grandChildEmitData'])

const sendEmitFromGrandChild = () => {
  emit('grandChildEmitData', { grandChildKey: grandChildKey.value, grandChildValue: grandChildValue.value })
}
</script>
