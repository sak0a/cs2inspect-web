<template>
  <!-- Loading or Error Section -->
  <div v-if="loading">
    <p>Loading...</p>
  </div>

  <!-- Password Input Section -->
  <div v-else-if="passwordRequired && !snippet">
    <label for="password">Enter Password:</label>
    <input v-model="password" id="password" type="password" />
    <button @click="submitPassword">Submit</button>
  </div>

  <!-- Snippet Display Section -->
  <div v-else-if="snippet">
    <h1>{{ snippet.title }}</h1>
    <pre><code>{{ snippet.code }}</code></pre>
    <button @click="downloadSnippet">Download</button>
    <button @click="deleteSnippet" class="delete-btn">Delete</button> <!-- Delete Button -->
  </div>

  <!-- Feedback Message -->
  <div v-if="deleteStatus" :class="{'success': isDeleteSuccess, 'error': !isDeleteSuccess}">
    {{ deleteStatus }}
  </div>

  <MonacoEditor :options="{ theme: 'vs-dark' }" v-model="content" />

</template>

<script setup>
const content = ref('')
const route = useRoute();
const router = useRouter();

const loading = ref(true); // Track loading state
const password = ref('');
const passwordRequired = ref(false);
const snippet = ref(null); // Snippet data including title and code
const token = ref(null); // Store the JWT token
const deleteStatus = ref(''); // Feedback for delete action
const isDeleteSuccess = ref(false); // To determine if delete was successful

// Fetch the snippet metadata on page load
const fetchSnippetMetadata = async () => {
  try {
    const res = await fetch(`/api/snippets/${route.params.id}/metadata`, {
      method: 'GET',
    });

    if (!res.ok) {
      if (res.status === 404 || res.status === 400) {
        // Redirect or show a popup for snippet not found
        await router.push('/error/snippetnotfound');
      } else {
        console.log('An error occurred fetch first: ', res);
      }
      return;
    }

    const data = await res.json();

    if (data.passwordRequired) {
      // Snippet requires a password
      passwordRequired.value = true;
    } else {
      // Snippet can be displayed directly
      await fetchSnippetContent(); // Fetch the snippet content directly
    }
  } catch (error) {
    console.error('Error fetching snippet metadata:', error);
  } finally {
    loading.value = false;
  }
};

// Second request: Fetch snippet content with or without password
const fetchSnippetContent = async (password = null) => {
  console.log('Fetching snippet content with password: ' + route.params.id)
  try {
    const res = await fetch(`/api/snippets/${route.params.id}`, {
      method: 'POST',
      body: passwordRequired.value ? JSON.stringify({ password }) : null,
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      if (res.status === 401) {
        alert('Invalid password. Please try again.');
      } else {
        console.log('An error occurred fetch content: .', res);
      }
      return;
    }

    const data = await res.json();
    snippet.value = data;
    token.value = data.token || null; // Store token for download
  } catch (error) {
    console.error('Error fetching snippet content:', error);
  }
};

// Submit the password and retrieve the snippet
const submitPassword = async () => {
  await fetchSnippetContent(password.value);
};

// Delete the snippet
const deleteSnippet = async () => {
  const confirmDelete = confirm('Are you sure you want to delete this snippet?');
  if (!confirmDelete) return;

  try {
    const res = await fetch(`/api/snippets/${route.params.id}/delete`, {
      method: 'POST',
      body: passwordRequired.value ? JSON.stringify({ password: password.value }) : null, // Send password if needed
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (res.ok) {
      deleteStatus.value = 'Snippet deleted successfully';
      isDeleteSuccess.value = true;

      // Redirect to another page after successful deletion (e.g., homepage)
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } else {
      const error = await res.json();
      deleteStatus.value = `Error deleting snippet: ${error.message}`;
      isDeleteSuccess.value = false;
    }
  } catch (error) {
    console.error('Error deleting snippet:', error);
    deleteStatus.value = 'Failed to delete snippet';
    isDeleteSuccess.value = false;
  }
};

// Download the snippet
const downloadSnippet = () => {
  if (token.value) {
    window.location.href = `/api/snippets/${route.params.id}/download?token=${token.value}`;
  } else {
    window.location.href = `/api/snippets/${route.params.id}/download`;
  }
};

// Fetch snippet metadata on component mount
onMounted(() => fetchSnippetMetadata());
</script>