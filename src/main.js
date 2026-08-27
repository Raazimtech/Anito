import { createApp } from 'vue'
import App from './App.vue'
import './styles.css'
import './navigation-dock.css'
import { installNavigationDock } from './navigation-dock.js'

const app=createApp(App)
app.mount('#app')
installNavigationDock(app)
