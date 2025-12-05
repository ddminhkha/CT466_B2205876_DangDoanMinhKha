<template>
    <!-- Confirmation Modal -->
    <div v-if="isOpen" class="modal d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">
                        <i :class="getIconClass(confirmData.type)" class="me-2"></i>
                        {{ confirmData.title }}
                    </h5>
                </div>
                <div class="modal-body">
                    <p class="mb-0">{{ confirmData.message }}</p>
                </div>
                <div class="modal-footer">
                    <button v-if="!confirmData.alertMode" type="button" class="btn btn-secondary"
                        @click="confirmData.onCancel">
                        {{ confirmData.cancelText }}
                    </button>
                    <button type="button" :class="getButtonClass(confirmData.type)" @click="confirmData.onConfirm">
                        {{ confirmData.confirmText }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { useConfirmDialog } from '../composables/useConfirmDialog'

export default {
    name: 'ConfirmDialog',
    setup() {
        const { isOpen, confirmData } = useConfirmDialog()

        const getIconClass = (type) => {
            const icons = {
                primary: 'bi bi-question-circle',
                danger: 'bi bi-exclamation-triangle',
                warning: 'bi bi-exclamation-circle',
                success: 'bi bi-check-circle'
            }
            return icons[type] || icons.primary
        }

        const getButtonClass = (type) => {
            const classes = {
                primary: 'btn btn-primary',
                danger: 'btn btn-danger',
                warning: 'btn btn-warning',
                success: 'btn btn-success'
            }
            return classes[type] || classes.primary
        }

        return {
            isOpen,
            confirmData,
            getIconClass,
            getButtonClass
        }
    }
}
</script>

<style scoped>
.modal {
    z-index: 1055;
}

.modal-dialog {
    max-width: 400px;
}
</style>