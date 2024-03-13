<template>
  <!-- 북마크 상태에 따른 아이콘 변경, 현재 선택 태그 컬러 적용 -->
  <q-icon :name="iconName" size="sm" :style="{ color: color }"></q-icon>
</template>

<script setup lang="ts">
/**
 * 전체 북마크 컴포넌트
 *
 */

import { ref } from 'vue'

// 북마크 상태에 따른 아이콘
const iconName = ref('mdi-bookmark-outline')
const color = ref('#FF3333')
</script>

<style scoped>
</style>
