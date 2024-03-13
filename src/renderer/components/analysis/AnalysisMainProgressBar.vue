<template>
  <div class="progress-col winarti progress-ani">
    <!-- 전체 진행율 -->
    <span class="text-lg-2 bold">
      {{ progressText }}
      <q-spinner v-if="props.percent === 0 && props.state !== 'error'" color="primary" size="1.5em" />
      <!-- 프로그래스 바 -->
    </span>
    <q-linear-progress
      stripe
      :value="computedProgress"
      :color="progressColor"
      :class="{ loading: progressAni }"
    ></q-linear-progress>
    <!-- 획득 진행중인 도구 이름 -->
    <p class="ellipsis fix-height">
      <!-- {{ title }} -->
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

// 진행율 텍스트
const progressText = computed(() => {
  if (percent.value === 0) {
    return '대기중...'
  }

  const formattedPercent = percent.value.toFixed(1).replace(/\.0$/, '') // 소수점 0이면 제거
  return `${formattedPercent} %`
})

// 진행율 (진행바 범위 : 0 ~ 1)
const computedProgress = computed(() => {
  return percent.value ? percent.value / 100 : 0
})

// 진행바 색상
const progressColor = computed(() => (state.value === 'error' ? 'negative' : 'info'))

// 프로그래스바 진행중일때 애니메이션 보이게
const progressAni = computed(() => {
  return percent.value > 0 && percent.value < 100
})
</script>

<style scoped lang="scss">
// 프로그래스바 진행중일때 애니메이션
.progress-ani :deep {
  .q-linear-progress {
    &.loading {
      .q-linear-progress__stripe {
        animation: progress 0.8s linear 0s infinite;
      }
    }
  }
  @keyframes progress {
    from {
      background-position: 0 0;
    }
    to {
      background-position: 40px 0;
    }
  }
}
</style>
