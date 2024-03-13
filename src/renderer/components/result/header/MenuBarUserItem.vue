<script setup lang="ts">
import { useUserStore } from '@renderer/stores/userStore'
import { Ref, ref } from 'vue'

const isOpen: Ref<boolean> = ref(false)
const userStore = useUserStore()
</script>

<template>
  <!-- 사용자 이름 표시 -->
  <q-btn flat icon="mdi-account-outline" :label="userStore?.user?.id" class="line-division">
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
      <q-banner rounded>
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
              <td>{{ userStore?.user?.office }}</td>
            </tr>
            <tr>
              <th>부서</th>
              <td>{{ userStore?.user?.department }}</td>
            </tr>
            <tr>
              <th>이름</th>
              <td>{{ userStore?.user?.name }}</td>
            </tr>
            <tr>
              <th>직급</th>
              <td>{{ userStore?.user?.rank }}</td>
            </tr>
          </tbody>
        </table>
      </q-banner>
    </q-popup-proxy>
  </q-btn>
</template>

<style scoped lang="scss">
.q-banner :deep {
  .layer-header {
    h1 {
      color: #ffffff;
    }
    .q-btn {
      .q-icon {
        color: #ffffff;
      }
    }
  }
}
.bg-spo {
  background: linear-gradient( 45deg, rgba(20, 215, 200, 0.6) 0%, rgba(0, 220, 255, 0.3) 100%) !important;
}
.line-division {
  &::after {
    content: '';
    display: inline-block;
    width: 1px;
    height: 0.75rem;
    background-color: rgba(255, 255, 255, 30%);
    position: absolute;
    right: 0;
    top: calc(50% - 6px);
  }
}

.body--light {
  .line-division {
    &::after {
      background-color: rgba($light-border, 100%);
    }
  }
  .q-banner :deep {
    color: $light-color;
    .tbl-data {
      th {
        background-color: $light-table;
        border-color: $light-border;
      }
      td {
        border-color: $light-border;
      }
    }
  }
  .bg-spo {
    background: $light-secondary !important;
  }
}
</style>
