<template>
    <GrandChild @grandChildEmitData="sendEmitFromChild" />
    dsadasdasd
</template>

<script setup lang="ts">
import GrandChild from './GrandChild.vue'
import { defineEmits } from 'vue'

const emit = defineEmits(['childEmitData'])

const sendEmitFromChild = (data) => {
    emit('childEmitData', data)
}
</script>
