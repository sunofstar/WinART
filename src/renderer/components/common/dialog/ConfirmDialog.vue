<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card>
      <q-card-section class="d-container">
        <span v-html="message"></span>
      </q-card-section>
      <q-card-actions class="d-footer">
        <q-btn icon="mdi-close" outline label="취소" @click="onDialogCancel" />
        <q-btn icon="mdi-check" outline class="q-ml-sm" color="info" label="확인" @click="onDialogOK" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
/**
 * Confirm Dialog
 *
 */
import { useDialogPluginComponent } from 'quasar'
import { toRefs } from 'vue'

// props
interface Props {
  message: string
}
const props = withDefaults(defineProps<Props>(), {
  message: ''
})
const { message } = toRefs(props)

defineEmits([...useDialogPluginComponent.emits])
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()
</script>
