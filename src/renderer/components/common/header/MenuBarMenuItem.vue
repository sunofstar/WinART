<template>
  <q-tabs v-model="selected" inline-label>
    <!-- //  v-model="tab" // -->
    <q-tab name="case" label="케이스 생성" icon="mdi-text-box-multiple-outline" @click="menuClick('/case')"></q-tab>
    <q-tab
      name="detection"
      label="탐지 및 획득"
      icon="mdi-text-box-check-outline"
      :disable="!isActivated"
      @click="menuClick('/case/detection')"
    ></q-tab>
    <q-tab
      name="report"
      label="보고서"
      icon="mdi-text-box-plus-outline"
      :disable="!isActivated"
      @click="menuClick('/case/report')"
    ></q-tab>
  </q-tabs>
</template>

<script setup lang="ts">
/**
 * 메뉴바 메뉴 목록
 *
//  */
//import { useResultsStore } from '@renderer/stores/resultsStore'     // del @viper
import { storeToRefs } from 'pinia'
import { computed, ComputedRef, Ref, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

//const resultsStore = useResultsStore()              // del @viper
//const { caseInfo } = storeToRefs(resultsStore)      // del @viper

// 메뉴 선택값
const selected: Ref<string | undefined> = ref()
// 매뉴경로
const routePath: ComputedRef<string> = computed(() => route.path)
watch(
  routePath,
  (path) => {
    if (path == '/case') {
      selected.value = 'case'
    } else if (path == '/case/detection') {
      selected.value = 'detection'
    } else if (path == '/case/report') {
      selected.value = 'report'
    }
  },
  { immediate: true }
)

// 분석결과, 증거이미지 생성 메뉴 활성화 여부
const isActivated: ComputedRef<boolean> = computed(() => !!caseInfo.value)

/**
 * 메뉴 클릭 시 해당 화면으로 이동
 *
 * @param url 메뉴 경로
 */
function menuClick(url: string): void {
  router.push(url)
}
</script>

<style scoped></style>
