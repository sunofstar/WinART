<!-- eslint-disable vue/no-setup-props-destructure -->
<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide" class="set-dialog-wrap">
    <q-card class="q-dialog-plugin" style="width: 900px">
      <q-card-section class="d-header">
        <h1>세부 옵션을 설정합니다.</h1>
      </q-card-section>
      <q-card-section class="d-container">
        <!-- 서브 진행바 목록 -->
        <div class="tbl-wrap">
          <h3 class="q-pb-xs">저장 옵션</h3>
          <table class="tbl-flat q-mt-sm">
            <colgroup>
              <col width="20%" />
              <col width="*" />
            </colgroup>
            <tbody>
              <tr>
                <th>
                  <div class="q-pl-md">기본폴더</div>
                </th>
                <td colspan="3">
                  <div class="d-flex-row q-pr-md">
                    <q-input
                      ref="defaultFolderRef"
                      v-model="defaultFolder"
                      type="text"
                      class="folder"
                      outlined
                      dense
                      readonly
                    ></q-input>
                    <q-btn
                      outline
                      icon="mdi-folder-open-outline"
                      label="폴더 선택"
                      class="btn-folder"
                      color="primary"
                      @click="defaultFolderClick"
                    ></q-btn>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <q-separator></q-separator>
        <div class="tbl-wrap">
          <table class="tbl-flat">
            <colgroup>
              <col width="20%" />
              <col width="*" />
            </colgroup>
            <tbody>
              <tr>
                <td class="vertical"><h3 class="q-pb-xs">테마 설정</h3></td>
                <td>
                  <div class="row justify-between q-pr-md">
                    <label class="dark-mode column">
                      <q-radio v-model="theme" val="black" label="블랙 테마"></q-radio>
                      <img src="@renderer/assets/images/dark_mode_1.svg" alt="블랙 테마" />
                    </label>
                    <label class="white-mode column">
                      <q-radio v-model="theme" val="white" label="화이트 테마"></q-radio>
                      <img src="@renderer/assets/images/white_mode_1.svg" alt="화이트 테마" />
                    </label>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <br />
      </q-card-section>
      <q-card-actions class="d-footer">
        <q-btn outline color="" label="취소" @click="closeDialog" />
        <q-btn outline color="info" label="저장" @click="saveSettingInfo" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
/**
 * 경로 설정 다이얼로그
 *
 */
import electronApi from '@renderer/api/electronApi'
import commonApi from '@renderer/api/commonApi'
import { Ref, ref, toRefs, ComputedRef, computed, onMounted, watch } from 'vue'
import { QInput, useQuasar, useDialogPluginComponent } from 'quasar'
import { SettingInfo } from '@share/models'
defineEmits([...useDialogPluginComponent.emits])
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent()
import { useUserStore } from '@renderer/stores/userStore'
import { storeToRefs } from 'pinia'
const $q = useQuasar()
const { user, settingInfo } = storeToRefs(useUserStore())
const userStore = useUserStore()

// 사용자가 저장한 기본 경로
const settingDefaultPath: Ref<string> = ref('')

// 원시 초기 기본 경로
const initialDefaultFolderPath: Ref<string> = ref('')

// 화면에 출력되는 기본 경로
// 1) 화면에 뿌려지는 경로
const defaultFolderRef: Ref<QInput | null> = ref(null)
// 2) 현재 새롭게 설정된 new경로
const defaultFolerPath: Ref<string> = ref(settingDefaultPath || initialDefaultFolderPath || '')
const defaultFolder: ComputedRef<string> = computed(() => (defaultFolerPath.value ? defaultFolerPath.value : ''))
// const defaultFolder: Ref<string> = ref(defaultFolerPath.value ? defaultFolerPath.value : '')

// 기본 경로 버튼 클릭
async function defaultFolderClick(): Promise<void> {
  await handleFolderClick(defaultFolerPath)
}

// 테마
const theme: Ref<string> = ref('black')

/**
 * 다크모드와 화이트모드 설정
 *
 * @param {string} theme - 선택된 테마
 */
async function setDarkMode(theme: string): Promise<void> {
  if (theme === 'black') {
    $q.dark.set(true)
  } else {
    $q.dark.set(false)
  }
}

/**
 * 폴더 선택 경로 처리
 *
 * @param {Ref<string>} folderPath - 경로를 저장할 Ref
 */
async function handleFolderClick(folderPath: Ref<string>): Promise<void> {
  // 폴더 선택 다이얼로그
  const dialogVal = await electronApi().openFolderDialog(defaultFolder.value)
  if (!dialogVal.canceled) {
    // 경로 저장
    folderPath.value = dialogVal.filePaths.length ? dialogVal.filePaths[0] : ''
  }
}

/**
 * 유저의 셋팅 정보 가져오기
 *
 * @returns {SettingInfo} - 현재 저장된 설정 정보를 가져와 담는다
 */
// async function getCurrentSettingInfo(): Promise<void> {
//   const currentSettingInfo = await commonApi.getSettingInfo()
// }

/**
 * 현재 사용자의 userSettingInfo값 설정
 *
 */
async function getSettingInfoObj(): Promise<SettingInfo> {
  const obj: SettingInfo = {
    saveID: settingInfo.value?.saveID || '',
    isSaveID: settingInfo.value?.isSaveID || false,
    defaultPath: defaultFolder.value,
    theme: theme.value || 'black'
  }
  // console.log(obj)
  return obj
}

/**
 * 저장 버튼 클릭시 가져온 설정된 값을 setSettingInfo 및 스토어에 저장
 *
 */
async function saveSettingInfo(): Promise<void> {
  // userSettingInfo값 가져오기
  try {
    // 기본 경로 설정
    const settingInfo = await getSettingInfoObj()
    await commonApi.setSettingInfo(settingInfo)
    // 기본 경로 설정 user스토어에 저장
    userStore.setSettingInfo(settingInfo)
    // 테마 설정
    await setDarkMode(settingInfo.theme)
    // console.log(settingInfo)
  } catch (error) {
    // 저장 중 오류가 발생
    console.error('세팅 정보 저장중 오류 :', error)
    // 다이얼로그 닫기
  }
  closeDialog()
}

/**
 * 닫기 버튼 클릭
 *
 */
async function closeDialog(): Promise<void> {
  if (dialogRef.value) {
    dialogRef.value.hide()
  }
}
/**
 * 폴더 default path 가져오기
 *
 */
async function getDefaultFolderPath() {
  const defaultPath = await commonApi.getDefaultPath()
  return defaultPath
}

onMounted(async () => {
  try {
    // 현재 설정된 유저의 셋팅 정보 가져와 기본값으로 저장해 뿌려준다
    const currentSettingInfo = await commonApi.getSettingInfo()
    // console.log(currentSettingInfo)
    settingDefaultPath.value = currentSettingInfo.defaultPath
    theme.value = currentSettingInfo.theme
    // 원시 기본 경로 불러와 원시 기본 경로에 저장
    initialDefaultFolderPath.value = await getDefaultFolderPath()
  } catch (err) {
    // 오류 로그
    electronApi().logError(err)
  }
})
</script>

<style scoped lang="scss">
.set-dialog-wrap :deep {
  .q-separator {
    margin: 1rem 0;
  }
  .vertical {
    vertical-align: text-top;
    padding-left: 0px;
    + td {
      //다크모드 화이트모드
      label {
        background-color: rgba(#fff, 7%);
        // border: 1px solid #56585a;
        border-radius: 0.375rem;
        width: calc(50% - 0.375rem);
        padding: 0 1rem 1rem 1rem;
        .q-radio {
          padding-top: 0.5rem;
          .q-radio__label {
            padding: 0rem !important;
          }
        }
        img {
          padding-top: 0.375rem;
          width: 100%;
          object-fit: contain;
          cursor: pointer;
        }
      }
    }
  }
}

// 화이트모드
.body--light {
  .set-dialog-wrap :deep {
    .vertical {
      + td {
        //다크모드 화이트모드
        label {
          background-color: $light-bg;
          border: 1px solid $light-border;
        }
      }
    }
  }
}
</style>
