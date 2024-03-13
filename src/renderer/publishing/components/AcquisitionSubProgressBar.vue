<template>
  <tr>
    <th>{{ title }}</th>
    <td>
      <!-- 프로그래스 바 -->
      <div class="progress-row winarti">
        <q-linear-progress stripe :value="computedProgress" :color="progressColor"></q-linear-progress>
        <!-- 진행 상태 -->
        <div
          class="status-label"
          :class="{
            'text-grey-5': state == 'wait',
            'text-primary': state == 'acquiring',
            'text-negative': state == 'error'
          }"
        >
          <q-icon :name="statusIcon"></q-icon>
          <span>{{ statusText }}</span>
        </div>
      </div>
      <div class="progress_time_info on">(2023-09-01 12:00:00)</div>
    </td>
  </tr>
  <!-- <div class="progress-row">
    <h4>{{ title }}</h4>

    <q-linear-progress stripe :value="computedProgress" :color="progressColor"></q-linear-progress>

    <div
      class="status-label"
      :class="{
        'text-grey-5': state == 'wait',
        'text-primary': state == 'acquiring',
        'text-negative': state == 'error'
      }"
    >
      <q-icon :name="statusIcon"></q-icon>
      <span>{{ statusText }}</span>
    </div>
  </div> -->
</template>

<script setup lang="ts">
/**
 * 이메일 분석 스텝별 진행바
 *
 */
import { computed, ComputedRef, toRefs } from 'vue'
import { ACQ_TOOL_TYPE } from '@share/models'
// props
export interface Props {
  /** 진행 도구*/
  tool: ACQ_TOOL_TYPE
  /** 진행율 */
  percent: number
  /** 진행 상태 (대기, 진행, 완료, 오류) */
  state: 'wait' | 'acquiring' | 'end' | 'error'
}
const props = defineProps<Props>()

const { tool, percent, state } = toRefs(props)

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

// 진행상태 텍스트
const statusText: ComputedRef<string> = computed(() => {
  if (state.value == 'acquiring') {
    return '진행중'
  } else if (state.value == 'end') {
    return '완료'
  } else if (state.value == 'error') {
    return '실패'
  } else {
    return '대기'
  }
})
// 진행상태 아이콘
const statusIcon: ComputedRef<string> = computed(() => {
  if (state.value == 'acquiring') {
    return 'mdi-play-circle'
  } else if (state.value == 'end') {
    return 'mdi-check-circle'
  } else if (state.value == 'error') {
    return 'mdi-alert-circle'
  } else {
    return 'mdi-stop-circle'
  }
})

// 상태바 색깔
const progressColor: ComputedRef<string> = computed(() => {
  return state.value == 'error' ? 'negative' : 'primary'
})

// 진행율 (진행바 범위 : 0 ~ 1)
const computedProgress: ComputedRef<number> = computed(() => {
  return percent.value ? percent.value / 100 : 0
})
</script>

<style scoped></style>
