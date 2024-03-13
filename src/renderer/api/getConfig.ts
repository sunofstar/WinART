/**
 * @author : 박춘기
 * @description : 루트 내 winart_config.json을 참조 하여 사전정의 된 데이터를 로드
 */
import { QTableColumn } from 'quasar'
import { KAPE_OP_CHANNELS } from '../../shared/constants'

interface CategoryObjects {
  isDefault: boolean
  name: string
  label: string
  count: number
  bookmarkCount: number
  isOpen: boolean
  dbQueryTableName: string
  subList: CategoryObjects[]
  columnDef: QTableColumn[]
  detailInfoColumnDef: {
    label: string
    field: string
    visible: boolean
  }[]
  isShow: boolean
}

const getConfig = async (): Promise<void> => {
  try {
    // const app = require('electron').remote.app
    // const response = await fetch(`${app.getAppPath()}/resources/winart_config.json`)
    if (ipcRenderer !== undefined) {
      const configJsonData = await ipcRenderer.invoke(KAPE_OP_CHANNELS.readWinARTTableConfig)
      return configJsonData
    } else {
      console.error('루트 디렉토리에서 winart_config.json 파일을 처리할 수 없습니다.')
    }
  } catch (error) {
    console.error('루트 디렉토리에서 winart_config.json 파일을 처리할 수 없습니다:', error)
  }
}

const getCategoryDataArray = async (): Promise<any[]> => {
  try {
    const configJsonData = await getConfig()
    const artifactsCategory = configJsonData['artifacts_category'] ?? []
    const commonColumnDefine = configJsonData['common_column_define'] ?? []

    for (const categorys of artifactsCategory)
      for (const sub_1 of categorys.subList) {
        for (const sub_2 of sub_1.subList ?? []) {
          if (sub_2.columnDef) {
            // 모든 columnDef 객체에 hearderStyle 속성 추가
            sub_2.columnDef.forEach((column: any) => {
              column.headerStyle = 'width: 200px'
            })
            // a_id와 카테고리_1, 카테고리_2, 카테고리_3 공통 컬럼 맨 앞과 맨 끝에 추가
            const copiedCommonColumnDefine = [...commonColumnDefine]
            sub_2.columnDef.unshift(copiedCommonColumnDefine[0])
            sub_2.columnDef.push(...copiedCommonColumnDefine.slice(1))
          } else {
            console.warn('subList.columnDef이 정의되어 있지 않거나 값이 null입니다:', sub_2)
          }
        }
      }
    return artifactsCategory
  } catch (error) {
    console.error('환경파일에서 아티팩트 카데고리 데이터를 가져오는데 실패했습니다:', error)
    throw error // 오류를 다시 던져서 상위 코드에서 처리할 수 있도록 합니다.
  }
}

export { getCategoryDataArray, CategoryObjects }
