<script setup lang="ts">
/**
 * 기간 설정 공통 콤포넌트
 */
import { Ref, ref, computed, toRefs, watch, toRef } from 'vue'
import Datepicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import { ko } from 'date-fns/locale'
import moment from 'moment'
import { Icon } from '@iconify/vue'
import { setDate } from '@renderer/utils/utils'

const emit = defineEmits<{
  (e: 'update:startDate', date): void
  (e: 'update:endDate', date): void
}>()

interface Props {
  startDate: string
  endDate: string
}
const props = withDefaults(defineProps<Props>(), {
  startDate: '',
  endDate: ''
})

const format = (date): any => {
  return moment(date).format('YYYY-MM-DD HH:mm')
  // return setDate(date, 'start')
}

const textInputOptions = {
  format: 'yyyyMMdd HHmm'
}

const inputStartDate: Ref<string> = ref(moment(props.startDate || '00:00', 'HH:mm').format('YYYYMMDD HHmm'))

// const inputEndDate: Ref<string> = ref(
//   moment(props.endDate || moment().endOf('day').format('YYYY-MM-DD 23:59'), 'HH:mm').format('YYYYMMDD HHmm')
// )
// 240227 inputEndDate 초기값 설정 변경**
const inputEndDate: Ref<string> = ref(
  moment(props.endDate || moment().endOf('day').format('YYYY-MM-DD 23:59'), 'YYYY-MM-DD HH:mm').format('YYYYMMDD HHmm')
)

// const inputEndDate: Ref<string> = ref(setDate(props.endDate, 'end'))

// const inputStartMaxDate = computed(() => {
//   return moment(inputEndDate.value, 'YYYYMMDD HHmm').toDate()
// })

watch(
  () => props.startDate,
  (value): void => {
    console.log('watch startDate >>> ' + value)
    if (value == 'Invalid date') {
      inputStartDate.value = ''
    } else {
      inputStartDate.value = value
    }
  }
)

watch(
  () => props.endDate,
  (value): void => {
    console.log('watch endDate >>> ' + value)
    if (value == 'Invalid date') {
      inputEndDate.value = ''
    } else {
      inputEndDate.value = value
    }
  }
)

// const validateDateRange = (): void => {
//   if (moment(inputStartDate.value).isAfter(inputEndDate.value)) {
//     inputStartDate.value = inputEndDate.value
//   }
//   emit('update:startDate', moment(inputStartDate.value).format('YYYY-MM-DD HH:mm'))
//   emit('update:endDate', moment(inputEndDate.value).format('YYYY-MM-DD HH:mm'))
// }

// 240227 validateDateRange 함수 수정**
const validateDateRange = (): void => {
  if (moment(inputStartDate.value).isAfter(inputEndDate.value)) {
    inputStartDate.value = inputEndDate.value
  }
  emit('update:startDate', moment(inputStartDate.value).format('YYYY-MM-DD HH:mm'))
  // endTime: 23:59로 설정
  emit('update:endDate', moment(inputEndDate.value).format('YYYY-MM-DD 23:59'))
}

// dp__theme_dark 클래스 오버라이딩
const darkModeStyles = `
  .dp__theme_dark {
        --dp-primary-color: #26a69a; /* primary color - quasar secondary로 수정 */
  }
`
// dp__theme_dark 클래스 오버라이딩
const commonStyles = `
  :root {
        /* General */
        --dp-cell-border-radius: 20px; /*선택된 날짜 표기*/

        /* Sizing */
        --dp-month-year-row-height: 50px; /* 헤더 날짜 버튼 높이 */
        --dp-month-year-row-button-size: 10px /* 헤더 화살표 버튼 사이즈*/
        --dp-common-padding: 0px; /*일반적으로 사용되는 여백*/
        --dp-action-buttons-padding: 15px 15px; /*동작 행의 버튼 여백 조정*/

        /* Font Size */
        --dp-font-size: 0.9rem;
  }
`

// 동적으로 스타일 추가
const styleElement = document.createElement('style')
styleElement.innerHTML = darkModeStyles + commonStyles
document.head.appendChild(styleElement)
</script>

<template>
  <div class="row items-center date-wrap">
    <Datepicker
      v-model="inputStartDate"
      :format="format"
      :format-locale="ko"
      cancel-text="취소"
      select-text="확인"
      :max-date="new Date(moment().endOf('day').hours(23).minutes(59).format('YYYY-MM-DD HH:mm'))"
      dark
      dp__theme_dark
      :text-input="textInputOptions"
      placeholder="날짜를 선택해주세요"
      input-class-name="mx-input"
      class="datepicker_wrap"
      :start-time="{ hours: 0, minutes: 0 }"
      @update:model-value="validateDateRange"
    >
      <template #input-icon>
        <Icon icon="ic:outline-calendar-month" class="input-icon-calendar" />
        <!-- <img class="input-icon-calendar" src="@renderer/assets/images/outline-calendar-month-gray.svg" /> -->
      </template>
      <template #clear-icon="{ clear }">
        <img class="input-icon-del" src="@renderer/assets/images/ico_input_del.svg" @click="clear" />
      </template>
    </Datepicker>
    <span class="range">~</span>
    <Datepicker
      v-model="inputEndDate"
      :format="format"
      :format-locale="ko"
      cancel-text="취소"
      select-text="확인"
      :max-date="new Date(moment().endOf('day').hours(23).minutes(59).format('YYYY-MM-DD HH:mm'))"
      dark
      dp__theme_dark
      :text-input="textInputOptions"
      placeholder="날짜를 선택해주세요"
      input-class-name="mx-input"
      class="datepicker_wrap"
      :start-time="{ hours: 23, minutes: 59 }"
      @update:model-value="validateDateRange"
    >
      <template #input-icon>
        <Icon icon="ic:outline-calendar-month" class="input-icon-calendar" />
        <!-- <img class="input-icon-calendar" src="@renderer/assets/images/outline-calendar-month-gray.svg" /> -->
      </template>
      <template #clear-icon="{ clear }">
        <img class="input-icon-del" src="@renderer/assets/images/ico_input_del.svg" @click="clear" />
      </template>
    </Datepicker>
  </div>
</template>

<style scoped lang="scss">
.date-wrap :deep {
  .datepicker_wrap {
    width: 11.875rem;
    height: 2.25rem;
    border-radius: 4px;
    box-sizing: border-box;

    // 인풋박스 (아이콘)
    .dp__input_wrap {
      display: inline-block;
      position: relative;
      height: 2.25rem;
    }
    .dp__input {
      position: absolute;
      height: 2.25rem;
      border: 1px solid #56585a;
      background-color: #202428;
    }
    // 날짜 선택 시 뒤에 백그라운드 컬러 변경
    .dp__range_end,
    .dp__range_start,
    .dp__active_date {
      background: linear-gradient(#31817c, #23525d);
      border: none;
    }
    // 캘린더 아이콘
    .dp__input_icon_pad {
      padding-left: 0.75rem;
      border-radius: 4px;
    }
    .dp__input_icon {
      position: absolute;
      top: 0.375rem;
      width: 100%;
      text-align: right;
      .input-icon-calendar {
        position: absolute;
        right: 0.75rem;
        width: 1.5rem;
        height: 1.5rem;
        color: #bcbebf;
      }
    }
    // 20231031 클리어버튼 추가_백지연
    // 삭제 버튼
    .dp__clear_icon {
      position: absolute;
      width: 1.5rem;
      height: 1.5rem;
      top: 1.2rem;
      right: 2.1rem;
    }

    // 날짜 및 시간 변경 팝업
    .dp--menu-wrapper {
      box-shadow: 0px 4px 20px rgba(#000, 60%);
      .dp__menu {
        background-color: #101214;
        // 상하단 화살표
        .dp__arrow_top,
        .dp__arrow_bottom {
          display: none;
        }
        .dp__instance_calendar {
          .dp__menu_inner {
            padding: 0.5rem 1.25rem;
            // 캘린더 날짜 볼드체로 변경
            .dp__calendar {
              &_item {
                font-weight: bold;
              }
            }
          }
          // 시간 설정 버튼
          .dp--tp-wrap {
            max-width: 100%;
            .dp__icon {
              color: #ffffff;
            }
            // 시간설정
            > .dp__button {
              height: 40px;
              &::after {
                display: inline-block;
                content: '시간 설정';
                color: #ffffff;
                padding-left: 6px;
                font-weight: bold;
                font-size: 13px;
              }
            }
            // 날짜설정
            .dp__overlay {
              background: #101214;
              .dp__button {
                &::after {
                  display: inline-block;
                  content: '날짜 설정';
                  color: #ffffff;
                  padding-left: 6px;
                  font-weight: bold;
                  font-size: 13px;
                }
              }
            }
          }
        }
        // 취소, 확인 버튼
        .dp__action_row {
          width: 100%;
          margin-top: 0.5rem;
          padding: 0px;
          .dp__selection_preview {
            display: none;
          }
          .dp__action_buttons {
            flex-grow: 1;
            width: 100%;
            justify-content: space-between;
            column-gap: 2px;
            > .dp__action_button {
              height: 3.125rem;
              width: 50%;
              text-align: center;
              justify-content: center;
              background-color: #1e2022;
              border: none;
              font-size: 15px;
              margin: 0px;
              border-radius: 0px;
              &.dp__action_select {
                color: $primary;
                &::before {
                  display: inline-block;
                  content: '';
                  width: 1.25rem;
                  height: 1.25rem;
                  margin-right: 6px;
                  vertical-align: middle;
                  background: url('@renderer/assets/images/ico_check.svg') no-repeat center / auto 20px;
                  // 20231031 이미지 경로 조정_백지연
                }
              }
              &:focus {
                outline: 4px solid $primary;
              }
            }
          }
        }
      }
    }
  }
  .range {
    padding: 0px 0.375rem;
  }
  .date {
    height: 2rem;
    border: none;
    font-size: 0.875rem;
    .dp__input_icon_pad {
      padding: 0 0 0 0.625rem;
      height: 2rem;
      background-color: #202428;
      border: 1px solid #56585a;
    }

    .dp__input_icon {
      .input-icon-calendar {
        right: 0.625rem;
        width: 1.25rem;
        height: 1.25rem;
        color: #bcbebf;
      }
    }
    .dp__clear_icon {
      .input-icon-del {
        top: 1px;
        right: 2rem;
        width: 1.125rem;
        height: 1.125rem;
      }
    }
  }
}

// 화이트모드
.body--light {
  .datepicker_wrap :deep {
    .dp__input {
      color: $light-color;
      background-color: #ffffff;
      border-color: $light-border-second;
      &::placeholder {
        color: $light-border-second;
      }
    }
    .dp__input_icon {
      .input-icon-calendar {
        color: $light-dark;
      }
    }
    .dp--menu-wrapper {
      .dp__menu {
        background-color: #ffffff;
        border: none;
        .dp__instance_calendar {
          .dp__menu_inner {
            padding: 0.5rem 1.25rem;
            // 연월 지정
            .dp__month_year_row {
              .dp__inner_nav {
                color: $light-dark;
              }
              .dp__btn {
                color: #36393c;
                font-weight: 700;
              }
              // hover
              .dp--year-select:hover,
              .dp__month_year_select:hover,
              .dp__inner_nav:hover {
                background-color: $light-bg;
                color: #36393c;
              }
            }
            // 캘린더(월간)
            .dp__calendar {
              .dp__calendar_header {
                color: #757575;
              }
              .dp__calendar_header_separator {
                display: none;
              }
              .dp__calendar_item {
                color: $light-dark;
                font-weight: bold;
              }
              .dp__today {
                border-color: $light-primary;
              }
              // active
              // 날짜 선택 시 뒤에 백그라운드 컬러 변경
              .dp__range_end,
              .dp__range_start,
              .dp__active_date {
                background: $light-secondary;
                border: none;
              }
            }
          }
          // 시간 설정 버튼
          .dp--tp-wrap {
            .dp__icon {
              color: $light-dark;
            }
            // 시간설정
            > .dp__button {
              &::after {
                color: $light-dark;
                font-weight: bold;
                font-size: 13px;
              }
            }
            // 날짜설정
            .dp__overlay {
              background: #ffffff;
              .dp__time_display,
              .dp__time_col {
                color: $light-color;
              }
              .dp__button {
                &::after {
                  color: $light-dark;
                  font-weight: bold;
                  font-size: 13px;
                }
              }
            }
          }
        }
        // 취소, 확인 버튼
        .dp__action_row {
          .dp__action_buttons {
            > .dp__action_button {
              background-color: $light-bg;
              &.dp__action_cancel {
                color: $light-color;
              }
              &.dp__action_select {
                color: $light-secondary;
                &::before {
                  background: url('@renderer/assets/images/ico_check_light_mode.svg') no-repeat center / auto 20px;
                  // 20231031 이미지 경로 조정_백지연
                }
              }
              &:focus {
                outline: 3px solid $light-secondary;
              }
            }
          }
        }
        // hover시
        .dp--year-select:hover,
        .dp__month_year_select:hover,
        .dp__inner_nav:hover,
        .dp__button:hover,
        .dp__date_hover_end:hover,
        .dp__date_hover_start:hover,
        .dp__date_hover:hover,
        .dp__overlay_cell:hover {
          background-color: $light-bg;
          color: $light-color;
        }
        .dp__inc_dec_button:hover {
          background-color: $light-bg;
          color: $light-color;
        }
        .dp__time_display:hover:enabled {
          background-color: $light-bg;
          color: $light-color;
        }
        // 오버레이
        .dp__overlay {
          background: #ffffff;
          .dp__overlay_col {
            color: $light-dark;
          }
          .dp__overlay_cell_disabled {
            background: rgba(#000000, 23%);
          }
          .dp__overlay_cell_active {
            background: $light-secondary;
            color: #fff;
          }
        }
      }
    }
  }
}
</style>
