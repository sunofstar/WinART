<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card>
      <q-card-section class="d-container" v-html="message"></q-card-section>
      <q-card-actions class="d-footer">
        <q-btn color="info" outline icon="mdi-check" label="확인" autofocus @click="okClick" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
/**
 * Alert Dialog
 *
 */
import { toRefs } from 'vue'
import { useDialogPluginComponent } from 'quasar'

// props
interface Props {
  message: string
}
const props = withDefaults(defineProps<Props>(), {
  message: ''
})
const { message } = toRefs(props)

defineEmits([...useDialogPluginComponent.emits])
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent()

/**
 * 확인 버튼 클릭
 *
 */
function okClick() {
  onDialogOK(true)
}
</script>
