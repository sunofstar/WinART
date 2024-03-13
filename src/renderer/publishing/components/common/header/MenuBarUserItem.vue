<template>
  <!-- 사용자 이름 표시 -->
  <q-btn flat icon="mdi-account-outline" :label="userName">
    <!-- 사용자 정보 다이얼로그  -->
    <q-popup-proxy
      ref="userDialogRef"
      v-model="isOpen"
      transition-show="jump-down"
      transition-hide="jump-up"
      anchor="bottom middle"
      self="top middle"
      class="pop-user-info"
    >
      <q-banner rounded dark>
        <template #avatar>
          <div class="layer-header bg-spo">
            <h1>사용자 정보</h1>
            <q-btn v-close-popup flat icon="mdi-close" class="btn-pop-close" title="닫기"></q-btn>
          </div>
        </template>
        <table class="tbl-data">
          <colgroup>
            <col width="20%" />
            <col width="*" />
          </colgroup>
          <tbody>
            <tr>
              <th>기관</th>
              <td>{{ user?.office }}</td>
            </tr>
            <tr>
              <th>부서</th>
              <td>{{ user?.department }}</td>
            </tr>
            <tr>
              <th>이름</th>
              <td>{{ user?.name }}</td>
            </tr>
            <tr>
              <th>직급</th>
              <td>{{ user?.rank }}</td>
            </tr>
          </tbody>
        </table>
      </q-banner>
    </q-popup-proxy>
  </q-btn>
</template>

<script setup lang="ts">
/**
 * 메뉴바 사용자 정보 항목
 *
 */
import { useUserStore } from '@renderer/stores/userStore'
import { storeToRefs } from 'pinia'
import { computed, ComputedRef, Ref, ref } from 'vue'

const { user } = storeToRefs(useUserStore())

// 사용자 다이얼로그 오픈 여부
const isOpen: Ref<boolean> = ref(false)

// 사용자 이름
const userName = ref('USERID01')
// const userName: ComputedRef<string | undefined> = computed((): string | undefined => {
//   if (user.value?.rank) {
//     return `${user.value.rank} ${user.value.name}`
//   } else {
//     return user.value?.name || user.value?.id || ''
//   }
// })
</script>

<style scoped></style>
