<template>
  <div class="max-w-900px mx-auto p-5">
    <!-- User Profile Section -->
    <n-card 
      title="Profile Information" 
      hoverable 
      class="rounded-3xl shadow-md mb-6 dark:bg-dark-800"
    >
      <div class="flex flex-col md:flex-row gap-6">
        <!-- Avatar Upload Section -->
        <div class="flex flex-col items-center gap-3">
          <n-upload
            action="/api/upload"
            :headers="{ 'Authorization': 'Bearer ' + userStore.token }"
            :default-file-list="fileList"
            list-type="image-card"
            accept="image/*"
            :max="1"
            @change="handleUploadChange"
            @remove="handleRemove"
            @preview="handlePreview"
            class="w-25 h-25 flex justify-center items-center overflow-hidden rounded-full border-2 border-dashed border-gray-200 dark:border-dark-500 hover:border-primary-500 transition-colors"
          >
            <n-avatar
              round
              :size="128"
              :src="userStore.user?.avatar || previewImageUrl || defaultAvatar"
              class="w-full h-full object-cover hover:scale-105 transition-transform"
            />
          </n-upload>
      
        </div>

        <!-- User Information -->
        <div class="flex-1 min-w-0">
          <n-gradient-text 
            type="success" 
            :size="24" 
            class="text-2xl font-bold mb-4 block"
          >
            {{ userStore.user?.username || 'Guest' }}
          </n-gradient-text>
          
          <div class="space-y-4">
            <div class="flex items-center gap-2">
              <n-icon :component="EmailOutline" size="20" class="text-blue-500" />
              <n-text strong class="text-gray-800 dark:text-gray-200">
                {{ userStore.user?.email || 'No email provided' }}
              </n-text>
            </div>
            
            <div class="flex items-center gap-2">
              <n-icon :component="InformationCircleOutline" size="20" class="text-blue-500" />
              <n-text 
                v-if="userStore.user?.bio" 
                strong 
                class="text-gray-800 dark:text-gray-200"
              >
                {{ userStore.user.bio }}
              </n-text>
              <n-text v-else depth="3" class="text-gray-500 dark:text-gray-400">
                No bio yet
              </n-text>
            </div>
            
            <div class="flex items-center gap-2">
              <n-icon :component="CalendarOutline" size="20" class="text-blue-500" />
              <n-text depth="3" class="text-gray-500 dark:text-gray-400">
                Member since {{ formatDate(userStore.user?.createdAt) || 'unknown' }}
              </n-text>
            </div>
          </div>
        </div>
      </div>
    </n-card>

    <!-- Image Preview Modal -->
    <n-modal 
      v-model:show="showModal" 
      preset="card"
      class="w-[90vw] max-w-800px"
      :title="previewTitle"
      :bordered="false"
    >
      <img 
        :src="previewImageUrl" 
        class="w-full rounded-lg"
        alt="Preview"
      >
      <template #footer>
        <div class="flex justify-end gap-3">
          <n-button @click="showModal = false">Close</n-button>
          <n-button 
            type="primary" 
            @click="handleSetAsAvatar" 
            v-if="!isCurrentAvatar"
            class="bg-primary-600 hover:bg-primary-700"
          >
            Set as Avatar
          </n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useUserStore } from '../store/userStore'
import { 
  BagRemoveSharp as EmailOutline,
  InformationCircleOutline,
  CalendarOutline
} from '@vicons/ionicons5'
import defaultAvatar from '../assets/NoUser.png'

const userStore = useUserStore()
const showModal = ref(false)
const previewImageUrl = ref('')
const previewTitle = ref('Image Preview')
const fileList = ref(userStore.user?.avatar ? [{ 
  id: 'avatar',
  name: 'avatar',
  url: userStore.user.avatar
}] : [])

const isCurrentAvatar = computed(() => {
  return previewImageUrl.value === userStore.user?.avatar
})

const handleUploadChange = async (data) => {
  if (data.file.status === 'done') {
    const imageUrl = data.file.response?.url
    if (imageUrl) {
      previewImageUrl.value = imageUrl
      await userStore.updateUser({ avatar: imageUrl })
    }
  } else if (data.file.status === 'error') {
    console.error('Upload error:', data.file.error)
  }
}

const handleRemove = async () => {
  await userStore.updateUser({ avatar: null })
  previewImageUrl.value = ''
}

const handlePreview = (file) => {
  previewImageUrl.value = file.url || file.thumbnailUrl
  previewTitle.value = file.name || 'Image Preview'
  showModal.value = true
}

const handleSetAsAvatar = async () => {
  await userStore.updateUser({ avatar: previewImageUrl.value })
  showModal.value = false
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const options = { year: 'numeric', month: 'long', day: 'numeric' }
  return new Date(dateString).toLocaleDateString(undefined, options)
}
</script>

<style>
/* Smooth transitions for avatar */
.n-avatar {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

/* Better modal backdrop */
.n-modal-mask {
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}
</style>