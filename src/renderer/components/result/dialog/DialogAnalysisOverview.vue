<script setup lang="ts">
/**********************************************
 *
 * 분석개요 Dialog
 *
 **********************************************/

/**********************************************
 * @description Import
 */
import { defineProps, defineEmits, computed, watch, onMounted, Ref, ref } from 'vue'
import electronApi from '@renderer/api/electronApi'
import kapeApi from '@renderer/api/kapeApi'
import { OverviewSystemInfo, OverviewArtifactsInfo } from '@share/models'
import { numberWithCommas } from '@renderer/utils/utils'
import { storeToRefs } from 'pinia'
import { setDate } from '@renderer/utils/utils'
import { useCaseStore } from '@renderer/stores/caseStore'
import moment from 'moment'
const caseStore = useCaseStore()
const { overviewSystem, overviewArtifacts } = storeToRefs(caseStore)

/**********************************************
 * @description Define variables
 */
const props = defineProps(['isShow'])
const emit = defineEmits(['update:isShow'])

const isShow = computed({
  get() {
    return props.isShow
  },
  set(value) {
    emit('update:isShow', value)
  }
})

const analysisOverviewSystemObject: OverviewSystemInfo = ref({
  // 1) 분석 개요__ 시스템 정보
  InstallTime: overviewSystem.value?.InstallTime || '',
  ProductName: overviewSystem.value?.ProductName || '',
  RegisteredOwner: overviewSystem.value?.RegisteredOwner || '',
  DisplayVersion: overviewSystem.value?.DisplayVersion || '',
  CurrentMajorVersionNumber: overviewSystem.value?.CurrentMajorVersionNumber || '',
  CurrentMinorVersionNumber: overviewSystem.value?.CurrentMinorVersionNumber || '',
  CurrentBuildNumber: overviewSystem.value?.CurrentBuildNumber || '',
  TimeZoneKeyName: overviewSystem.value?.TimeZoneKeyName || ''
})

const analysisOverviewArtifactsObject: OverviewArtifactsInfo = ref({
  // 2) 분석 개요__ 아티팩트 분석 정보
  EventLogs: overviewArtifacts.value?.EventLogs || 0,
  ProgramExecution: overviewArtifacts.value?.ProgramExecution || 0,
  RegisteredOwner: overviewArtifacts.value?.RegisteredOwner || 0,
  FileDeletion: overviewArtifacts.value?.FileDeletion || 0,
  FileSystem: overviewArtifacts.value?.FileSystem || 0,
  BrowsingHistory: overviewArtifacts.value?.BrowsingHistory || 0,
  Registry: overviewArtifacts.value?.Registry || 0,
  FileFolderAccess: overviewArtifacts.value?.FileFolderAccess || 0,
  SRUMDatabase: overviewArtifacts.value?.SRUMDatabase || 0,
  Amcache: overviewArtifacts.value?.Amcache || 0
})

/** 데이터값 읽어오기  */
const fetchData = async () => {
  try {
    // 1) 시스템 정보 조회 api
    const getOverviewSystemInfo = await kapeApi.readSystemInfo()
    // console.log('Overview SystemInfo Info:', getOverviewSystemInfo)
    if (Array.isArray(getOverviewSystemInfo)) {
      getOverviewSystemInfo.forEach(({ ValueName, ValueData }) => {
        if (analysisOverviewSystemObject.value.hasOwnProperty(ValueName)) {
          analysisOverviewSystemObject.value[ValueName] = ValueData
        }
      })
    }

    // 2) 아티팩트 정보 조회 api
    const getOverviewArtifactsInfo = await kapeApi.readArtifactCountLInfo()
    // console.log('Overview Artifacts Info:', getOverviewArtifactsInfo)
    if (Array.isArray(getOverviewArtifactsInfo)) {
      getOverviewArtifactsInfo.forEach(({ category_1, count }) => {
        if (analysisOverviewArtifactsObject.value.hasOwnProperty(category_1)) {
          analysisOverviewArtifactsObject.value[category_1] = count
        }
      })
    }
    // * 시스템 정보 스토어에 저장
    caseStore.setOverviewSystem(analysisOverviewSystemObject.value)
    // * 아티팩트 정보 스토어에 저장
    caseStore.setOverviewArtifacts(analysisOverviewArtifactsObject.value)
  } catch (err) {
    console.error('시스템 정보를 가져오는 중 오류 발생:', err)
    // 오류 로그
    electronApi().logError(err)
  }
}

/** 닫기 버튼 클릭 */
const closeOverviewDialog = () => {
  isShow.value = false
  caseStore.setFirstRenderForAnalysisDialog(false)
}

/** 데이터 조회  */
onMounted(async () => {
  fetchData()
})

/**
 * installTime에 시간 추가를 위한 함수
 */
function addHoursToTime(timeString, hoursToAdd) {
  const originalDate = new Date(timeString)
  const newDate = new Date(originalDate.getTime() + hoursToAdd * 60 * 60 * 1000)
  return moment(newDate).format('YYYY-MM-DD HH:mm:ss')
}
</script>

<template>
  <!-- 분석개요 (s) -->
  <q-dialog v-model="isShow">
    <q-card class="q-dialog-plugin pop-default analysis-dialog-wrap">
      <q-card-section class="d-header">
        <h1>분석개요</h1>
        <q-space></q-space>
        <q-btn v-close-popup icon="close" flat dense @click="closeOverviewDialog"></q-btn>
      </q-card-section>
      <q-card-section class="d-container">
        <h2>획득정보</h2>
        <table class="tbl-data q-pb-md">
          <caption>- 시스템 정보</caption>
          <colgroup>
            <col width="12.6%" />
            <col width="*" />
            <col width="12.6%" />
            <col width="*" />
          </colgroup>
          <tbody>
            <tr class="">
              <th>OS 버전</th>
              <td v-if="overviewSystem && overviewSystem.ProductName">
                {{ overviewSystem.ProductName }} ( {{ overviewSystem.DisplayVersion }}/
                {{ overviewSystem.CurrentMajorVersionNumber }}. {{ overviewSystem.CurrentMinorVersionNumber }}.
                {{ overviewSystem.CurrentBuildNumber }})
              </td>
              <td v-else>OS 버전 정보가 존재하지 않습니다.</td>
              <th>OS 설치 날짜</th>
              <td v-if="overviewSystem && overviewSystem.InstallTime">
                {{ addHoursToTime(overviewSystem?.InstallTime, 9) }}
              </td>
              <td v-else>설치 날짜 정보가 존재하지 않습니다.</td>
            </tr>
            <tr>
              <th>Time Zone</th>
              <td>
                {{ overviewSystem?.TimeZoneKeyName }}
              </td>
              <th>현재 사용자</th>
              <td>
                {{ overviewSystem?.RegisteredOwner }}
              </td>
            </tr>
          </tbody>
        </table>
        <table class="tbl-data">
          <caption>- Artifacts 분석 정보</caption>
          <colgroup>
            <col width="*" />
            <col width="*" />
            <col width="*" />
            <col width="*" />
            <col width="*" />
            <col width="*" />
            <col width="*" />
            <col width="*" />
          </colgroup>
          <tbody class="text-center">
            <tr>
              <th>Registry</th>
              <td>
                {{ numberWithCommas(overviewArtifacts?.Registry) }}
              </td>
              <th>FileSystem</th>
              <td>
                {{ numberWithCommas(overviewArtifacts?.FileSystem) }}
              </td>
              <th>EventLogs</th>
              <td>
                {{ numberWithCommas(overviewArtifacts?.EventLogs) }}
              </td>
              <th>FileFolderAccess</th>
              <td>
                {{ numberWithCommas(overviewArtifacts?.FileFolderAccess) }}
              </td>
            </tr>
            <tr>
              <th>Amcache</th>
              <td>
                {{ numberWithCommas(overviewArtifacts?.Amcache) }}
              </td>
              <th>ProgramExecution</th>
              <td>
                {{ numberWithCommas(overviewArtifacts?.ProgramExecution) }}
              </td>
              <th>FileDeletion</th>
              <td>
                {{ numberWithCommas(overviewArtifacts?.FileDeletion) }}
              </td>
              <th>SRUMDatabase</th>
              <td>
                {{ numberWithCommas(overviewArtifacts?.SRUMDatabase) }}
              </td>
            </tr>
            <tr>
              <th>BrowsingHistory</th>
              <td>
                {{ numberWithCommas(overviewArtifacts?.BrowsingHistory) }}
              </td>
              <th></th>
              <td></td>
              <th></th>
              <td></td>
              <th></th>
              <td></td>
            </tr>
          </tbody>
        </table>
      </q-card-section>
      <q-card-actions class="d-footer">
        <q-btn outline icon="mdi-close" label="닫기" @click="closeOverviewDialog" />
      </q-card-actions>
    </q-card>
  </q-dialog>
  <!-- 분석개요 (e) -->
</template>

<style scoped lang="scss">
.q-card.analysis-dialog-wrap :deep {
  .q-card__section {
    &.d-container {
      h2 {
        font-size: 1.25rem !important;
        margin-bottom: 0.75rem;
      }
    }
  }
}
.q-dialog .q-card.pop-default {
  // height: calc(100vh - 108px)
  height: auto;
}
</style>
