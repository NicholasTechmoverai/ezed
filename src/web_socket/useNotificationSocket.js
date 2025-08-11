import { useMessage } from 'naive-ui'
import { onMounted, onUnmounted } from 'vue'
import { notificationsSocket, usersSocket } from '.'
export function useNotificationSocket() {
    const message = useMessage()

    onMounted(() => {
        notificationsSocket.on("download_message", (data) => {
            if (data.messageType === "success") {
                message.success(data.message)
            } else if (data.messageType === "error") {
                message.error(data.message)
            }
        })
    })

    onUnmounted(() => {
        notificationsSocket.off("download_message")

    })
}
