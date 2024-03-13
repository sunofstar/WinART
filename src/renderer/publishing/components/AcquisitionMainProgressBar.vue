<template>
  <div class="progress-col winarti">
    <!-- 전체 진행율 -->
    <span class="text-lg-2 bold">{{ progressText }}</span>
    <!-- 프로그래스 바 -->
    <q-linear-progress stripe :value="computedProgress" :color="progressColor"></q-linear-progress>
    <!-- 대상 파일 이름-->
    <p class="ellipsis fix-height">
      {{ title }}
    </p>
  </div>
</template>

<script setup lang="ts">
/**
 * 획득 메인 진행바
 *
 */
import { computed, toRefs, ComputedRef } from 'vue'

// props
export interface Props {
  /** 대상 파일 */
  tool: string
  /** 진행율 */
  percent: number
  /** 진행상태 */
  state: string
}
const props = withDefaults(defineProps<Props>(), {
  tool: '',
  percent: 0,
  state: 'wait'
})
const { percent, tool, state } = toRefs(props)

// 타이틀
const title: ComputedRef<string> = computed(() => {
  if (tool.value == 'kape') {
    return 'Win Artifacts'
  } else if (tool.value == 'pccredential') {
    return 'PC 크리덴셜'
  } else if (tool.value == 'memory') {
    return '메모리'
  } else if (tool.value == 'message') {
    return 'PC 인스턴스 메신져'
  } else if (tool.value == 'mobile') {
    return 'PC 모바일백업'
  } else if (tool.value == 'accounting') {
    return '회계정보'
  } else if (tool.value == 'antiforensic') {
    return '안티포렌식'
  } else {
    return tool.value
  }
})

// 진행율 텍스트
const progressText = computed(() => {
  return percent.value ? `${percent.value} %` : ''
})

// 진행율 (진행바 범위 : 0 ~ 1)
const computedProgress = computed(() => {
  return percent.value ? percent.value / 100 : 0
})

// 진행바 색상
const progressColor = computed(() => (state.value === 'error' ? 'negative' : 'info'))
</script>

<style scoped></style>
