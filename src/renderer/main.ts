import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { Quasar, Dialog, Loading } from 'quasar'
import App from './App.vue'
import router from './router'
import '@quasar/extras/material-icons/material-icons.css'
import '@quasar/extras/material-icons-outlined/material-icons-outlined.css'
import '@quasar/extras/mdi-v6/mdi-v6.css'
import 'quasar/src/css/index.sass'
// resize columns 설정
import TableColumnsResizeable from './directives/TableColumnsResizeable'
window.global ||= window

const app = createApp(App)
// resize columns 설정
app.directive('TableColumnsResizeable', TableColumnsResizeable)

app.use(createPinia()) //use pinia
app.use(router) //use router
app.use(Quasar, {
  plugins: {
    Dialog,
    Loading
  },
  config: {
    dark: true,
    loading: {
      spinnerColor: 'primary',
      spinnerSize: 64
    }
  }
}) // Quasar

app.mount('#app')
