<script setup lang="ts">
/**********************************************
 * @description Import
 * 해시값 검증 다이얼로그
 */
import commonApi from '@renderer/api/commonApi'
import evidenceImageApi from '@renderer/api/evidenceImageApi'
import electronApi from '@renderer/api/electronApi'
import triageApi from '@renderer/api/triageApi'
import { HashVal } from '@share/models'
import { useDialogPluginComponent, useQuasar } from 'quasar'
import { computed, ComputedRef, onMounted, reactive, Ref, ref, toRefs, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useCaseStore } from '@renderer/stores/caseStore'
import { useTriageCaseStore } from '@renderer/stores/triageCaseStore'
import { useUserStore } from '@renderer/stores/userStore'
import { openError } from '@renderer/composables/useDialog'
const caseStore = useCaseStore()
const triageCaseStore = useTriageCaseStore()
const userStore = useUserStore()
const { triageCaseDetail, triageCaseHashFileInfo, triageCaseHashFile } = storeToRefs(triageCaseStore)
const { user } = storeToRefs(userStore)

/**********************************************
 * @description Define variables
 */

// props
interface Props {
  filePath: string
}
const props = defineProps<Props>()
const { filePath } = toRefs(props)
defineEmits([...useDialogPluginComponent.emits])
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent()

const $q = useQuasar()

// 진행율 텍스트
const progressText = computed(() => {
  if (validHash.value.state === 'error') {
    return ''
  }
  if (validHash.value.percent === 0) {
    return '대기중...'
  }
  const formattedPercent = validHash.value.percent.toFixed(1).replace(/\.0$/, '') // 소수점 0이면 제거
  return `${formattedPercent} %`
})

// 진행율 (진행바 범위 : 0 ~ 1)
const computedProgress: ComputedRef<number> = computed(() => {
  return validHash.value.percent ? validHash.value.percent / 100 : 0
})

// 진행바 색상
const progressColor = computed(() => (validHash.value.state === 'error' ? 'negative' : 'info'))

// 프로그래스바 진행중일때 애니메이션 보이게
const progressAni = computed(() => {
  return validHash.value.percent > 0 && validHash.value.percent < 100
})

// 받아오는 해시값 정보
export interface HashInfo {
  percent: number
  state: string
  hash: HashVal
}

// 원본 해시값, 검증 해시값
const originalHash: Ref<HashVal | undefined> = ref<HashVal | undefined>(undefined)
const validHash: Ref<HashInfo> = ref<HashInfo>({
  percent: 0,
  state: '',
  hash: {
    md5: '',
    sha1: ''
  }
})
const errorMsg: Ref<string | undefined> = ref<string | undefined>(undefined)
const errorHashImg: Ref<boolean> = ref(false)
const errorHash: Ref<boolean> = ref(false)

// 검증 결과 문구
//   1. 검증 완료 && 원본 해시값 존재 && 두 값이 일치 === match
//   2. 검증 완료 && 원본 해시값 존재 && 두 값이 일치하지 않음 === notMatch
//   3. 검증 완료 && 원본 해시값 존재 && 검증 해시값이 존재하지 않음 === notExist
//   4. 검증 완료 && ( error404 || error1 )  === errorImg
//   5. 검증 완료 && error === error
const validResult: Ref<string | undefined> = ref<string | undefined>(undefined)

// 검증 완료
const verification: ComputedRef<boolean> = computed(() => {
  return originalHash.value?.md5 == validHash.value.hash.md5 && originalHash.value.sha1 == validHash.value.hash.sha1
})

// 해시값 검증 결과 출력(3초 뒤 출력)
const resultHash: Ref<boolean> = ref(false)

// 해시 생성 로딩 완료 여부
const completedHashLoading: Ref<boolean> = ref(false)

// 완료 여부
const completed: Ref<boolean> = ref(false)

// 원본 해시값 존재여부
const hasOriginalHash: ComputedRef<boolean> = computed(() => {
  return !!originalHash.value?.md5 && !!originalHash.value.sha1
})

onMounted(async () => {
  try {
    $q.loading.show()
    const evidenceHash = triageCaseHashFile.value?.hash
    if (evidenceHash) {
      originalHash.value = {
        md5: evidenceHash.md5,
        sha1: evidenceHash.sha1
      }
      evidenceImageApi.getFileHash(
        filePath.value,
        (state: 'data' | 'end' | 'error', percent: number, hash?: HashVal) => {
          console.log(state, percent, hash)
          if (state === 'error') {
            let errorMessage = ''
            if (percent === 404 || percent === 1) {
              errorMessage = '이미지 파일이 없습니다.'
              errorHashImg.value = true
            } else {
              errorMessage = '해시값 검증에 실패하였습니다.'
              errorHash.value = true
            }
            openError(errorMessage)
            errorMsg.value = errorMessage
          }
          validHash.value = {
            percent: percent,
            state: state,
            hash: {
              md5: hash?.md5 ?? '',
              sha1: hash?.sha1 ?? ''
            }
          }
          if (state == 'data') {
            completedHashLoading.value = false
          }
          if (state == 'end') {
            console.log('setTimeout 2초 뒤 출력')
            setTimeout(() => {
              resultHash.value = true
            }, 2000)
          }
        }
      )
    }
  } catch (err) {
    // 오류 로그
    electronApi()
  } finally {
    completed.value = true
    completedHashLoading.value = true
    $q.loading.hide()
    // 모든 작업이 완료된 후에 getValidResult 호출
    // validResult.value = getValidResult()
  }
})

// validResult 반환
function getValidResult(): string | undefined {
  if (errorHashImg.value) {
    return 'errorImg'
  }
  if (errorHash.value) {
    return 'error'
  }
  if (completed.value && hasOriginalHash && verification.value === true) {
    return 'match'
  } else if (completed.value && hasOriginalHash && verification.value === false) {
    return 'notMatch'
  } else if (completed.value && !hasOriginalHash.value) {
    return 'notExist'
  }
  return undefined
}

// 값이 변경될 때마다 호출
watch([completed, hasOriginalHash, verification], () => {
  validResult.value = getValidResult();
});


/**
 * 확인 버튼 클릭
 *
 */
async function okClick(): Promise<void> {
  // onDialogOK(true)

  onDialogOK({ verification: verification.value, validHash: validHash.value.hash, validResult: validResult.value })
}
</script>

<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin hash-cal-dialog" style="width: 47rem">
      <q-card-section class="d-header">
        <h1>증거이미지 해시값 검증</h1>
      </q-card-section>
      <q-card-section class="d-container">
        <div class="tbl-wrap">
          <h2>원본 해시값</h2>
          <table class="tbl-data narrow q-mt-xs">
            <colgroup>
              <col width="14%" />
              <col width="*" />
            </colgroup>
            <tbody>
              <tr>
                <th>MD5</th>
                <td>{{ triageCaseHashFile?.hash.md5 }}</td>
              </tr>
              <tr>
                <th>SHA1</th>
                <td>{{ triageCaseHashFile?.hash.sha1 }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="progress-col progress-ani">
          <!-- 전체 진행율 -->
          <div class="title-and-progress q-mb-xs">
            <h2>검증 해시값</h2>
            <span class="text-lg-2 bold">{{ progressText }}</span>
            <q-spinner v-if="validHash.percent === 0 && validHash.state !== 'error'" color="primary" size="2em" />
          </div>
          <!-- 프로그래스 바 -->
          <q-linear-progress
            stripe
            :value="computedProgress"
            :color="progressColor"
            :class="{ loading: progressAni }"
          ></q-linear-progress>
        </div>
        <table class="tbl-data narrow" :loading="completedHashLoading">
          <colgroup>
            <col width="14%" />
            <col width="*" />
          </colgroup>
          <tbody>
            <tr>
              <th>MD5</th>
              <td>{{ validHash.hash.md5 }}</td>
            </tr>
            <tr>
              <th>SHA1</th>
              <td>{{ validHash.hash.sha1 }}</td>
            </tr>
          </tbody>
        </table>
        <div
          v-show="
            (progressText === '대기중...' || progressText !== '100 %' || !resultHash) && validHash.state !== 'error'
          "
          class="desc noti box"
        >
          <p class="text-warning">해시값 계산중입니다.</p>
        </div>
        <div v-show="completed && hasOriginalHash && verification && resultHash" class="desc box">
          <p class="text-info">해시값이 일치합니다.</p>
        </div>
        <div
          v-show="progressText === '100 %' && completed && hasOriginalHash && resultHash && !verification"
          class="desc noti box"
        >
          <p class="text-warning">
            <q-icon name="mdi-alert-outline" color="warning"></q-icon>
            해시값이 일치하지 않습니다.
          </p>
        </div>
        <div v-show="completed && !hasOriginalHash" class="desc noti box">
          <p class="text-warning">
            <q-icon name="mdi-alert-outline" color="warning"></q-icon>
            검증 해시값 정보가 존재하지 않습니다.
          </p>
        </div>
        <div v-show="validHash.state === 'error'" class="desc noti box">
          <p class="text-warning">
            <q-icon name="mdi-alert-outline" color="warning"></q-icon>
            {{ errorMsg }}
          </p>
        </div>
      </q-card-section>
      <q-card-actions class="d-footer">
        <q-btn
          outline
          icon="mdi-check"
          class="q-ml-sm"
          color="info"
          label="확인"
          :disable="!completed"
          @click="okClick"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">
.hash-cal-dialog {
  .tbl-data {
    font-size: 0.9375rem;
    font-weight: 700;
    th {
      font-weight: 700;
    }
  }
}
.title-and-progress {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
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
