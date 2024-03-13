<script setup lang="ts">
/**********************************************
 *
 * 북마크 콤포넌트
 *
 **********************************************/

/**********************************************
 * @description Import
 */
import { DB_BOOKMARK_INFO_ITEM } from '@share/models'
import { watch, Ref, ref, computed, onMounted } from 'vue'
import { useCaseStore } from '@renderer/stores/caseStore'
import { storeToRefs } from 'pinia'
const caseStore = useCaseStore()
const { currentBookmarkItem, defaultBookmarkItem } = storeToRefs(caseStore)
/**********************************************
 * @description Define variables
 */
// 업데이트 이벤트
const emit = defineEmits<{
  (e: 'update', params: DB_BOOKMARK_INFO_ITEM): void
  (e: 'open:bookmarkDialog'): void
}>()

interface Props {
  bookmarkDataArray: DB_BOOKMARK_INFO_ITEM[] | []
}
const props = withDefaults(defineProps<Props>(), {
  bookmarkDataArray: []
})

const bookmarkList = computed(() => {
  return props.bookmarkDataArray
})
// 북마크 기본값
const defaultBookmark = computed(() => defaultBookmarkItem.value)
// 북마크 선택값
const selected: Ref<DB_BOOKMARK_INFO_ITEM | null> = ref(null)

const initBookmarkData = () => {
  console.log('initBookmarkData 함수 진입')

  if (Array.isArray(props.bookmarkDataArray) && props.bookmarkDataArray.length > 0) {
    if (!selected.value || Object.keys(selected.value).length === 0) {
      // 선택된 북마크가 없음
      // currentBookmarkItem 값이 있으면 selected에 할당
      if (currentBookmarkItem.value) {
        selected.value = currentBookmarkItem.value
        console.log('selected 설정:', currentBookmarkItem.value)
      } else {
        // currentBookmarkItem 값이 없으면 default값 할당
        selected.value = bookmarkList.value[0]
        console.log('currentBookmarkItem을 검색을 위한 defaultBookmark으로 설정:', bookmarkList.value[0])
        caseStore.setCurrentBookmarkItem(bookmarkList.value[0])
      }
    }
    caseStore.setCurrentBookmarkItem(selected.value)
  } else {
    // 값이 없을 경우 초기화
    selected.value = defaultBookmark.value
    console.log('currentBookmarkItem을 defaultBookmarkItem으로 설정:', props.bookmarkDataArray[0])
    caseStore.setCurrentBookmarkItem(defaultBookmark.value)
  }
  console.log('initBookmarkData 함수 종료')
}

onMounted(initBookmarkData)

watch(
  () => selected.value,
  (newSelectedValue) => {
    if (newSelectedValue) {
      caseStore.setCurrentBookmarkItem(newSelectedValue)
    }
  }
)
</script>

<template>
  <q-select
    v-if="bookmarkList.length > 0"
    v-model="selected"
    outlined
    dense
    option-value="id"
    option-label="name"
    :options="bookmarkList"
    @update:model-value="
      (value) => {
        emit('update', value)
      }
    "
  >
    <template #selected>
      <q-item class="top-bookmark-select">
        <q-item-section>
          <q-item-label>
            <q-icon name="mdi-bookmark" :style="{ color: selected?.b_color || defaultBookmarkItem.b_color }"></q-icon>
            {{ selected?.b_name || defaultBookmarkItem.b_name }}
          </q-item-label>
        </q-item-section>
      </q-item>
    </template>
    <template #option="scope">
      <q-item v-bind="scope.itemProps" class="top-bookmark-opt">
        <q-item-section>
          <q-item-label>
            <q-icon name="mdi-bookmark" :style="{ color: scope.opt.b_color }"></q-icon>
            {{ scope.opt.b_name }}
          </q-item-label>
        </q-item-section>
      </q-item>
    </template>
  </q-select>
  <q-select v-else outlined dense>
    <template #selected>
      <q-item class="top-bookmark-select">
        <q-item-section>
          <q-item-label @click="emit('open:bookmarkDialog')">
            <q-icon name="mdi-bookmark"></q-icon>
            존재하는 북마크가 없습니다.
          </q-item-label>
        </q-item-section>
      </q-item>
    </template>
  </q-select>
</template>

<style scoped lang="scss">
.q-select {
  width: 16rem;
  .top-bookmark-select {
    min-height: 0px;
    padding: 0px;
  }
  .q-icon {
    width: 1.25rem;
    height: 1.25rem;
  }
}
</style>
