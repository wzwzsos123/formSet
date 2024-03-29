<template>
    <div>
        <el-form
            :model="formConfig"
            size="small"
            label-position="left"
            label-width="120px"
            class="setting-form"
            @submit.prevent>
            <el-collapse v-model="formActiveCollapseNames" class="setting-collapse">
                <el-collapse-item name="1" :title="i18nt('designer.setting.basicSetting')">
                    <el-form-item :label="i18nt('designer.setting.formSize')">
                        <el-select v-model="formConfig.size">
                            <el-option
                                v-for="item in formSizes"
                                :key="item.value"
                                :label="item.label"
                                :value="item.value">
                            </el-option>
                        </el-select>
                    </el-form-item>
                    <el-form-item :label="i18nt('designer.setting.labelPosition')">
                        <el-radio-group v-model="formConfig.labelPosition" class="radio-group-custom">
                            <el-radio-button label="left">{{i18nt('designer.setting.leftPosition')}}</el-radio-button>
                            <el-radio-button label="top">{{i18nt('designer.setting.topPosition')}}</el-radio-button>
                        </el-radio-group>
                    </el-form-item>
                    <el-form-item :label="i18nt('designer.setting.labelWidth')">
                        <el-input-number v-model="formConfig.labelWidth" :min="0" style="width: 100%"></el-input-number>
                    </el-form-item>
                </el-collapse-item>
            </el-collapse>
        </el-form>

        <div v-if="showFormEventDialogFlag" class="" v-drag="['.drag-dialog.el-dialog', '.drag-dialog .el-dialog__header']">
            <el-dialog
                :title="i18nt('designer.setting.editFormEventHandler')"
                v-model="showFormEventDialogFlag"
                :show-close="true"
                custom-class="drag-dialog small-padding-dialog"
                :close-on-click-modal="false"
                :close-on-press-escape="false"
                :destroy-on-close="true">
                <el-alert type="info" :closable="false" :title="'form.' + eventParamsMap[curEventName]"></el-alert>
                <code-editor :mode="'javascript'" :readonly="false" v-model="formEventHandlerCode"></code-editor>
                <el-alert type="info" :closable="false" title="}"></el-alert>
                <template #footer>
                    <div class="dialog-footer">
                        <el-button @click="showFormEventDialogFlag = false">
                            {{i18nt('designer.hint.cancel')}}</el-button>
                        <el-button type="primary" @click="saveFormEventHandler">
                            {{i18nt('designer.hint.confirm')}}</el-button>
                    </div>
                </template>
            </el-dialog>
        </div>

        <div v-if="showEditFormCssDialogFlag" class="" v-drag="['.drag-dialog.el-dialog', '.drag-dialog .el-dialog__header']">
            <el-dialog
                :title="i18nt('designer.setting.formCss')"
                v-model="showEditFormCssDialogFlag"
                :show-close="true"
                custom-class="drag-dialog small-padding-dialog"
                :close-on-click-modal="false"
                :close-on-press-escape="false"
                :destroy-on-close="true">
                <code-editor :mode="'css'" :readonly="false" v-model="formCssCode"></code-editor>
                <template #footer>
                    <div class="dialog-footer">
                        <el-button @click="showEditFormCssDialogFlag = false">
                            {{i18nt('designer.hint.cancel')}}</el-button>
                        <el-button type="primary" @click="saveFormCss">
                            {{i18nt('designer.hint.confirm')}}</el-button>
                    </div>
                </template>
            </el-dialog>
        </div>

        <div v-if="showEditFunctionsDialogFlag" class="" v-drag="['.drag-dialog.el-dialog', '.drag-dialog .el-dialog__header']">
            <el-dialog
                :title="i18nt('designer.setting.globalFunctions')"
                v-model="showEditFunctionsDialogFlag"
                :show-close="true"
                custom-class="drag-dialog small-padding-dialog"
                :close-on-click-modal="false"
                :close-on-press-escape="false"
                :destroy-on-close="true">
                <code-editor :mode="'javascript'" :readonly="false" v-model="functionsCode"></code-editor>
                <template #footer>
                    <div class="dialog-footer">
                        <el-button @click="showEditFunctionsDialogFlag = false">
                            {{i18nt('designer.hint.cancel')}}</el-button>
                        <el-button type="primary" @click="saveGlobalFunctions">
                            {{i18nt('designer.hint.confirm')}}</el-button>
                    </div>
                </template>
            </el-dialog>
        </div>

    </div>
</template>

<script>
import i18n from '@/utils/i18n'
import CodeEditor from '@/components/code-editor/index'
import { deepClone, insertCustomCssToHead, insertGlobalFunctionsToHtml } from '@/utils/util'

export default {
    name: 'FormSetting',
    mixins: [i18n],
    components: {
        CodeEditor
    },
    props: {
        designer: Object,
        formConfig: Object
    },
    inject: ['getDesignerConfig'],
    data() {
        return {
            designerConfig: this.getDesignerConfig(),

            formActiveCollapseNames: ['1', '2'],

            formSizes: [
                { label: 'default', value: '' },
                { label: 'large', value: 'large' },
                // {label: 'medium', value: 'medium'},
                { label: 'small', value: 'small' }
                // {label: 'mini', value: 'mini'},
            ],

            showEditFormCssDialogFlag: false,
            formCssCode: '',
            cssClassList: [],

            showEditFunctionsDialogFlag: false,
            functionsCode: '',

            showFormEventDialogFlag: false,
            formEventHandlerCode: '',
            curEventName: '',

            eventParamsMap: {
                'onFormCreated': 'onFormCreated() {',
                'onFormMounted': 'onFormMounted() {',
                'onFormDataChange': 'onFormDataChange(fieldName, newValue, oldValue, formModel, subFormName, subFormRowIndex) {'
                // 'onFormValidate':     'onFormValidate() {',
            }

        }
    },
    created() {
        // 导入表单JSON后需要重新加载自定义CSS样式！！！
        this.designer.handleEvent('form-json-imported', () => {
            this.formCssCode = this.formConfig.cssCode
            insertCustomCssToHead(this.formCssCode)
            this.extractCssClass()
            this.designer.emitEvent('form-css-updated', deepClone(this.cssClassList))
        })
    },
    mounted() {
        /* SettingPanel和FormWidget为兄弟组件, 在FormWidget加载formConfig时，
         此处SettingPanel可能无法获取到formConfig.cssCode, 故加个延时函数！ */
        setTimeout(() => {
            this.formCssCode = this.formConfig.cssCode
            insertCustomCssToHead(this.formCssCode)
            this.extractCssClass()
            this.designer.emitEvent('form-css-updated', deepClone(this.cssClassList))
        }, 1200)
    },
    methods: {
        showEventCollapse() {
            if (this.designerConfig['eventCollapse'] === undefined) {
                return true
            }

            return !!this.designerConfig['eventCollapse']
        },

        editFormCss() {
            this.formCssCode = this.designer.formConfig.cssCode
            this.showEditFormCssDialogFlag = true
        },

        extractCssClass() {
            const regExp = /\..*{/g
            const result = this.formCssCode.match(regExp)
            const cssNameArray = []

            if (!!result && result.length > 0) {
                result.forEach((rItem) => {
                    const classArray = rItem.split(',') // 切分逗号分割的多个class
                    if (classArray.length > 0) {
                        classArray.forEach((cItem) => {
                            const caItem = cItem.trim()
                            if (caItem.indexOf('.', 1) !== -1) { // 查找第二个.位置
                                const newClass = caItem.substring(caItem.indexOf('.') + 1, caItem.indexOf('.', 1)) // 仅截取第一、二个.号之间的class
                                if (newClass) {
                                    cssNameArray.push(newClass.trim())
                                }
                            } else if (caItem.indexOf(' ') !== -1) { // 查找第一个空格位置
                                const newClass = caItem.substring(caItem.indexOf('.') + 1, caItem.indexOf(' ')) // 仅截取第一、二个.号之间的class
                                if (newClass) {
                                    cssNameArray.push(newClass.trim())
                                }
                            } else {
                                if (caItem.indexOf('{') !== -1) { // 查找第一个{位置
                                    const newClass = caItem.substring(caItem.indexOf('.') + 1, caItem.indexOf('{'))
                                    cssNameArray.push(newClass.trim())
                                } else {
                                    const newClass = caItem.substring(caItem.indexOf('.') + 1)
                                    cssNameArray.push(newClass.trim())
                                }
                            }
                        })
                    }
                })
            }

            // this.cssClassList.length = 0
            this.cssClassList.splice(0, this.cssClassList.length) // 清除数组必须用splice，length=0不会响应式更新！！
            this.cssClassList = Array.from(new Set(cssNameArray)) // 数组去重
        },

        saveFormCss() {
            this.extractCssClass()
            this.designer.formConfig.cssCode = this.formCssCode
            insertCustomCssToHead(this.formCssCode)
            this.showEditFormCssDialogFlag = false

            this.designer.emitEvent('form-css-updated', deepClone(this.cssClassList))
        },

        editGlobalFunctions() {
            this.functionsCode = this.designer.formConfig.functions
            this.showEditFunctionsDialogFlag = true
        },

        saveGlobalFunctions() {
            this.designer.formConfig.functions = this.functionsCode
            insertGlobalFunctionsToHtml(this.functionsCode)
            this.showEditFunctionsDialogFlag = false
        },

        editFormEventHandler(eventName) {
            this.curEventName = eventName
            this.formEventHandlerCode = this.formConfig[eventName]
            this.showFormEventDialogFlag = true
        },

        saveFormEventHandler() {
            this.formConfig[this.curEventName] = this.formEventHandlerCode
            this.showFormEventDialogFlag = false
        }

    }
}
</script>

<style lang="scss" scoped>
  .setting-form {
    :deep(.el-form-item__label) {
      font-size: 13px;
      //text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
    }

    :deep(.el-form-item--small.el-form-item) {
      margin-bottom: 10px;
    }

    .radio-group-custom {
      :deep(.el-radio-button__inner) {
        padding-left: 12px;
        padding-right: 12px;
      }
    }

    .custom-divider.el-divider--horizontal {
      margin: 10px 0;
    }
  }

  .setting-collapse {
    :deep(.el-collapse-item__content) {
      padding-bottom: 6px;
    }

    :deep(.el-collapse-item__header) {
      font-weight: bold;
    }
  }

  .small-padding-dialog {
    :deep(.el-dialog__body) {
      padding: 6px 15px 12px 15px;
    }
  }

</style>
