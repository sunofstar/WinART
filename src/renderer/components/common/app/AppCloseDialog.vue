<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="width: 300px">
      <q-card-section class="d-header">
        <h1 class="text-warning">
          <q-icon name="mdi-alert-circle-outline"></q-icon>
          프로그램 종료
        </h1>
      </q-card-section>
      <q-card-section class="d-container">
        <h4>프로그램을 종료하시겠습니까?</h4>
      </q-card-section>
      <q-card-actions class="d-footer">
        <q-btn outline icon="mdi-close" label="취소" @click="onDialogCancel" />
        <q-btn outline color="info" icon="mdi-check" label="확인" @click="okClick" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
/**
 * 프로그램 종료 다이얼로그 *
 **/
import { useDialogPluginComponent } from 'quasar'

defineEmits([...useDialogPluginComponent.emits])
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()

/**
 * 확인 버튼 클릭 *
 **/
function okClick(): void {
  onDialogOK(true)
}
</script>

<style scoped></style>
