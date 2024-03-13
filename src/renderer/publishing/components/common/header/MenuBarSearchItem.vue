<template>
  <div class="search-item-wrap">
    <div class="">
      <div class="keyword">
        <q-input v-model.trim="keyword" 
                outlined 
                dense 
                placeholder="Keyword" 
                clearable
                clear-icon="mdi-close"/>
        <q-checkbox v-model="right" dense label="또는" class="chk-box"></q-checkbox>
      </div>
      <div class="row items-center date-wrap">
        <DatetimeCalendar
          :model-value="realDatetime"
          required
          @update:model-value="handleDate"
          class="date"
        />
        <span class="range">~</span>
        <DatetimeCalendar
          :model-value="realDatetime"
          required
          @update:model-value="handleDate"
          class="date"
        />
          <!-- <DatetimeCalendar
          v-model="realDatetime"
          :selected-datetime-ref="'realDatetimeRef'"
          class="date"
          />
          <span class="range">~</span>
          <DatetimeCalendar
            v-model="realDatetime"
            :selected-datetime-ref="'realDatetimeRef'"
            class="date"
          /> -->
      </div>
    </div>
    <q-btn label="검색" flat class="search-btn">
      <Icon icon="ic:baseline-search" />
    </q-btn>
  </div>
</template>

<script setup lang="ts">
import { Ref, ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
// import DateCalendar from '@renderer/publishing/components/DateCalendar.vue'
import { setDate } from '@renderer/utils/utils'
import DatetimeCalendar from '@renderer/components/common/DatetimeCalendar.vue'


// 검색 키워드
const keyword: Ref<string> = ref('')

const right = ref(false)


// 실제 시간
const realDatetime: Ref<string | null> = ref()
const handleDate = (date: Date) => {
  realDatetime.value = setDate(date)
}



</script>

<style scoped lang="scss">


.search-item-wrap :deep {
  display: flex;
  align-items: center;
  &::after {
    display: inline-block;
    content: "";
    width: 1px;
    height: 5.625rem;
    background-color: #0a141e;
  }
  
  .keyword {
    display: flex;
    .q-input {
      max-width: 21rem;
      flex-grow: 1;
    }
  }
  // 체크박스 사이즈
  .q-checkbox {
      margin: 0px;
      font-size: 0.875rem;
      .q-checkbox__inner {
        width: 1.125rem;
        height: 1.125rem ;
        min-width: 1.125rem;
      }
    }
  .chk-box {
    padding-left: 0.75rem;
  }
  .search-btn {
    border: 1px solid #0a141e;
    background-color: rgba(#0a141e, 20%);
    padding: 2.25rem 1.875rem 0.75rem;
    height: 70px;
    margin: 0px 1.25rem 0px 1rem;
    svg {
      position: absolute;
      width: 1.5rem;
      height: 1.5rem;
      top: 12px;
    }
  }
  .date-wrap {
    margin-top: 0.375rem;
    .range {
      padding: 0px 0.375rem;
    }
    .date {
      width: 11.875rem;
      height: 2rem;
      border: none;
      font-size: 0.875rem;
      .dp__input_icon_pad {
        padding: 0 0 0 0.625rem;
        height: 2rem;
        background-color: #202428;
        border: 1px solid #56585a;
      }

      .dp__input_icon{
        .input-icon-calendar {
          right: 0.625rem;
          width: 1.25rem;
          height: 1.25rem;
        }
      }
      .dp__clear_icon {
        .input-icon-del{
          top: 1px;
          right: 2rem;
          width: 1.125rem;
          height: 1.125rem;
        }
      }
    }
  }

}
</style>
