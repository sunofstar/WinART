<script setup lang="ts">
/**********************************************
 *
 * 차트 Dialog
 *
 **********************************************/

/**********************************************
 * @description Import
 */
import { ref, Ref, computed, onMounted, onBeforeMount, provide, watch, onBeforeUpdate, onUpdated } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { SankeyChart, TreemapChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import VChart, { THEME_KEY } from 'vue-echarts'
import { useConfigStore } from '@renderer/stores/configStore'
import { useQuasar } from 'quasar'

use([CanvasRenderer, SankeyChart, TreemapChart, TitleComponent, TooltipComponent, LegendComponent])

// provide(THEME_KEY, 'dark')

const config = useConfigStore()
const $q = useQuasar()
/**********************************************
 * @description Define Props
 */
const emit = defineEmits(['update:isShow'])
const props = defineProps(['isShow'])
const isShow = computed({
  get() {
    return props.isShow
  },
  set(value) {
    emit('update:isShow', value)
  }
})

const chartArr = ['Sankey 다이어그램', 'Treemap']
const chart: Ref<string> = ref('Sankey 다이어그램')

const showChartDialog = async (): Promise<void> => {}
onBeforeMount((): void => {})
let sankeyData = config.sankeyChartData
let sankeyLink = config.sankeyChartLink
let treemapData = config.treemapData
const treemapOverview: Ref<object[]> = ref([])

onMounted(() : void => {
  treemapOverview.value = config.treemapData
})

onBeforeUpdate(() : void => {
  treemapOverview.value = config.treemapData
  if ($q.dark.isActive) {
    Sankeyoption.value.series.label.color = 'white'
    Treemapoption.value.series.breadcrumb.itemStyle.color = 'white'
    Treemapoption.value.series.breadcrumb.itemStyle.textStyle.color = 'black'
  } else {
    Sankeyoption.value.series.label.color = 'black'
    Treemapoption.value.series.breadcrumb.itemStyle.color = 'black'
    Treemapoption.value.series.breadcrumb.itemStyle.textStyle.color = 'white'
  }
})

const Sankeyoption = ref({
  // color: [
  // '#63A0FE',
  // '#DB4437',
  // '#F4B400',
  // '#F7C846',
  // '#DC5B8D',
  // '#33AB71',
  // '#B762C6',
  // '#8994D1',
  // '#F58DB0',
  // '#FF7043',
  // '#FF9777',
  // '#FF3FBF',
  // '#17C6DB'
  // ],
  // tooltip: {
  //   trigger: 'item',
  //   triggerOn: 'mousemove'
  // },
  nodeWidth: 40,
  series: {
    type: 'sankey',
    data: sankeyData,
    links: sankeyLink,
    right: '10%',
    draggable: false,
    label: {
      fontWeight: 'normal',
      fontSize: 15,
      color: 'white'
    },
    layoutIterations: 0,
    // emphasis: {
    //   focus: 'adjacency'
    // },
    lineStyle: {
      color: 'gradient',
      opacity: 0.7,
      curveness: 0.2
    }
  }
})

const Treemapoption = ref({
  tooltip: {
    trigger: 'item',
    triggerOn: 'mousemove'
  },
  series: {
    type: 'treemap',
    name: 'Category',
    data: treemapData,
    leafDepth: 1,
    width: '80%',
    height: '80%',
    // bottom: '15%',
    // roam: 'scale',
    label: {
      show: true,
      formatter: function (params) {
        let categoryCount = params.value
        let labelName = `${params.name}(${categoryCount.toLocaleString()})`
        return labelName
      }
    },
    labelLayout: function (params) {
      if (params.dataType == undefined) {
        return
      }
      if (params.rect.width < 5 || params.rect.height < 5) {
        return { fontSize: 0 }
      }
      return {
        fontSize: Math.min(Math.sqrt(params.rect.width * params.rect.height) / 10, 20)
      }
    },
    breadcrumb: {
      itemStyle: {
        color: 'white',
        textStyle: {
          color: 'black',
          fontWeight: 'bold',
          fontSize: 15
        }
      },
      emphasis: {
        itemStyle: {
          color: 'rgba(20, 215, 200, 0.8)',
        }
      }
    },
    levels: [
      {
        itemStyle: {
          borderColor: '#555',
          gapWidth: 1
        }
      },
      {
        colorSaturation: [0.3, 0.6],
        itemStyle: {
          borderColor: '#555',
          borderColorSaturation: 0.7,
          gapWidth: 1
        }
      },
      {
        colorSaturation: [0.3, 0.5],
        itemStyle: {
          borderColor: '#555',
          borderColorSaturation: 0.6,
          gapWidth: 1
        }
      },
      {
        colorSaturation: [0.3, 0.5]
      }
    ]
  }
})

// sankey 클릭 이벤트
function sankeyClickEvent(params) {
  if(params.data.depth2) {
    const category = config.findCategoryBydepth2Name(params.data.name)
    config.sankeyClickLabel(category)
    emit('update:isShow', false)
  }
}

function treemapClickEvent(params) {
  if (params.selfType == 'breadcrumb') {
    if (params.nodeData.name == 'Category') {
      treemapOverview.value = treemapData
    } else {
      let dataId = ''
      for (let index = 1; index <= params.treePathInfo.length - 1; index++) {
        if(dataId) {
          dataId += '_' + params.treePathInfo[index].name
        } else {
          dataId = params.treePathInfo[index].name
        }
      }
      treemapOverview.value = findNodeData(treemapData, dataId)

      dataId = ''
    }
  } else {
    if (params.data.children) {
      treemapOverview.value = params.data.children
    } else {
      [{name: params.data['name'], value: params.data['value']}]
    }
  }
}

function findNodeData(nodeData, id){
  for (const depth1 of nodeData) {
    if (depth1['id'] == id) {
      return depth1['children']
    } else {
      for (const depth2 of depth1['children']) {
        if (depth2['id'] == id) {
          return depth2['children']
        } else {
          for (const depth3 of depth2['children']) {
            if (depth3['id'] == id) {
              return [{name: depth3['name'], value: depth3['value']}]
            }
          }
        }
      }
    }
  }
}

</script>

<template>
  <q-dialog v-model="isShow" @show="showChartDialog">
    <q-card class="q-dialog-plugin pop-default chart-dialog-wrap">
      <!-- 헤더 -->
      <q-card-section class="d-header row items-center">
        <h1>아티팩트차트</h1>
        <q-select v-model="chart" outlined dense :options="chartArr"></q-select>
        <q-space></q-space>
        <q-btn v-close-popup icon="close" flat dense @click="isShow = false" />
      </q-card-section>
      <!-- 본문 -->
      <q-card-section class="d-container">
        <q-card class="chart-bg">
          <q-card-section v-show="chart === 'Sankey 다이어그램'">
            <v-chart class="chart" :option="Sankeyoption" autoresize @click="sankeyClickEvent" />
          </q-card-section>
          <q-card-section v-show="chart === 'Treemap'">
            <v-chart class="chart" :option="Treemapoption" autoresize @click="treemapClickEvent"/>
          </q-card-section>
        </q-card>
      </q-card-section>
      <q-card-section v-show="chart === 'Treemap'" class="tree-overview">
        <ul>
          <template v-model="treemapOverview" v-for="(item, index) in treemapOverview" :key="index">
            <li class="title">{{ item.name }}</li>
            <li>{{ item.value.toLocaleString() }}</li>
          </template>
        </ul>
        <!-- <table class="tbl-data" >
          <colgroup>
            <col v-for="(col, index) in treemapOverview" :key="index">
          </colgroup>
          <tbody class="text-center">
            <tr>
              <template v-model="treemapOverview" v-for="(item, index) in treemapOverview" :key="index">
                <th>{{ item.name }}</th>
                <td>{{ item.value }}</td>
              </template>
            </tr>
          </tbody>
        </table> -->
      </q-card-section>
      <q-card-actions class="d-footer">
        <q-btn outline icon="mdi-close" label="닫기" @click="isShow = false" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">
.chart-dialog-wrap :deep {
  overflow: scroll;
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
    // 트리맵 오버뷰 스타일링
    .tree-overview {
      ul {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        margin: 0px 1rem;
        padding: 0px;
        li {
          flex: 0;
          min-width: 10%;
          display: inline-block;
          flex-wrap: wrap;
          padding: 0.375rem 0.5rem;
          border: 1px solid rgba(#f5faff, 10%);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          &.title {
            background-color: rgba(245, 250, 255, 0.2);
          }
        }
        li:nth-child(n+11){
          border-top: 1px solid transparent;
        }
      }
    }
  }
}
// 화이트모드
.body--light {
  .chart-dialog-wrap :deep {
    &.pop-default {
      .chart-bg {
        background-color: #ffffff;
        border-color: $light-border;
        text {
          fill: $light-color;
        }
      }
      // 트리맵 하단 오버뷰
      .tree-overview {
        ul {
          border-top: 1px solid $light-border;
          border-left: 1px solid $light-border;
          li {
            background-color: #ffffff;
            border-right: 1px solid $light-border;
            border-bottom: 1px solid $light-border;
            &.title {
              background-color: $light-table;
            }
          }
        }
      }
    }
  }
}
</style>
