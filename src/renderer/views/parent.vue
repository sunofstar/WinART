<!-- route 권한 관련 false일 경우 login 없이 접근 불가 (s) -->
<route>{ meta: { disallowAuthed: true } }</route>

<script setup lang="ts">
/**********************************************
 * @description Import
 */
import dayjs from 'dayjs'
import { onBeforeUnmount, onMounted, Ref, ref, provide } from 'vue'
import { useRouter } from 'vue-router'
import { QInput, useQuasar } from 'quasar'
import { requiredRule } from '@renderer/utils/validationRules'
import { useUserStore } from '@renderer/stores/userStore'
import { useTestStore } from '@renderer/stores/testStore'
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
import { storeToRefs } from 'pinia'
import { RFC_2822 } from 'moment'
import ChildView from './Child.vue'
import ChildSiblingView from './ChildSibling.vue'
import { map } from 'lodash'

/**********************************************
 * @description Define variables
 */
const $q = useQuasar()
const router = useRouter()
const userStore = useUserStore()
const systemStore = useSystemStore()
const dbUrl = 'C:\\Temp3\\77_short\\트리아제테스트\\WinART\\20240223160155\\Temp\\DB\\art_트리아제테스트.db'
const success: string = '_000'
const stateError: string = 'D001'
const optionError: string = 'D003'
let _data: DB_CASEINFO_ITEM[] = []
let item: DB_CASEINFO_ITEM = { _key: '', _value: '' }
let dataArray = { _key: '', _value: '' }
let param: DB_CASEINFO_OPR = {
  op: 'REF',
  data: _data
}
let re: String = ''
const seletedData = ref('')
const keyData = ref('')
const valueData = ref('')
const isShowChild = ref(false)
const isShowChildSibling = ref(false)
const nowState = ref('')
const childKeyData = ref('')
const childValueData = ref('')
const testStore = useTestStore()
const { log } = storeToRefs(testStore)

provide('parentProvideData', { nowState, seletedData })

/**
 * DB의 값을 검색하는 함수
 * @return Promise<void> 성공 여부를 담은 Promise 객체
 */
const selectData = async (): Promise<void> => {
  const re_0 = await window.ipcRenderer.invoke(KAPE_OP_CHANNELS.setDBName, dbUrl)
  if (re_0 === success) {
    param = transformData('', '', 'REF')
    re = await window.ipcRenderer.invoke(KAPE_OP_CHANNELS.CaseInfoTable, param)
    if (re !== stateError && re !== optionError) console.log('### SUCCESS SELECT!!:', re)
    seletedData.value = JSON.stringify(re.data)
  } else {
    console.log('SELECT FAIL:', re_0)
  }
}
/**
 * DB에 값을 넣어주는 함수
 * @return Promise<void> 성공 여부를 담은 Promise 객체
 */
const addData = async (): Promise<void> => {
  nowState.value = 'addData'
  const re_0 = await window.ipcRenderer.invoke(KAPE_OP_CHANNELS.setDBName, dbUrl)
  if (re_0 === success) {
    param = transformData(keyData.value, valueData.value, 'ADD')
    re = await window.ipcRenderer.invoke(KAPE_OP_CHANNELS.CaseInfoTable, param)
    if (re !== stateError && re !== optionError) console.log('### SUCCESS INSERT!!:', re)
    selectData()
    testStore.pushLog('addData')
  } else {
    console.log('INSERT FAIL:', re_0)
  }
}

/**
 * DB에 해당 값을 삭제하는 함수
 * @return Promise<void> 성공 여부를 담은 Promise 객체
 */
const deleteData = async (): Promise<void> => {
  nowState.value = 'deleteData'
  const re_0 = await window.ipcRenderer.invoke(KAPE_OP_CHANNELS.setDBName, dbUrl)
  if (re_0 === success) {
    param = transformData(keyData.value, '', 'DEL')
    re = await window.ipcRenderer.invoke(KAPE_OP_CHANNELS.CaseInfoTable, param)
    if (re !== stateError && re !== optionError) console.log('### SUCCESS DELETE!!:', re)
    selectData()
    testStore.pushLog('deleteData')
  } else {
    console.log('DELETE FAIL:', re_0)
  }
}

/**
 * DB에 해당 값을 수정하는 함수
 * @return Promise<void> 성공 여부를 담은 Promise 객체
 */
const updateData = async (): Promise<void> => {
  nowState.value = 'updateData'
  const re_0 = await window.ipcRenderer.invoke(KAPE_OP_CHANNELS.setDBName, dbUrl)
  if (re_0 === success) {
    param = transformData(childKeyData.value, childValueData.value, 'MOD')
    re = await window.ipcRenderer.invoke(KAPE_OP_CHANNELS.CaseInfoTable, param)
    if (re !== stateError && re !== optionError) console.log('### SUCCESS UPDATE!!:', re)
    selectData()
    testStore.pushLog('updateData')
  } else {
    console.log('UPDATE FAIL:', re_0)
  }
}
/**
 * DB에 전달할 데이터로 바꿔주는 함수
 * @param {string} _key : 해당 데이터의 key값
 * @param {string} _value : 해당 데이터의 value값
 * @param {number} type : DB에 수행할 작업
 * @return {op: String, data: []} param : DB에 작업을 수행할 데이터
 */
const transformData = (_key: String, _value: String, type: String) => {
  item._key = _key
  item._value = _value
  _data.splice(1, 1, item)
  const transformedParam = {
    op: type,
    data: _data
  }
  return transformedParam
}

/**
 * ChildView를 보여주는 함수
 * @return {void}
 */
const showChild = () => {
  isShowChild.value = !isShowChild.value
  testStore.pushLog('showChild')
}
/**
 * ChildSiblingView를 보여주는 함수
 * @return {void}
 */
const showChildSibling = () => {
  isShowChildSibling.value = !isShowChildSibling.value
  testStore.pushLog('showChildSibling')
}

/**
 * Child에서 보낸 값을 처리하는 함수
 * @return {void}
 */
const recieveChildEmitData = (data) => {
  childKeyData.value = data.grandChildKey
  childValueData.value = data.grandChildValue
  console.log('childKeyData===>', childKeyData.value)
  console.log('childValueData===>', childValueData.value)
}
/**
 * ChildSibling에서 보낸 값을 처리하는 함수
 * @return {void}
 */
const recieveChildSiblingEmitData = (data) => {
  childKeyData.value = data.siblingKey
  childValueData.value = data.siblingValue
  console.log('childSiblingKeyData===>', childKeyData.value)
  console.log('childSiblingValueData===>', childValueData.value)
}

onMounted(() => {
  selectData()
})
</script>

<template>
  <div class="login-container">
    <div class="login-form">
      <h4>ParentView</h4>
      <div class="section">
        <div>
          <label>Key:</label>
          <input type="text" v-model="keyData" />
          <label>Value:</label>
          <input type="text" v-model="valueData" />
        </div>
        <div>
          <button @click="addData">Add</button>
          <button @click="deleteData">Delete</button>
          <button @click="showChild">Child</button>
          <button @click="showChildSibling">ChildSibling</button>
          <button @click="updateData">Apply</button>
          <button @click="testStore.popLog()">Pop</button>
          <div>store: {{ log }}</div>
        </div>
        <div>
          <textarea style="width: 100%; height: 75px" v-model="seletedData"></textarea>
        </div>
      </div>
      <ChildView @childEmitData="recieveChildEmitData" v-show="isShowChild" />
      <ChildSiblingView
        @siblingEmitData="recieveChildSiblingEmitData"
        :nowState="nowState"
        :seletedData="seletedData"
        v-show="isShowChildSibling"
      />
    </div>
  </div>
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
