import { ref } from 'vue'

// Global confirmation state
const isOpen = ref(false)
const confirmData = ref({
    title: '',
    message: '',
    confirmText: 'Xác nhận',
    cancelText: 'Hủy',
    type: 'primary', // primary, danger, warning
    alertMode: false, // true = chỉ hiển thị OK button
    onConfirm: null,
    onCancel: null
})

export function useConfirmDialog() {
    const showConfirm = (options) => {
        return new Promise((resolve) => {
            confirmData.value = {
                title: options.title || 'Xác nhận',
                message: options.message || 'Bạn có chắc chắn muốn thực hiện hành động này?',
                confirmText: options.confirmText || 'Xác nhận',
                cancelText: options.cancelText || 'Hủy',
                type: options.type || 'primary',
                alertMode: false,
                onConfirm: () => {
                    isOpen.value = false
                    resolve(true)
                },
                onCancel: () => {
                    isOpen.value = false
                    resolve(false)
                }
            }
            isOpen.value = true
        })
    }

    const showAlert = (options) => {
        return new Promise((resolve) => {
            confirmData.value = {
                title: options.title || 'Thông báo',
                message: options.message || '',
                confirmText: options.confirmText || 'OK',
                cancelText: '',
                type: options.type || 'danger',
                alertMode: true, // Chỉ hiển thị nút OK
                onConfirm: () => {
                    isOpen.value = false
                    resolve(true)
                    if (options.onClose) {
                        options.onClose()
                    }
                },
                onCancel: () => {
                    isOpen.value = false
                    resolve(false)
                }
            }
            isOpen.value = true
        })
    }

    const hideConfirm = () => {
        isOpen.value = false
        if (confirmData.value.onCancel) {
            confirmData.value.onCancel()
        }
    }

    return {
        isOpen,
        confirmData,
        showConfirm,
        showAlert,
        hideConfirm
    }
}