<!-- route 권한 관련 false일 경우 login 없이 접근 불가 (s) -->
<route>{ meta: { disallowAuthed: true } }</route>

<script setup lang="ts">
/**********************************************
 * @description Import
 */
import dayjs from 'dayjs'
import { onBeforeUnmount, onMounted, Ref, ref } from 'vue'
import { useRouter } from 'vue-router'
import { QInput, useQuasar } from 'quasar'
import { requiredRule } from '@renderer/utils/validationRules'
import { useUserStore } from '@renderer/stores/userStore'
import { useSystemStore } from '@renderer/stores/systemStore'
import { openAlert, openDialog, openError } from '@renderer/composables/useDialog'
import electronApi from '@renderer/api/electronApi' // ElectronAPI
import commonApi from '@renderer/api/commonApi' // IpcRenderer
import loginApi from '@renderer/api/loginApi'

import {
  USER_STATUS,
  UserAuthInfo,
  DB_QUERY_PARAM,
  DB_PROGRESS_PARAM,
  DB_CASEINFO_ITEM,
  DB_CASEINFO_OPR
} from '@share/models'
import { useStoreResetExceptSystem } from '@renderer/stores'
import { KAPE_OP_CHANNELS } from '@share/constants' // viper

/**********************************************
 * @description Define variables
 */
const $q = useQuasar()
const router = useRouter()
const userStore = useUserStore()
const systemStore = useSystemStore()
import { storeToRefs } from 'pinia'
const { settingInfo } = storeToRefs(userStore)

// 로그인 입력폼
const isShowLoginForm: Ref<boolean> = ref(false)
const loginId: Ref<string> = ref('')
const loginIdRef: Ref<QInput | null> = ref(null)
const loginPw: Ref<string> = ref('')
const loginPwRef: Ref<QInput | null> = ref(null)
const saveId: Ref<boolean> = ref(false)

// 사용자 인증상태
const userStatus: Ref<USER_STATUS | undefined> = ref(undefined)

// 현재시간
const formattedTime: Ref<string> = ref(dayjs().format('YYYY.MM.DD HH:mm:ss'))
const intervalFormattedTime = setInterval(() => {
  formattedTime.value = dayjs().format('YYYY.MM.DD HH:mm:ss')
}, 1000)

// CapsLock 상태 안내 표시
const isShowCapsLockGuide = ref(false)
function checkCapsLock(event: KeyboardEvent): void {
  isShowCapsLockGuide.value = event.getModifierState('CapsLock')
}

/**********************************************
 * @description Define methods
 */

// 비동기 방식으로  DB API 호출하고 main process 응답을 기다리다가 수신하고
// 처리하는 방식
//async function testDBRead() {
const testDBRead = async (): Promise<void> => {
  console.log('### call Test-DB ####')
  //[1] 반드시 먼저 DB 파일을 절대 경로로 설정하여 connection을 만들어야 함
  //const re_0 = '_000'
  const re_0 = await window.ipcRenderer.invoke(
    KAPE_OP_CHANNELS.setDBName,
    'C:\\Temp3\\77_short\\트리아제테스트\\WinART\\20240223160155\\Temp\\DB\\art_트리아제테스트.db'
  )
  if (re_0 === '_000') {
    let _data: DB_CASEINFO_ITEM[] = []
    let item: DB_CASEINFO_ITEM = { _key: '', _value: '' }
    _data.push(item)
    // item = { _key: 'bbb222', _value: '222' }
    // _data.push(item)
    const param: DB_CASEINFO_OPR = {
      op: 'REF',
      data: _data
    }
    const re = await window.ipcRenderer.invoke(KAPE_OP_CHANNELS.CaseInfoTable, param)
    if (re !== 'D001' && re !== 'D003') console.log('### Test-DB-opr-case_info_Ok:', re)

    console.log('### Test-DB-done')
    /////////////////////////////////////////////////////////////
  } else {
    console.log('Test Fail:', re_0)
  }
}

window.ipcRenderer.on(
  KAPE_OP_CHANNELS.createSearchTableState,
  async (state: { state: string; percent: number }): Promise<void> => {
    console.log('createSearchTableState:', state.state, state.percent)
  }
)

async function userRegistration(): Promise<void> {
  const urlPath = await loginApi.userRegUrl()
  await electronApi().openPath(urlPath)
}
/**
 * @description 로그인 처리
 */
async function login(): Promise<void> {
  testDBRead()
  // // 입력검증
  // if (!formValidate()) {
  //   return
  // }
  // try {
  //   $q.loading.show()

  //   // 로그인
  //   const userAuthInfo: UserAuthInfo | undefined = await loginApi.login({
  //     userId: loginId.value,
  //     password: loginPw.value
  //   })
  //   if (!userAuthInfo) {
  //     // 로그인 실패
  //     openAlert('아이디 혹은 비밀번호가 맞지 않습니다.')
  //     return
  //   }

  //   // 사용자 및 인증정보 세팅
  //   userStore.setUser(userAuthInfo.user)
  //   userStore.setUserStatus(userAuthInfo.auth.status)
  //   userStore.setLauncherAuth(userAuthInfo.auth.launcher)

  //   const settingUserInfo = {
  //     saveID: loginId.value,
  //     isSaveID: saveId.value,
  //     defaultPath: settingInfo.value?.defaultPath,
  //     theme: settingInfo.value?.theme
  //   }
  //   // 사용자 로그인 아이디 및 저장 정보 스토어에 저장
  //   userStore.setSettingInfo(settingUserInfo)

  //   // 아이디 저장 정보 세팅
  //   await commonApi.setConfigItem({ key: 'savedId', val: saveId.value ? loginId.value : undefined })

  //   // 앱 버전 조회
  //   const getAppVersion = await commonApi.getAppVersion()
  //   systemStore.setAppVersion(getAppVersion)

  //   // 로그인 후처리
  //   $q.loading.hide()
  //   postLoginProcess(userAuthInfo.auth.status)
  // } catch (err) {
  //   if (electronApi !== undefined) electronApi?.logError(err)
  //   console.error(err)
  // } finally {
  //   $q.loading.hide()
  // }
}
/**
 * @description 로그인 후처리
 *
 * @param userStatus 사용자 인증 상태
 * @param authToken 인증토큰
 */
async function postLoginProcess(userStatus: USER_STATUS): Promise<void> {
  // TODO : 도구 업데이트 확인
  // 화면이동
  await router.push('/analysis')
}
/**
 * @description 입력항목 검증
 *
 * @returns 성공여부
 */
//ㅇㄴㅁㅇㅁㄴㅇㅁㄴㅇㄴㅁ
function formValidate(): boolean {
  loginIdRef.value?.validate()
  loginPwRef.value?.validate()

  return !(loginIdRef.value?.hasError || loginPwRef.value?.hasError)
}
async function init() {
  try {
    $q.loading.show()

    // 도구런처 로그인
    const userAuthInfo = await loginApi.launcherLogin()

    if (userAuthInfo && userAuthInfo.auth.status && userAuthInfo.auth.authToken) {
      // 사용자 및 인증정보 세팅
      userStore.setUser(userAuthInfo.user)
      userStore.setUserStatus(userAuthInfo.auth.status)
      userStore.setLauncherAuth(userAuthInfo.auth.launcher)
      // 로그인 후처리 실행
      $q.loading.hide()
      //postLoginProcess(userAuthInfo.auth.status)
      return
    }

    isShowLoginForm.value = true

    // 저장 아이디 조회
    const savedId = await commonApi.getConfigItem('savedId')
    if (savedId) {
      saveId.value = true
      loginId.value = savedId
    }

    // 온라인 상태 정보 조회
    const onlineStatus = await loginApi.onlineStatus()
    userStatus.value = onlineStatus
  } catch (err) {
    if (electronApi !== undefined) electronApi?.logError(err)
    console.error(err)
  } finally {
    $q.loading.hide()
  }
}
onMounted(async () => {
  // 현재날짜 세팅
  useStoreResetExceptSystem()
  init()
  // 로그인화면에서는 화이트모드 안먹게 막음
  $q.dark.set(true)

  // 현재 설정된 유저의 셋팅 정보 가져와 기본값으로 저장해 뿌려준다
  const currentSettingInfo = await commonApi.getSettingInfo()
  userStore.setSettingInfo(currentSettingInfo)
})

onBeforeUnmount(() => {
  // interval 제거
  clearInterval(intervalFormattedTime)
})
</script>

<template>
  <header class="login-header">
    <!-- <dl>
      <dt color="info" class="mr-3">현재시간</dt>
      <dd>{{ formattedTime }}</dd>
    </dl> -->
    <!-- <div class="connection-info">
      <q-btn
        v-show="userStatus == 'offline_auth_required'"
        flat
        icon="mdi-certificate-outline"
        class="pt2 q-mr-sm"
        label="오프라인 인증 생성"
      ></q-btn>
      <q-chip v-show="userStatus == 'offline_auth'" outline square icon="mdi-shield-link-variant-outline">
        오프라인 인증
      </q-chip>
      <q-chip v-show="userStatus == 'offline'" outline square icon="mdi-link-variant-remove">오프라인</q-chip>
      <q-chip v-show="userStatus == 'online'" color="positive" outline square icon="mdi-link-variant">온라인</q-chip>
    </div> -->
  </header>
  <div class="login-container">
    <div class="login-form">
      <!-- <q-img :ratio="1" src="@renderer/assets/images/logo_winart_mark.svg" alt="logo_winart_mark"></q-img>
      <q-img src="@renderer/assets/images/logo_winart_letter.svg" alt="logo_winart_mark"></q-img> -->
      <div class="section">
    <div>
      <label for="key">Key:</label>
      <input type="text">
    
      <label for="value">Value:</label>
      <input type="text">
    </div>
    <div>
      <button>Add</button>
      <button>Delete</button>
      <button>Child</button>
      <button>Apply</button>
    </div>
    <div>
      <textarea style="width: 50%; height: 150px;"></textarea>
    </div>
  </div>
      <q-form>
        <!-- <q-input ref="loginIdRef" v-model="loginId" :rules="[requiredRule]" label="아이디" outlined />
        <q-input
          ref="loginPwRef"
          v-model="loginPw"
          :rules="[requiredRule]"
          label="비밀번호"
          type="password"
          outlined
          @keydown="checkCapsLock"
          @keydown.enter="login"
        /> -->

        <!-- // Caps Lock noti message START // -->
        <!-- <div v-show="isShowCapsLockGuide" class="alert-capslock">
          <q-icon name="mdi-alert-outline" color="warning" size="sm"></q-icon>
          <span color="nagative">Caps Lock이 켜져 있습니다.</span>
        </div> -->
        <!-- // Caps Lock noti message END // -->

        <q-btn class="btn-login on-left" outline color="info" @click="login">로그인</q-btn>
        <!-- <div class="user-setting">
          <q-checkbox v-model="saveId" dense label="아이디 저장" />
          <q-btn flat icon="mdi-account-plus-outline" @click="userRegistration">사용자 등록</q-btn>
        </div> -->
        <!-- <q-btn color="info" @click="testDBRead">###DBCreateTest###</q-btn> -->
      </q-form>
    </div>
  </div>
  <!-- 20231205 대검찰청마크(copyright) 표시 추가 -->
  <img
    class="copyright"
    src="@renderer/assets/images/copyright.svg"
    width="292"
    height="24"
    alt="COPYRIGHT ⓒ PROSECUTION SERVICE. ALL RIGHTS RESERVED."
  />
</template>

<style scoped lang="scss">
.section > * {
    margin-bottom: 20px;
  }

  /* 라벨과 입력 필드 사이 간격 조정 */
  label {
    margin-right: 10px;
  }
.login-header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  position: relative;
  top: 0;
  left: 0;
  border-bottom: 0 none;
  height: 3.125rem;
  line-height: 3.125rem;
  padding: 0 1.5rem;
  .connection-info {
    display: flex;
    flex-direction: row;
    justify-content: right;
    align-items: center;
    flex-grow: 1;
    // .q-btn.pt2 .q-icon {
    //   padding-top: 2px;
    // }

    .v-chip:not(.v-chip--clickable):hover::before {
      opacity: 0;
    }
  }
  dl {
    display: flex;
    align-items: center;
  }
}
.login-container :deep {
  position: relative;
  display: flex;
  width: 100%;
  height: calc(100% - 3.125rem);
  padding-top: 5.625rem;
  justify-content: center;
  // .login-form {
  //   display: flex;
  //   flex-direction: column;
  //   align-content: center;
  //   align-items: center;
  //   width: 24rem;
  //   .q-img {
  //     width: 15rem;
  //   }
  //   p {
  //     font-size: 1.125rem;
  //     margin: 2rem 0 0;
  //   }
  //   .q-form {
  //     width: 100%;
  //     margin-top: 2.75rem;
  //     .q-input {
  //       margin-top: 1rem;
  //       &.q-field--labeled .q-field__native {
  //         padding-top: 1.25rem !important;
  //       }
  //       &.q-field--float .q-field__label {
  //         transform: translateY(-60%) scale(0.75);
  //       }
  //     }
  //     .btn-login {
  //       margin-top: 1rem;
  //       width: 100%;
  //       height: 3.75rem;
  //       font-size: 1.125rem;
  //       font-weight: 700;
  //     }
  //     .user-setting {
  //       display: flex;
  //       justify-content: space-between;
  //       margin-top: 0.625rem;
  //       font-size: 1rem;
  //       .q-btn {
  //         padding: 0;
  //         font-size: 1rem;
  //       }
  //       .q-btn:deep(.q-icon) {
  //         font-size: 1.25rem;
  //         margin-right: 0.5rem;
  //       }
  //     }
  //   }
  // }
  .alert-capslock {
    display: flex;
    flex-direction: row;
    align-items: center;
    padding-top: 0.5rem;
    padding-left: 0.8rem;
    .q-icon {
      font-size: 1.25rem;
    }
    span {
      color: var(--q-warning);
      padding-left: 0.5rem;
    }
  }
}

/* 20231205 대검찰청마크(copyright) 표시 추가_이규호 */
.copyright {
  display: inline-block;
  position: fixed;
  right: 1.5rem;
  bottom: 1.25rem;
}

/* 20231205 미디어쿼리 추가_이규호 */
@media all and (max-height: 55rem) {
  .login-container {
    padding-top: 2.5rem;
  }
}
</style>
