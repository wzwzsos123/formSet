import axios from 'axios'

import VFormRender from '@/components/form-render/index.vue'
import ContainerItems from '@/components/form-render/container-item/index'

import SvgIcon from '@/components/svg-icon'  //svg组件

import { installI18n } from '@/utils/i18n'
import { loadExtension } from '@/extension/extension-loader'

VFormRender.install = function (app) {
  installI18n(app)
  loadExtension(app)

  app.use(ContainerItems)
  app.component('svg-icon', SvgIcon)
  app.component(VFormRender.name, VFormRender)
}

const components = [
  VFormRender
]

const install = (app) => {
  installI18n(app)
  loadExtension(app)

  app.use(ContainerItems)
  app.component('svg-icon', SvgIcon)
  components.forEach(component => {
    app.component(component.name, component)
  })

  window.axios = axios
}

if (typeof window !== 'undefined' && window.Vue) { /* script方式引入时赋值axios！！ */
  //window.axios = axios
}

export default {
  install,
  VFormRender
}
