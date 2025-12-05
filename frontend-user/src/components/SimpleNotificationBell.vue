<template>
    <div class="notification-bell position-relative">
        <!-- Simple Notification Bell Icon -->
        <button class="btn btn-outline-light p-2 position-relative" @click="toggleNotifications" type="button">
            <i class="bi bi-bell fs-5"></i>
            <!-- Badge for testing -->
            <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                style="font-size: 0.65rem;">
                3
            </span>
        </button>

        <!-- Simple Dropdown -->
        <div v-if="showDropdown" class="notification-dropdown position-absolute bg-white shadow rounded p-3"
            style="top: 100%; right: 0; width: 300px; z-index: 1050; margin-top: 0.5rem;">
            <h6>🔔 Test Notifications</h6>
            <div class="border-bottom py-2">
                <strong>Test notification 1</strong>
                <br><small class="text-muted">This is a test notification</small>
            </div>
            <div class="border-bottom py-2">
                <strong>Test notification 2</strong>
                <br><small class="text-muted">Another test notification</small>
            </div>
            <div class="py-2">
                <strong>Test notification 3</strong>
                <br><small class="text-muted">One more test notification</small>
            </div>
            <button @click="showDropdown = false" class="btn btn-sm btn-secondary mt-2">
                Close
            </button>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'

const showDropdown = ref(false)

const toggleNotifications = () => {
    console.log('🔔 Button clicked! Current state:', showDropdown.value)
    showDropdown.value = !showDropdown.value
    console.log('🔔 New state:', showDropdown.value)
}
</script>

<style scoped>
.notification-bell {
    position: relative;
}

.notification-dropdown {
    animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>