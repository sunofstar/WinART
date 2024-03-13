<route>{ meta: { disallowAuthed: true} }</route>

<template>
    <q-dialog v-model="isOpen" ref="dialogRef" @hide="onDialogHide" class="">
      <q-card class="q-dialog-plugin pop-default chart-dialog-wrap">
        <!-- 헤더 -->
        <q-card-section class="d-header row items-center">
          <h1>아티팩트차트</h1>
          <q-select
              v-model="chart"
              outlined
              dense
              :options="chartArr"
          ></q-select>
          <q-space></q-space>
          <q-btn icon="close" flat dense v-close-popup></q-btn>
        </q-card-section>
        <!-- 본문 -->
        <q-card-section class="d-container">
          <q-card class="chart-bg">
              <q-card-section>
                  <Gchart type="Sankey" class="chart-layout"/>
              </q-card-section>
          </q-card>
        </q-card-section>
        <q-card-actions class="d-footer">
          <q-btn outline icon="mdi-close" label="닫기" @click="okClick" />
        </q-card-actions>
      </q-card>
    </q-dialog>
</template>
  
  <script setup lang="ts">
import { ref, Ref } from 'vue'

const isOpen: Ref<boolean> = ref(true)

import Gchart from '@renderer/publishing/SankeyChart'

const chartArr = ['Sankey 다이어그램', 'Treemap']
const chart = ref('Sankey 다이어그램')

</script>

<style scoped lang="scss">
.chart-dialog-wrap :deep {
  .d-header {
    .q-field__inner {
      width: 12.5rem;
      margin-left: 1.875rem;
    }
  }
  &.pop-default {
    .d-container {
      padding: 1.875rem;
    }
      .chart-bg {
      width: 100%;
      height: 100%;
      max-height: 100%;
      box-shadow: none;
      background-color: #1e2022;
      border: 1px solid #101214;
      border-radius: 0px;
        .q-card__section {
          height: 100%;
          display: flex;
          align-items: center;
          overflow: auto;
          .chart-layout {
            width: 100%;
            margin: 0 auto;
          }
        }
    }
  }
}

</style>