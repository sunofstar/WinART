<route>{ meta: { disallowAuthed: true} }</route>

<template>
  <!-- 메뉴바 -->
  <div class="content-wrap">
    <arti-tabs></arti-tabs>
    <!-- router -->
    <router-view />
  </div>
</template>

<script setup lang="ts">
/**
 * 화면 기본 레이아웃 (케이스 생성, 탐지 및 획득, 보고서)
 *
 */

import ArtiTabs from '@renderer/publishing/components/common/header/ArtiTabs.vue'
</script>

<style scoped lang="scss">
  .content-wrap {
    height: 100%;
  }
</style>
