<route>{ meta: { disallowAuthed: true} }</route>

<template>
  <q-dialog ref="dialogRef" v-model="isOpen" @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-card-section class="d-header">
        <h1>북마크 관리</h1>
      </q-card-section>
      <q-card-section class="d-container">
        <div class="box">
          <!-- 컬러 선택 -->
          <q-color v-model="bookmarkColor" flat no-header-tabs no-footer default-view="palette" dark></q-color>
        </div>
        <!-- 이름 입력-->
        <q-form ref="formRef" class="bm-manage">
          <q-input
            ref="bookmarkNameRef"
            v-model="bookmarkName"
            :rules="[requiredRule, maxLengthRule, specialCharRule]"
            type="text"
            maxlength="50"
            clear-icon="mdi-close"
            dense
            outlined
            clearable
          ></q-input>
          <q-btn label="저장" outline color="primary" @click="saveTagClick"></q-btn>
        </q-form>
        <q-separator class="q-my-md"></q-separator>

        <!-- 북마크 목록 -->
        <q-list dark class="bm-list">
          <q-item v-for="item in bookmarks" :key="item.id" v-ripple clickable :active="updateBookmark?.id == item.id">
            <!-- 북마크 아이콘 --->
            <q-icon name="mdi-bookmark" :style="{ color: item.color }"></q-icon>
            <!-- 이름 -->
            <div class="bm-name">{{ item.name }}</div>
            <!-- 수정 /삭제 버튼-->
            <q-space></q-space>
            <q-btn-group>
              <q-btn outline label="수정" color="primary" @click="updateTagClick(item)"></q-btn>
              <q-btn outline label="삭제" class="q-ml-sm" @click="removeTagClick(item)"></q-btn>
            </q-btn-group>
          </q-item>
        </q-list>
      </q-card-section>
      <q-card-actions class="d-footer">
        <q-btn outline icon="mdi-refresh" color="info" label="초기화" @click="initClock" />
        <q-btn outline icon="mdi-close" label="닫기" @click="closeClick" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { Ref, ref, reactive } from 'vue'
// 사용자 다이얼로그 오픈 여부
const isOpen: Ref<boolean> = ref(true)

// 북마크 수정/삭제 리스트
const bookmarks = reactive([
  { id: 1, name: ' 기본 북마크1', color: '#FF3333', isActive: true },
  { id: 2, name: ' 기본 북마크2', color: '#FF9933', isActive: false },
  { id: 3, name: ' 기본 북마크3', color: '#FFFF33', isActive: false },
  { id: 4, name: ' 기본 북마크4', color: '#33FF33', isActive: false },
  { id: 5, name: ' 기본 북마크5', color: '#3399FF', isActive: false },
  { id: 6, name: ' 기본 북마크6', color: '#3333FF', isActive: false },
  { id: 7, name: ' 기본 북마크7', color: '#9933FF', isActive: false }
])

// 기존 코드
/**
 * 북마크 관리 다이얼로그
 *
 */
// import electronApi from '@render/api/electronApi'
// import resultsApi from '@render/api/resultsApi'
// import { openAlert, openConfirm } from '@render/composables/useDialog'
// import { useBookmarkStore } from '@render/stores/bookmarkStore'
// import { maxLengthRule, requiredRule, specialCharRule } from '@render/utils/validationRules'
// import { Bookmark, Tag } from '@share/models'
// import _ from 'lodash'
// import { storeToRefs } from 'pinia'
// import { QColor, QForm, QInput, useDialogPluginComponent, useQuasar } from 'quasar'
// import { Ref, ref } from 'vue'

// const $q = useQuasar()

// const bookmarkStore = useBookmarkStore()
// const { bookmarks } = storeToRefs(bookmarkStore)

// defineEmits([...useDialogPluginComponent.emits])
// const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent()

// // form
// const formRef: Ref<QForm | undefined> = ref()

// // 선택 컬러
// const bookmarkColor: Ref<string> = ref('')

// // 이름 입력
// const bookmarkNameRef: Ref<QInput | null> = ref(null)
// const bookmarkName: Ref<string> = ref('')

// // 수정 북마크
// const updateBookmark: Ref<Bookmark | undefined> = ref()

// /**
//  * 태그 저장 버튼 클릭 시 북마크 태그 정보 저장
//  * 신규/수정 상태를 구분해서 처리
//  *
//  */
// async function saveTagClick(): Promise<void> {
//   // 입력폼 검증
//   if (!(await validateForm())) {
//     return
//   }

//   // 입력태그 정보
//   const tagObj: Tag = {
//     id: updateBookmark.value?.id || 0,
//     name: bookmarkName.value || '',
//     color: bookmarkColor.value || ''
//   }

//   try {
//     $q.loading.show()
//     if (x.value) {
//       // 북마크 태그 수정 및 북마크 목록 변경
//       await resultsApi.updateTag(tagObj)
//       bookmarkStore.updateBookmark(Object.assign(updateBookmark.value, tagObj))
//     } else {
//       // 북마크 태그 추가 및 북마크 목록 변경
//       const tagId = await resultsApi.addTag(tagObj)
//       tagObj.id = tagId
//       bookmarkStore.addBookmarkGroup(Object.assign(tagObj, { count: 0 }))
//     }
//   } catch (err) {
//     // 오류 로그
//     electronApi.logError(err)
//   } finally {
//     $q.loading.hide()
//     // 입력폼 초기화
//     reset()
//   }
// }

// /**
//  * 태그 수정 버튼 클릭 시 북마크 태그 수정 상태로 변경
//  *
//  */
// async function updateTagClick(item: Bookmark): Promise<void> {
//   // 수정 북마크 정보 세팅
//   updateBookmark.value = _.cloneDeep(item)
//   // 입력폼 세팅
//   bookmarkColor.value = updateBookmark.value.color || ''
//   bookmarkName.value = updateBookmark.value.name
// }

// /**
//  * 태그 삭제 버튼 클릭 시 북마크 태그 삭제
//  *
//  * @param item 북마크 정보
//  */
// async function removeTagClick(item: Bookmark): Promise<void> {
//   if (bookmarks.value.length == 1) {
//     await openAlert('북마크 태그는 최소 1개 이상 필요합니다.<br/>삭제하실 수 없습니다.')
//     return
//   }

//   if (item.count) {
//     const confirm = await openConfirm('북마크 태그 삭제 시 북마크 정보도 모두 삭제됩니다.<br/>삭제하시겠습니까?')
//     if (!confirm) {
//       return
//     }
//   }

//   try {
//     $q.loading.show()
//     // 북마크 태그 추가 및 북마크 목록 변경
//     await resultsApi.removeTag(item.id)
//     bookmarkStore.removeBookmark(item)
//   } catch (err) {
//     // 오류 로그
//     electronApi.logError(err)
//   } finally {
//     $q.loading.hide()
//   }
// }

// /**
//  * 입력폼 검증
//  *
//  * @returns 검증결과
//  */
// async function validateForm(): Promise<boolean> {
//   if (!bookmarkColor.value) {
//     await openAlert('북마크 색상을 선택해 주세요.')
//     return false
//   }
//   bookmarkNameRef.value?.validate()
//   return !bookmarkNameRef.value?.hasError
// }

// /**
//  * 입력값 초기화
//  *
//  */
// function reset(): void {
//   bookmarkColor.value = ''
//   bookmarkName.value = ''
//   updateBookmark.value = undefined
//   formRef.value?.reset()
// }

// /**
//  * 닫기 버튼 클릭
//  *
//  */
// function closeClick() {
//   onDialogOK(true)
// }

// /**
//  * 초기화 버튼 클릭
//  *
//  */
// function initClock() {
//   reset()
// }
</script>

<style lang="scss" scoped>
.bm-list {
  .q-item {
    background-color: rgba(#f5faff, 20%);
    padding: 7px 14px 7px 12px;
    .bm-name {
      font-size: 0.9375rem;
      font-weight: 400;
      line-height: 2rem;
      text-align: left;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
      flex-grow: 1;
      padding-right: 0.25rem;
    }
    .q-icon {
      font-size: 1.25rem;
      // padding-top: 0.375rem;
      margin-right: 0.25rem;
    }
  }
}
</style>
