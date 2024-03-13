import { defineComponent, h } from "vue";

import { GChart } from "vue-google-charts";

export const type = "TreeMap";

export const data = [
    ['Location', 'Parent', 'Market trade volume (size)', 'Market increase/decrease (color)'],
    // 처음화면 Global
    ['Global', null, null, 0],

    // 1 Depth
    /*['amcache', 'Global', null, 0],*/
    ['Registry', 'Global', 0, 0],
    ['FileSystem', 'Global', 0, 0],
    ['EventLogs', 'Global', 0, 0],
    ['FileFolderAccess', 'Global', 0, 0],
    ['ProgramExecution', 'Global', 0, 0],
    ['FileDeletion', 'Global', 0, 0],
    ['SRUMDatabase', 'Global', 0, 0],
    ['BrowsingHistory', 'Global', 0, 0],

                  // 2~3 Depth
        // amcache
        // Registry
        ['System Information', 'Registry', 0, 0],
        ['프로그램 실행', 'Registry', 0, 0],
        ['UserAssist', '프로그램 실행', 30, 0],
        ['BamDam', '프로그램 실행', 0, 0],
        ['사용자 계정', 'Registry', 0, 0],
        ['Timezone', 'Registry', 0, 0],
        ['장치 흔적', 'Registry', 0, 0],
        ['USB__WinArtifacts', '장치 흔적', 0, 0],
        ['USBSTOR__WinArtifacts', '장치 흔적', 0, 0],
        ['SCSI__Windows', '장치 흔적', 0, 0],
        ['DeviceClasses', '장치 흔적', 0, 0],
        ['파일 폴더 접근', 'Registry', 0, 0],
        ['RecentDocs', '파일 폴더 접근', 0, 0],
        ['OpenSavePidlMRU', '파일 폴더 접근', 0, 0],
        ['LastVisitedPidlMRU', '파일 폴더 접근', 0, 0],
        ['네트워크', 'Registry', 0, 0],
        ['입력 또는 검색', 'Registry', 0, 0],
        ['설치목록', 'Registry', 0, 0],
    
        // FileSystem
        ['$MFT', 'FileSystem', 30, 0],
        ['$LogFile', 'FileSystem', 0, 0],
        ['$J', 'FileSystem', 0, 0],
    
        // EventLogs
        ['이벤트로그', 'EventLogs', 30, 0],

        // FileFolderAccess
        ['점프리스트', 'FileFolderAccess', 0, 0],
        ['AutomaticDestinations', '점프리스트', 30, 0],
        ['CustomDestinations', '점프리스트', 0, 0],
        ['링크파일', 'FileFolderAccess', 0, 0],
        ['Shellbag', 'FileFolderAccess', 0, 0],
        ['NTUSER', 'Shellbag', 0, 0],
        ['usrClass', 'Shellbag', 0, 0],
        ['윈도우타임라인', 'FileFolderAccess', 0, 0],
        ['Activity', '윈도우타임라인', 0, 0],

        // ProgramExecution
        ['Prefetch', 'ProgramExecution', 0, 0],
        ['PECmd_Output', 'Prefetch', 30, 0],
        ['PECmd_Timeline', 'Prefetch', 0, 0],

        // FileDeletion          
        ['휴지통', 'FileDeletion', 30, 0],

        // SRUMDatabase
        [' 프로그램 실행', 'SRUMDatabase', 0, 0],
        [' 네트워크', 'SRUMDatabase', 0, 0],
        ['NetworkConnection', ' 네트워크', 30, 0],
        ['NetworkUsages', ' 네트워크', 0, 0],

        // BrowsingHistory
        ['웹기록', 'BrowsingHistory', 0, 0],
        [' BrowsingHistory', '웹기록', 30, 0], 
];

export const options = {
  minColor: '#7ECB00',
  midColor: '#31BCC9',
  maxColor: '#3C65F5',
  headerHeight: 0,
  fontColor: 'white',
  fontSize: '15',
  borderColor: '#1e2022',
  showScale: false,
  eventsConfig: {
      highlight: ['mouseover'],
      unhighlight: ['mouseout'],
      rollup: ['contextmenu'], // right-click
      drilldown: ['click']
  },
  useWeightedAverageForAggregation: true,
};

export default defineComponent({
  name: "TreemapChart",
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
          packages: ["treemap"]
        },
        chartEvents: {
          select: () => {
          },
        },
      });
  }
});