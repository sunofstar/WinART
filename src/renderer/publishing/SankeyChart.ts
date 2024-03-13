// 임의로 만든 샘플 차트입니다. 보고 삭제하셔도되요!!

import { defineComponent, h } from 'vue'

import { GChart } from 'vue-google-charts'

const type = 'Sankey'

const data = [
  ['From', 'To', 'Weight'],
  ['registry', '이벤트로그', 1],
  ['FileSystem', '휴지통', 1],
  ['FileSystem', '웹기록', 1],
  ['EventLogs', '이벤트로그', 1],
  ['EventLogs', '점프리스트', 1],
  ['EventLogs', '링크파일', 1],
  ['EventLogs', '웹기록', 1],
  ['EventLogs', '휴지통', 1],
  ['EventLogs', '윈도우타임라인', 1],
  ['EventLogs', 'amcache', 1],
  ['FileFolderAccess', 'Prefetch', 1],
  ['FileFolderAccess', '웹기록', 1],
  ['FileFolderAccess', '링크파일', 1],
  ['FileFolderAccess', '점프리스트', 1],
  ['ProgramExecution', '이벤트로그', 1],
  ['ProgramExecution', '휴지통', 1],
  ['ProgramExecution', '$MFT', 1],
  ['ProgramExecution', '링크파일', 1],
  ['ProgramExecution', '$LogFile', 1],
  ['ProgramExecution', '윈도우타임라인', 1],
  ['ProgramExecution', '$J', 1],
  ['ProgramExecution', 'SystemInformation', 1],
  ['ProgramExecution', 'Prefetch', 1],
  ['ProgramExecution', 'USB흔적', 1],
  ['ProgramExecution', '사용자계정', 1],
  ['FileDeletion', '휴지통', 1],
  ['FileDeletion', '윈도우타임라인', 1],
  ['SRUMDatabase', '이벤트로그', 1],
  ['SRUMDatabase', 'SystemInformation', 1],
  ['SRUMDatabase', 'ProgramExecution1', 1],
  ['SRUMDatabase', '윈도우타임라인', 1],
  ['SRUMDatabase', '사용자계정', 1],
  ['SRUMDatabase', 'Timezone', 1],
  ['SRUMDatabase', '웹기록', 1],
  ['SRUMDatabase', 'USB흔적', 1],
  ['SRUMDatabase', 'FileFolderAccess1', 1],
  ['SRUMDatabase', '네트워크', 1],
  ['BrowsingHistory', '입력 또는 검색', 1],
  ['BrowsingHistory', '네트워크', 1]
]

const colors = [
  '#63A0FE',
  '#DB4437',
  '#F4B400',
  '#F7C846',
  '#DC5B8D',
  '#33AB71',
  '#B762C6',
  '#8994D1',
  '#F58DB0',
  '#FF7043',
  '#FF9777',
  '#FF3FBF',
  '#17C6DB'
]

const options = {
  width: 1600,
  height: 520,
  sankey: {
    node: {
      colors: colors,
      // colorMode: 'unique',
      // 레이블 스타일 설정
      label: {
        fontName: 'Noto Sans KR',
        fontSize: 10,
        color: '#ffffff',
        bold: true,
        italic: false
      },

      // 레이블과 노드 사이 패딩
      labelPadding: 10,

      // 노드 넓이
      width: 40,

      // 노드 사이의 거리
      nodePadding: 18,

      interactivity: true,

      focus: 'out'
    },

    link: {
      // 연결선 스타일 설정
      colorMode: 'gradient',
      colors: colors,
      color: {
        fillOpacity: 0.8,
      },
    }
  }
}

export default defineComponent({
  name: 'GoogleChart',
  components: {
    GChart
  },
  setup() {
    return () =>
      h(GChart, {
        data,
        options,
        type,
        settings: {
          packages: ['sankey']
        },
        chartEvents: {
          select: () => {
            // options.sankey.link.color.fillOpacity = 1.0
          }
        }
      })
  }
})
