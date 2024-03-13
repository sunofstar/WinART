<template>
  <!-- 수정예정 -->
    <div class="date-wrap">
      <q-item class="no-padding">
          <q-item-section>
            <q-input
              v-model="confiscationDate"
              mask=""
              outlined
              dense
              :rules="confiscationDateRules"
            >
              <template #append>
                <q-icon name="img:/outline-calendar-month-gray.svg" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </q-item-section>
          <div class="q-px-sm row items-center">~</div>
          <q-item-section>
            <q-input
              v-model="confiscationDate"
              mask=""
              outlined
              dense
              :rules="confiscationDateRules"
            >
              <template #append>
                <q-icon name="img:/outline-calendar-month-gray.svg" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </q-item-section>
      </q-item>
    </div>
</template>

<script setup lang="ts">
import { Ref, ref, } from 'vue'
import dayjs from 'dayjs'

// const confiscationDate: Ref<string | null> = ref(dayjs().format('YYYY-MM-DD HH:mm'))
  const confiscationDate = ref('yyyymmdd hhmm')

</script>

<style scoped lang="scss">
.q-field--dense :deep(.q-field__control, .q-field__marginal) {
    min-height: 2rem;
    height: auto
}
.date-wrap {
  
    .q-input {
      padding-top: 0.375rem;
      max-width: 10rem;
      font-size: 0.875rem;
    }
    .q-input ::v-deep(.q-icon) {
      width: 1.25rem;
      height: 1.25rem;
      color: #bcbebf;
    }
    .q-input ::v-deep(.q-field__native) {
      color: rgba(255,255,255,0.6);
    }
    .q-item {
      min-height: 0;
    }
    .q-icon > img {
      width: 20px;
      height: 20px;
    }
}
</style>