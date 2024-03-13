<route>{ meta: { disallowAuthed: true} }</route>

<!-- 팝업 형식으로 변경될 예정 (삭제 예정) -->
<template>
    <ArtiTabs/>
    <div class="chartlayout-wrap column">
        <div class="top row items-center">
            <q-select
                v-model="chart"
                outlined
                dense
                :options="chartArr"
            ></q-select>
        </div>
        <div class="main">
            <q-card class="chart">
                <q-card-section>
                    <Gchart type="Sankey" />
                </q-card-section>
            </q-card>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, Ref } from 'vue'
import ArtiTabs from '@renderer/publishing/components/common/header/ArtiTabs.vue'
import Gchart from '@renderer/publishing/SankeyChart'

const chartArr = ['Sankey 다이어그램', 'Treemap']
const chart = ref('Sankey 다이어그램')
</script>

<style scoped lang="scss">

.chartlayout-wrap :deep {
    height: calc(100% - 5.625rem);
    .top {
        height: 3.75rem;
        padding: 0px 1.25rem;
        border-bottom: 1px solid #0A141E;
        .q-select {
            width: 10.875rem;
            .q-field__inner {
                &__control{
                    &__native  {
                        span {
                            font-size: 0.9375rem;
                        }
                    }
                }
            }
        }
    }
    .main {
        height: calc(100% - 3.75rem);
        width: 100%;
        display: flex;
        justify-content: center;
        padding: 1.5rem 3.75rem 3.875rem;
        .chart {
            width: 100%;
            background-color: #1E2022;
            border: 1px solid #56585a;
            display: flex;
            justify-content: center;
            align-items: center;
            box-shadow: none;
        }
    }
}
</style>