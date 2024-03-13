<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card>
      <q-card-section class="d-container text-negative" v-html="message"></q-card-section>
      <q-card-actions class="d-footer">
        <q-btn color="info" outline icon="mdi-check" label="확인" @click="okClick" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
/**
 * Error Dialog
 *
 */
import { toRefs } from 'vue'
import { useDialogPluginComponent } from 'quasar'
import { useRouter } from 'vue-router'

// props
interface Props {
  message: string
  url?: string
}
const props = withDefaults(defineProps<Props>(), {
  message: '',
  url: ''
})
const { message, url } = toRefs(props)

const router = useRouter()

defineEmits([...useDialogPluginComponent.emits])
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent()

/**
 * 확인 버튼 클릭
 *
 */
function okClick() {
  if (url.value) {
    // 화면 이동
    router.push(url.value)
  }
  onDialogOK()
}
</script>
