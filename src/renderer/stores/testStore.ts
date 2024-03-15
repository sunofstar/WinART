import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useTestStore = defineStore('testStore', {
  state: () => ({ log: [] }),
  actions: {
    pushLog(param) {
      this.log.push(param)
    },
    popLog() {
      this.log.pop()
      console.log('pop실행')
    }
  },
  getters: {
    doubleCount() {
      return 0
    }
  }
})

// export const useTestStore = defineStore('testStore', () => {
//   const count = ref(0) //state
//   const name = ref('bohyun') //state
//   const doubleCount = computed(() => count.value * 2) //getters
//   //actions
//   function increment() {
//     count.value++
//   }

//   return { count, name, doubleCount, increment }
// })
