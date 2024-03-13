<route>{ meta: { disallowAuthed: true} }</route>

<!-- 아티팩트 조회화면 -->
<template>
  <div class="chart-inquiry-wrap">
    <div class="chart-inquiry-top">
      <h2 class="">CASE_NAME</h2>
      <q-space></q-space>
      <!-- 북마크 -->
      <BookmarkItem />
    </div>

    <div class="chart-inquiry-bot">
      <!-- 왼쪽 사이드바 -->
      <ArtiLists />
      <!-- 메인영역(테이블) -->
      <ArtiTable />
    </div>
  </div>
</template>

<script setup lang="ts">

import ArtiLists from '@renderer/publishing/components/ArtiLists.vue'
import BookmarkItem from '@renderer/publishing/components/BookmarkItem.vue'
import ArtiTable from '@renderer/publishing/components/ArtiTable.vue'
</script>

<style scoped lang="scss">

.chart-inquiry-wrap {
  height: calc(100% - 5.625rem);
  .chart-inquiry-top {
    display: flex;
    align-items: center;
    padding: 0 20px;
    height: 3.75rem;
  }
  .chart-inquiry-bot {
    display: flex;
    height: calc(100% - 3.75rem);
  }
}
  
</style>
