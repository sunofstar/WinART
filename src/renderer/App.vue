<script setup lang="ts">
import BaseToolBar from '@renderer/components/common/app/BaseToolBar.vue'
import { useConfigStore } from '@renderer/stores/configStore'
import { onMounted } from 'vue'

// winart_config.json 불러오기
const config = useConfigStore()
onMounted(async () => {
  await config.setCategory()
})
</script>

<template>
  <base-tool-bar />
  <div class="wrapper">
    <router-view />
  </div>
</template>

<style lang="scss">
@import './styles/main.scss';
</style>
