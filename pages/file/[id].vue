<script setup lang="ts">
const route = useRoute();
const router = useRouter();

const loading = ref(true);
const password = ref('');
const passwordRequired = ref(false);
const file = ref(null); // File metadata
const token = ref(null); // Store the JWT token
const deleteStatus = ref(''); // Feedback for delete action
const isDeleteSuccess = ref(false); // To track success/failure of deletion

// Fetch file metadata on page load
const fetchFileMetadata = async () => {
  try {
    const res = await fetch(`/api/files/${route.params.fileId}/metadata`, {
      method: 'GET',
    });

    if (!res.ok) {
      if (res.status === 404) {
        await router.push('/error/filenotfound');
      } else {
        alert('An error occurred.');
      }
      return;
    }

    const data = await res.json();

    if (data.passwordRequired) {
      passwordRequired.value = true;
    } else {
      await fetchFileContent(); // Fetch the file metadata if no password is required
    }
  } catch (error) {
    console.error('Error fetching file metadata:', error);
  } finally {
    loading.value = false;
  }
};

// Fetch file content with or without password
const fetchFileContent = async (password = null) => {
  try {
    const res = await fetch(`/api/files/${route.params.fileId}`, {
      method: 'POST',
      body: password ? JSON.stringify({ password }) : null,
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      if (res.status === 401) {
        alert('Invalid password. Please try again.');
      } else {
        alert('An error occurred.');
      }
      return;
    }

    const data = await res.json();
    file.value = data;
    token.value = data.token || null;
  } catch (error) {
    console.error('Error fetching file content:', error);
  }
};

// Submit password to retrieve file
const submitPassword = async () => {
  await fetchFileContent(password.value);
};

// Delete the file
const deleteFile = async () => {
  const confirmDelete = confirm('Are you sure you want to delete this file?');
  if (!confirmDelete) return;

  try {
    const res = await fetch(`/api/files/${route.params.fileId}/delete`, {
      method: 'POST',
      body: JSON.stringify({ password: password.value }), // Send password if needed
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (res.ok) {
      deleteStatus.value = 'File deleted successfully';
      isDeleteSuccess.value = true;

      // Redirect to another page after successful deletion (e.g., homepage)
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } else {
      const error = await res.json();
      deleteStatus.value = `Error deleting file: ${error.message}`;
      isDeleteSuccess.value = false;
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    deleteStatus.value = 'Failed to delete file';
    isDeleteSuccess.value = false;
  }
};

// Download file
const downloadFile = () => {
  if (token.value) {
    window.location.href = `/api/files/${route.params.fileId}/download?token=${token.value}`;
  } else {
    window.location.href = `/api/files/${route.params.fileId}/download`;
  }
};

// Fetch file metadata on component mount
onMounted(() => fetchFileMetadata());
</script>

<template>
  <div>
    <!-- Loading or Error Section -->
    <div v-if="loading">
      <p>Loading...</p>
    </div>

    <!-- Password Input Section -->
    <div v-else-if="passwordRequired && !file">
      <label for="password">Enter Password:</label>
      <input v-model="password" id="password" type="password" />
      <button @click="submitPassword">Submit</button>
    </div>

    <!-- File Download Section -->
    <div v-else-if="file">
      <h1>{{ file.filename }}</h1>
      <button @click="downloadFile">Download</button>
      <button @click="deleteFile" class="delete-btn">Delete</button> <!-- Delete Button -->
    </div>

    <!-- Feedback Message -->
    <div v-if="deleteStatus" :class="{'success': isDeleteSuccess, 'error': !isDeleteSuccess}">
      {{ deleteStatus }}
    </div>
  </div>
</template>

<style scoped>
.success {
  color: green;
}

.error {
  color: red;
}

.delete-btn {
  background-color: red;
  color: white;
  border: none;
  padding: 10px;
  cursor: pointer;
  margin-top: 10px;
}
</style>