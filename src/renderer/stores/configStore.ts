import type { CategoryObjects } from '@renderer/api/getConfig'
import { getCategoryDataArray } from '@renderer/api/getConfig'
import { defineStore } from 'pinia'
import type { CategoryCountInfo } from '@share/models'

/**
 * @description winart_config.json fetch후 저장
 *
 */

interface SankeyChartDataObj {
  name: string,
  depth1?: string[]
  depth2?: boolean
  origin?: string
}

interface SankeyChartLinkObj {
  source: string,
  target: string,
  value: number
}

interface TreemapChartDataObj {
  id: string;
  name: string;
  value: number;
  children?: TreemapChartDataObj[];
}

export const useConfigStore = defineStore('useConfigStore', {
  state: () => ({
    // 아티팩트 목록 > 사이드 목록 부 배열
    categoryDataArray: [] as CategoryObjects[],
    // 아티팩트 목록 > 사이드 목록 부 > isDefault:true 상태의 grid 환경 별도 캐싱
    categoryDefaultDataArray: [] as CategoryObjects[],
    // 아티팩트 목록 > 선택 된 아티팩트 데이터 오브젝트
    selectedCategoryObject: {} as CategoryObjects,

    // Sankey 차트용 데이터
    sankeyData: [],
    // Sankey 차트용 링크
    sankeyLinks: [],
    // Sankey 클릭 이벤트 데이터
    sankeyClickData: {} as object,
    // Treemap 차트용 데이터
    treemapData: [],

  }),
  getters: {
    category: (state) => state.categoryDataArray,
    defaultCategory: (state) => state.categoryDefaultDataArray,
    selectedCategory: (state) => state.selectedCategoryObject,
    sankeyChartData: (state) => state.sankeyData,
    sankeyChartLink: (state) => state.sankeyLinks,
    treemapChartData: (state) => state.treemapData,
    sankeyClickEvent: (state) => state.sankeyClickData
  },
  actions: {
    /**
     * @description config JSON에서 가져온 카테고리 환경데이터를 저장하고 최초 init에 사용 할 default 데이터를 추출
     */
    setSelectedCategory(category: CategoryObjects): void {
      console.log('config.setSelectedCategory >>> ', category)
      this.selectedCategoryObject = category
    },

    /**
     * @description tableName으로 categoryObject를 찾기 위한
     * @param targetArray
     */
    findCategoryByTableName(tableName: String) {
      for (const category_1 of this.categoryDataArray) {
        if (Array.isArray(category_1.subList) && category_1.subList.length > 0) {
          for (const category_2 of category_1.subList) {
            if (Array.isArray(category_2.subList) && category_2.subList.length > 0) {
              for (const category_3 of category_2.subList) {
                if (category_3.dbQueryTableName !== undefined && category_3.dbQueryTableName === tableName) {
                  return {
                    ...category_3,
                    ...{ Category_1: category_1.name, Category_2: category_2.name, Category_3: category_3.name }
                  }
                }
              }
            }
          }
        }
      }
    },

    /**
     * @description default category 처리를 위한 Iterator
     * @param targetArray
     */
    findDefaultItem(targetArray: CategoryObjects[]): void {
      targetArray.forEach((item) => {
        if (item.isDefault) {
          this.categoryDefaultDataArray.push(item)
          this.selectedCategoryObject = item
          return false
        }
        if (Array.isArray(item.subList) && item.subList.length > 0) {
          this.findDefaultItem(item.subList)
        }
      })
    },
    /**
     * @description category 별 total count 계산을 위한 Iterator
     * @param categoryCount {categoryCount}
     * @param condition {Function}
     */
    getTotalCountFromCategoryInfo(categoryCount: CategoryCountInfo[], condition: Function) {
      return categoryCount.reduce((prev: number, next: CategoryCountInfo): void => {
        if (condition(next)) {
          return prev + next.count
        } else {
          return prev
        }
      }, 0)
    },
    /**
     * @description config JSON에서 가져온 카테고리 환경데이터를 저장하고 최초 init에 사용 할 default 데이터를 추출
     */
    async setCategory(): Promise<void> {
      try {
        const config: CategoryObjects[] = await getCategoryDataArray()

        this.categoryDataArray = [...config]
        this.findDefaultItem(config)

        console.debug('******* Fetched winart_config.json ******', {
          category: this.categoryDataArray,
          default: this.categoryDefaultDataArray
        })
      } catch (error) {
        console.debug('Failed to fetch winart_config.json : ', error)
      }
    },
    async setCounts(categoryCount: CategoryCountInfo[]): Promise<void> {
      try {
        console.log('categoryCount >>> : ', categoryCount)

        let minCount = null,
          maxCount = 0

        if (this.categoryDataArray.length > 0 && categoryCount.length > 0) {
          for (const category: CategoryObjects of this.categoryDataArray) {
            category.count = this.getTotalCountFromCategoryInfo(
              categoryCount,
              (next: CategoryCountInfo): boolean => next.category_1 === category.name
            )

            if (Array.isArray(category.subList) && category.subList.length > 0) {
              for (const depth1_Category: CategoryObjects of category.subList) {
                depth1_Category.count = this.getTotalCountFromCategoryInfo(
                  categoryCount,
                  (next: CategoryCountInfo): boolean =>
                    next.category_1 === category.name && next.category_2 === depth1_Category.name
                )

                if (Array.isArray(depth1_Category.subList) && depth1_Category.subList.length > 0) {
                  for (const depth2_Category: CategoryObjects of depth1_Category.subList) {
                    depth2_Category.count = this.getTotalCountFromCategoryInfo(
                      categoryCount,
                      (next: CategoryCountInfo): boolean =>
                        next.category_1 === category.name &&
                        next.category_2 === depth1_Category.name &&
                        next.category_3 === depth2_Category.name
                    )
                  }
                }
                if (depth1_Category.count > 0) {
                  maxCount = depth1_Category.count > maxCount ? depth1_Category.count : maxCount
                  if (minCount === null) {
                    minCount = maxCount
                  } else {
                    minCount = depth1_Category.count < minCount ? depth1_Category.count : minCount
                  }
                }
              }
            }
          }

          // Sankey, Treemap 차트 state 초기화
          this.sankeyData = []
          this.sankeyLinks = []
          this.treemapData = []

          if (Array.isArray(this.categoryDataArray) && this.categoryDataArray.length > 0) {
            // Sankey chart 용 데이터 가공
            const sankeyDataList: SankeyChartDataObj[] = []
            let dataObj: SankeyChartDataObj
            for (const category_1 of this.categoryDataArray) {
              if (Number(category_1.count) !==0) {
                dataObj = {name: category_1.label}
                sankeyDataList.push(dataObj)
              }
              if (Array.isArray(category_1.subList)) {
                for (const category_2 of category_1.subList) {
                  if (Number(category_2.count) !== 0) {
                    let dept1arr = new Array
                    dept1arr.push(category_1.label)
                    dataObj = {name: category_2.label, depth1: dept1arr, depth2: true, origin: category_1.label}
                    sankeyDataList.push(dataObj)
                    let linkObj: SankeyChartLinkObj = {source: category_1.label, target: category_2.label, value: 1}
                    this.sankeyLinks.push(linkObj)
                  }
                }
              }
            }
            this.sankeyData = sankeyDataList.reduce((acc: SankeyChartDataObj[], curr) => {
              const idx = acc.findIndex((obj) => obj['name'] === curr['name']);
                if (idx === -1) {
                  acc.push(curr);
                } else {
                  let origin = curr['origin']
                  acc[idx]['depth1']?.push(origin as string)
                }
                return acc;
            }, []);

            // treemap chart 용 데이터 가공
            for (const category_1 of this.categoryDataArray) {
              let dataObj:TreemapChartDataObj 
              if (Array.isArray(category_1.subList)) {
                dataObj = {id: category_1.label, name: category_1.label, value: category_1.count, children: []}
                for (const category_2 of category_1.subList) {
                  let childObj:TreemapChartDataObj = {id: category_1.label + '_' + category_2.label, name: category_2.label, value: category_2.count, children: []}
                  dataObj.children?.push(childObj)
                  for (const category_3 of category_2.subList) {
                    let grnChildObj:TreemapChartDataObj = {id: category_1.label + '_' + category_2.label + '_' + category_3.label, name: category_3.label, value: category_3.count}
                    childObj.children?.push(grnChildObj)
                  }
                }
              } else {
                dataObj = {name: category_1.label, value: category_1.count}
              }
              this.treemapData.push(dataObj)  
            }
            console.log('this.treemapData >> ', this.treemapData)
          }
        } else {
          console.debug('Failed to set Counts at winart_config.json : NO_DATA')
        }
      } catch (error) {
        console.debug('Failed to set Counts at winart_config.json : ', error)
      }
    },
    // depth2 라벨명 기준 object 생성
    findCategoryBydepth2Name(value: string) {
      for (const category_1 of this.categoryDataArray) {
        if (Array.isArray(category_1.subList) && category_1.subList.length > 0) {
          for (const category_2 of category_1.subList) {
            if (Array.isArray(category_2.subList) && category_2.subList.length > 0 && category_2.label == value) {
              for (const category_3 of category_2.subList) {
                if (category_3.dbQueryTableName !== undefined && category_3.count > 0) {
                  return {
                    ...category_3,
                    ...{ Category_1: category_1.name, Category_2: category_2.name, Category_3: category_3.name }
                  }
                }
              }
            }
          }
        }
      }
    },
    // sankey 클릭 이벤트 params 선언
    sankeyClickLabel(params: object): void {
      console.log('sankeyClickLabel >>> ' + params)
      this.sankeyClickData = params
    }
  }
})
