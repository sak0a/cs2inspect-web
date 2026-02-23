// .vitepress/theme/index.ts
import DefaultTheme from 'vitepress/theme'
import './custom.css'
import ConfigGenerator from './components/ConfigGenerator.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('ConfigGenerator', ConfigGenerator)
  }
}
