<template>
  <q-select v-model="selected" outlined dense option-value="id" option-label="name" :options="tags">
    <template #selected>
      <q-item class="top-bookmark-select">
        <q-item-section>
          <q-item-label>
            <q-icon name="mdi-bookmark" :style="{ color: selected?.color }"></q-icon>
            {{ selected?.name ? selected?.name : '기본북마크1' }}
          </q-item-label>
        </q-item-section>
      </q-item>
    </template>
    <template #option="scope">
      <q-item v-bind="scope.itemProps" class="top-bookmark-opt">
        <q-item-section>
          <q-item-label>
            <q-icon name="mdi-bookmark" :style="{ color: scope.opt.color }"></q-icon>
            {{ scope.opt.name }}
          </q-item-label>
        </q-item-section>
      </q-item>
    </template>
  </q-select>
</template>

<script setup lang="ts">
/***
 * 메뉴바 북마크 항목
 *
 */
import { Tag } from '@share/models'
import { reactive, Ref, ref, watchEffect } from 'vue'

// 태그 목록
const tags: Tag[] = reactive([
  { id: 1, name: ' 기본 북마크1', color: '#FF3333' },
  { id: 2, name: ' 기본 북마크2', color: '#FF9933' },
  { id: 3, name: ' 기본 북마크3', color: '#FFFF33' },
  { id: 4, name: ' 기본 북마크4', color: '#33FF33' },
  { id: 5, name: ' 기본 북마크5', color: '#3399FF' },
  { id: 6, name: ' 기본 북마크6', color: '#3333FF' },
  { id: 7, name: ' 기본 북마크7', color: '#9933FF' }
])
// 태그 선택값
const selected: Ref<Tag | undefined> = ref({ id: 1, name: '기본 북마크1', color: '#FF3333' },)
</script>

<style scoped lang="scss">
.q-select {
  width: 16rem;
  font-size: 0.9375rem;
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
