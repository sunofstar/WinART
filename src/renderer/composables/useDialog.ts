import AlertDialog from '@renderer/components/common/dialog/AlertDialog.vue'
import ConfirmDialog from '@renderer/components/common/dialog/ConfirmDialog.vue'
import ErrorDialog from '@renderer/components/common/dialog/ErrorDialog.vue'
import { Dialog, QDialogOptions } from 'quasar'

/**
 * Alert 다이얼로그를 오픈하고 Promise 반환
 *
 * @param message 메시지
 * @returns 확인여부
 */
export function openAlert(message: string): Promise<boolean> {
  return new Promise<boolean>((resolve: (val: boolean) => void, reject: (err: any) => void) => {
    try {
      Dialog.create({
        component: AlertDialog,
        componentProps: {
          message: message
        }
      }).onDismiss(() => {
        resolve(true)
      })
    } catch (err) {
      reject(err)
    }
  })
}

/**
 * Confirm 다이얼로그를 오픈하고 Promise 반환
 * - 확인 버튼 : true
 * - 취소 버튼 : false
 *
 * @param message 메시지
 * @returns 선택버튼값
 */
export function openConfirm(message: string): Promise<boolean> {
  return new Promise<boolean>((resolve: (val: boolean) => void, reject: (err: any) => void) => {
    try {
      Dialog.create({
        component: ConfirmDialog,
        componentProps: {
          message: message
        }
      })
        .onOk(() => {
          resolve(true)
        })
        .onCancel(() => {
          resolve(false)
        })
    } catch (err) {
      reject(err)
    }
  })
}

/**
 * QuasarDialog를 오픈하고 Promise 반환
 * - 확인 버튼 : 데이터 전달
 * - 취소 버튼 : undefined 전달
 *
 * @param dialogOptions QDialogOptions
 * @returns 데이터
 */
export function openDialog<T>(dialogOptions: QDialogOptions): Promise<T | undefined> {
  return new Promise<T | undefined>((resolve: (val: T | undefined) => void, reject: (err: any) => void) => {
    try {
      Dialog.create(dialogOptions)
        .onOk((data) => {
          resolve(data)
        })
        .onCancel(() => {
          resolve(undefined)
        })
    } catch (err) {
      reject(err)
    }
  })
}

/**
 * Error 다이얼로그를 오픈하고 Promise 반환
 *
 * @param message 메시지
 * @param url 이동 URL (다이얼로그 종료 후 이동)
 */
export function openError(message: string, url?: string): Promise<void> {
  return new Promise<void>((resolve: (val: void) => void, reject: (err: any) => void) => {
    try {
      Dialog.create({
        component: ErrorDialog,
        componentProps: {
          message: message,
          url: url
        }
      }).onDismiss(() => {
        resolve()
      })
    } catch (err) {
      reject(err)
    }
  })
}
