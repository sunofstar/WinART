<template>
  <tr>
    <th>{{ title }}</th>
    <td>
      <!-- 프로그래스 바 -->
      <div class="progress-row winarti progress-ani">
        <q-linear-progress
          stripe
          :value="computedProgress"
          :color="progressColor"
          :class="{ loading: progressAni }"
        ></q-linear-progress>
        <!-- 진행 상태 -->
        <div
          class="status-label"
          :class="{
            'text-grey-5': progress.state !== 'extract' && progress.state !== 'end',
            'text-primary': progress.state === 'extract',
            'text-negative': progress.state === 'error'
          }"
        >
          <q-icon :name="statusIcon"></q-icon>
          <span>{{ statusText }}</span>
        </div>
      </div>
      <div class="progress_time_info on"></div>
    </td>
  </tr>
</template>

<script setup lang="ts">
/**
 * 분석 스텝별 진행바
 *
 */
import { computed, ComputedRef, toRefs } from 'vue'
import { EvidenceImageState } from '@share/models'
// props
export interface Props {
  /** 진행 스텝 */
  step: string
  /** 진행과정 */
  progress: EvidenceImageState
}
const props = defineProps<Props>()

const { step, progress } = toRefs(props)

// 타이틀
const title: ComputedRef<string> = computed(() => {
  if (step.value == 'unzip') {
    return '압축 이미지 풀기'
  } else if (step.value == 'kape') {
    return 'KAPE 분석'
  } else if (step.value == 'csv') {
    return '개별 아티팩트 생성'
  } else if (step.value == 'integratedDB') {
    return '통합 DB 생성'
  } else {
    return step.value
  }
})

// 진행상태 텍스트
const statusText: ComputedRef<string> = computed(() => {
  if (progress.value.state == 'extract') {
    return '진행중'
  } else if (progress.value.state == 'end') {
    return '완료'
  } else if (progress.value.state == 'error') {
    return '실패'
  } else if (progress.value.state == 'cancel') {
    return '취소'
  } else {
    return '대기'
  }
})

// 진행상태 아이콘
const statusIcon: ComputedRef<string> = computed(() => {
  if (progress.value.state == 'extract') {
    return 'mdi-play-circle'
  } else if (progress.value.state == 'end') {
    return 'mdi-check-circle'
  } else if (progress.value.state == 'error') {
    return 'mdi-alert-circle'
  } else {
    return 'mdi-stop-circle'
  }
})

// 상태바 색깔
const progressColor: ComputedRef<string> = computed(() => {
  return progress.value.state == 'error' ? 'negative' : 'primary'
})

// 진행율 (진행바 범위 : 0 ~ 1)
const computedProgress: ComputedRef<number> = computed(() => {
  return progress.value.percent ? progress.value.percent / 100 : 0
})
// 프로그래스바 진행중일때 애니메이션 보이게
const progressAni = computed(() => {
  return progress.value.percent > 0 && progress.value.percent < 100
})
</script>

<style scoped lang="scss">
// 프로그래스바 진행중일때 애니메이션
.progress-row.winarti {
  margin-top: 1.25rem;
  padding: 0 0.25rem 0 0.625rem;
  text-align: right;
  line-height: 1.3125rem;

  .q-linear-progress {
    width: 100%;
    height: 0.875rem;
  }

  .status-label {
    width: 5.5rem;
  }
}

.tbl-data .progress_time_info {
  height: 1rem;
  margin-top: 0.25rem;
  padding: 0 0.25rem;
  font-size: 0;
  color: #bcbebf;
  text-align: right;
  line-height: 1rem;

  &.on {
    font-size: 0.75rem;
  }
}

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
