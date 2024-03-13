<route>{ meta: { disallowAuthed: true} }</route>

<template>
  <header class="login-header">
    <dl>
      <dt color="info" class="mr-3">현재시간</dt>
      <dd>{{ dateStr }}</dd>
    </dl>
    <div class="connection-info">
      <!-- <q-btn
        v-show="userStatus == 'offline_auth_required'"
        flat
        icon="mdi-certificate-outline"
        class="pt2 q-mr-sm"
        label="오프라인 인증 생성"
      ></q-btn>
      <q-chip v-show="userStatus == 'offline_auth'" outline square icon="mdi-shield-link-variant-outline">
        오프라인 인증
      </q-chip> -->
      <q-chip v-show="userStatus == 'offline'" outline square icon="mdi-link-variant-remove">오프라인</q-chip>
      <q-chip v-show="userStatus == 'online'" color="positive" outline square icon="mdi-link-variant">온라인</q-chip>
    </div>
  </header>
  <div class="login-container">
    <div class="login-form">
      <q-img :ratio="1" src="@renderer/assets/images/logo_winart_mark.svg" alt="logo_winart_mark"></q-img>
      <q-img src="@renderer/assets/images/logo_winart_letter.svg" alt="logo_winart_mark"></q-img>
      <q-form>
        <q-input ref="loginIdRef" v-model="loginId" :rules="[requiredRule]" label="아이디" outlined />
        <q-input
          ref="loginPwRef"
          v-model="loginPw"
          :rules="[requiredRule]"
          label="비밀번호"
          type="password"
          outlined
          @keydown="checkCapsLock"
          @keydown.enter="login"
        />

        <!-- // Caps Lock noti message START // -->
        <!-- <template #capsLock>
          <div class="alert-capslock">
            <q-icon name="mdi-alert-outline" color="warning" size="sm"></q-icon>
            <span color="nagative">Caps Lock이 켜져 있습니다.</span>
          </div>
        </template> -->
        <!-- // Caps Lock noti message END // -->

        <q-btn class="btn-login on-left" outline color="info" @click="login">로그인</q-btn>
        <div class="user-setting">
          <q-checkbox v-model="saveId" dense label="아이디 저장" />
          <q-btn flat icon="mdi-account-plus-outline">사용자 등록</q-btn>
        </div>
      </q-form>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 로그인 화면
 *
 */
import { requiredRule } from '@renderer/utils/validationRules'
import { USER_STATUS } from '@share/models'
import dayjs from 'dayjs'
import { QInput } from 'quasar'
import { onMounted, onUnmounted, Ref, ref } from 'vue'

// 로그인 입력폼
const loginId: Ref<string> = ref('')
const loginIdRef: Ref<QInput | null> = ref(null)
const loginPw: Ref<string> = ref('')
const loginPwRef: Ref<QInput | null> = ref(null)
const saveId: Ref<boolean> = ref(false)

// 현재날짜
const dateStr = ref('')
/**
 * 현재날짜를 세팅
 *
 */
function updateTime(): void {
  dateStr.value = dayjs().format('YYYY.MM.DD HH:mm:ss')
}
const intervalObj = setInterval(updateTime, 1000)

// 사용자 인증상태
const userStatus: Ref<USER_STATUS> = ref('offline')

// CapsLock 상태 안내 표시
const isShowCapsLockNotice = ref(false)
function checkCapsLock(event: KeyboardEvent): void {
  isShowCapsLockNotice.value = event.getModifierState('CapsLock')
}

/**
 * 로그인 처리
 *
 */
function login(): void {
  // 입력검증
  if (!formValidate()) {
    return
  }
}

/**
 * 입력항목 검증
 *
 * @returns 성공여부
 */
function formValidate(): boolean {
  loginIdRef.value?.validate()
  loginPwRef.value?.validate()

  return !(loginIdRef.value?.hasError || loginPwRef.value?.hasError)
}

onMounted(() => {
  // 현재날짜 세팅
  updateTime()
})

onUnmounted(() => {
  // interval 제거
  clearInterval(intervalObj)
})
</script>

<style scoped lang="scss">
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
.login-container {
  position: relative;
  display: flex;
  width: 100%;
  height: calc(100% - 3.125rem);
  padding-top: 5.625rem;
  justify-content: center;
  .login-form {
    display: flex;
    flex-direction: column;
    align-content: center;
    align-items: center;
    width: 24rem;
    .q-img {
      width: 15rem;
    }
    p {
      font-size: 1.125rem;
      margin: 2rem 0 0;
    }
    .q-form {
      width: 100%;
      margin-top: 2.75rem;
      .q-input {
        margin-top: 1rem;
        &.q-field--labeled .q-field__native {
          padding-top: 1.25rem !important;
        }
        &.q-field--float .q-field__label {
          transform: translateY(-60%) scale(0.75);
        }
      }
      .btn-login {
        margin-top: 1rem;
        width: 100%;
        height: 3.75rem;
        font-size: 1.125rem;
        font-weight: 700;
      }
      .user-setting {
        display: flex;
        justify-content: space-between;
        margin-top: 0.625rem;
        font-size: 1rem;
        .q-btn {
          padding: 0;
          font-size: 1rem;
        }
        .q-btn:deep(.q-icon) {
          font-size: 1.25rem;
          margin-right: 0.5rem;
        }
      }
    }
  }
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
</style>
