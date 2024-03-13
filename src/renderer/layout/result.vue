/** @description Layout::result */
<!-- route 권한 관련 false일 경우 login 없이 접근 불가 (s) -->
<route>{ meta: { disallowAuthed: false } }</route>
<!-- route 권한 관련 false일 경우 login 없이 접근 불가 (e) -->

<script setup lang="ts">
/**********************************************
 * @description Import
 */
import ArtiTabs from '@renderer/components/result/header/ArtiTabs.vue'
import { ref } from 'vue'
const view = ref(null)

function onTabClick(id: number, opton?: any) {
  view.value?.onTabClick(id, opton)
}
</script>

<template>
  <ArtiTabs @tabClick="onTabClick" />
  <div class="result-wrap">
    <router-view v-slot="{ Component }">
      <component :is="Component" ref="view" />
    </router-view>
  </div>
</template>
<style scoped lang="scss">
.result-wrap {
  display: flex;
  flex-direction: column;
  height: 100%;
}
</style>
