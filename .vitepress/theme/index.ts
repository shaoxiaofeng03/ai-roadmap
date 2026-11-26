import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import DailyTracker from '../components/DailyTracker.vue'
import Layout from './Layout.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    // 在 Markdown 里直接写 <DailyTracker /> 即可
    app.component('DailyTracker', DailyTracker)
  }
} satisfies Theme
