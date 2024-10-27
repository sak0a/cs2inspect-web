<template>
  <NSpace class="bg-[#181818] px-4 pt-2" size="small" justify="space-between">
    <NSpace>
        <NIcon size="30" class="" color="#86DFBA" @click="router.push('/')">
          <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24"><g fill="none"><path d="M19.754 11a.75.75 0 0 1 .743.648l.007.102v7a3.25 3.25 0 0 1-3.065 3.246l-.185.005h-11a3.25 3.25 0 0 1-3.244-3.066l-.006-.184V11.75a.75.75 0 0 1 1.494-.102l.006.102v7a1.75 1.75 0 0 0 1.607 1.745l.143.006h11A1.75 1.75 0 0 0 19 18.894l.005-.143V11.75a.75.75 0 0 1 .75-.75zM6.22 7.216l4.996-4.996a.75.75 0 0 1 .976-.073l.084.072l5.005 4.997a.75.75 0 0 1-.976 1.134l-.084-.073l-3.723-3.716l.001 11.694a.75.75 0 0 1-.648.743l-.102.007a.75.75 0 0 1-.743-.648L11 16.255V4.558L7.28 8.277a.75.75 0 0 1-.976.073l-.084-.073a.75.75 0 0 1-.073-.977l.073-.084l4.996-4.996L6.22 7.216z" fill="currentColor"/></g></svg>
        </NIcon>
        <NH2 class="m-0" @click="router.push('/')">Share</NH2>
      <NH6 class="m-0">{{snippet.title}}</NH6>
    </NSpace>
    <!-- Snippet Form -->
    <!--
    <NForm v-if="loadingStatus === Status.Loaded"
           id="form"
           label-placement="left"
           size="small"
           class="pt-3"
           inline>
      <NFormItem
          ref="titleFormItemRef"
          path="title"
          label="Title"
          class="h-10"
          :show-feedback="false">
          <NInput
              v-model:value="snippet.title"
              class="min-w-48 max-w-64"
              maxlength="64"
              autosize
              placeholder="Enter Snippet Title" v-model:disabled="formEditingStatus"/>
      </NFormItem>
      {{ formEditingStatus }}
      <NButton  class="px-8 font-semibold" size="small" attr-type="button" >
        Share
      </NButton>


    </NForm>-->

    <NSpace class="bg-[#1E1E1E]">
       some text
      <NIcon size="25" class="m-0 pt-1" color="#fff">
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 512 512" enable-background="new 0 0 512 512" xml:space="preserve"><g><g><path d="M256,456c-110.3,0-200-89.7-200-200c0-54.8,21.7-105.9,61.2-144c6.4-6.2,16.6-6,22.7,0.4c6.2,6.4,6,16.6-0.4,22.7
			C106.4,167.1,88.2,210,88.2,256c0,92.5,75.3,167.8,167.8,167.8S423.8,348.5,423.8,256c0-87.1-66.7-159-151.8-167.1v62.6
			c0,8.9-7.2,16.1-16.1,16.1s-16.1-7.2-16.1-16.1V72.1c0-8.9,7.2-16.1,16.1-16.1c110.3,0,200,89.7,200,200S366.3,456,256,456z"></path></g><path d="M175.9,161.9l99.5,71.5c13.5,9.7,16.7,28.5,7,42c-9.7,13.5-28.5,16.7-42,7c-2.8-2-5.2-4.4-7-7l-71.5-99.5
		c-3.2-4.5-2.2-10.8,2.3-14C167.8,159.3,172.5,159.5,175.9,161.9z"></path></g></svg>
      </NIcon>
      <NH2 class="m-0">
        <span v-if="snippet.expiration_date" />

        <span v-else>
          Permanent
        </span>
      </NH2>

    </NSpace>


    <NSpace class="w-fit justify-items-end">
      <NButton v-if="loadingStatus === Status.Loaded" @click="downloadSnippet" size="small" secondary type="success">
        <template #icon>
          <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 20 20"><g fill="none"><path d="M15.245 16.498a.75.75 0 0 1 .101 1.493l-.101.007H4.75a.75.75 0 0 1-.102-1.493l.102-.007h10.495zM10.004 2a.75.75 0 0 1 .743.648l.007.102l-.001 10.193l2.966-2.97a.75.75 0 0 1 .977-.074l.084.072a.75.75 0 0 1 .073.977l-.072.084l-4.243 4.25l-.07.063l-.092.059l-.036.021l-.091.038l-.12.03l-.07.008l-.06.002a.726.726 0 0 1-.15-.016l-.082-.023a.735.735 0 0 1-.257-.146l-4.29-4.285a.75.75 0 0 1 .976-1.134l.084.073l2.973 2.967V2.75a.75.75 0 0 1 .75-.75z" fill="currentColor"></path></g></svg>
        </template>
        Download
      </NButton>
      <NButton v-if="authRequired" class="m-0" size="small" secondary type="error" @click="logout">
        <template #icon>
          <NIcon>
            <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512"><path d="M320 176v-40a40 40 0 0 0-40-40H88a40 40 0 0 0-40 40v240a40 40 0 0 0 40 40h192a40 40 0 0 0 40-40v-40" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"></path><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M384 176l80 80l-80 80"></path><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M191 256h273"></path></svg>
          </NIcon>
        </template>
        Logout
      </NButton>
      <NButton v-if="authRequired"
               class=""
               size="small"
               attr-type="button"
               secondary
               @click="openDeleteDialog"
               type="error">
        <template #icon>
          <NIcon>
            <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24"><g fill="none"><path d="M12 1.75a3.25 3.25 0 0 1 3.245 3.066L15.25 5h5.25a.75.75 0 0 1 .102 1.493L20.5 6.5h-.796l-1.28 13.02a2.75 2.75 0 0 1-2.561 2.474l-.176.006H8.313a2.75 2.75 0 0 1-2.714-2.307l-.023-.174L4.295 6.5H3.5a.75.75 0 0 1-.743-.648L2.75 5.75a.75.75 0 0 1 .648-.743L3.5 5h5.25A3.25 3.25 0 0 1 12 1.75zm6.197 4.75H5.802l1.267 12.872a1.25 1.25 0 0 0 1.117 1.122l.127.006h7.374c.6 0 1.109-.425 1.225-1.002l.02-.126L18.196 6.5zM13.75 9.25a.75.75 0 0 1 .743.648L14.5 10v7a.75.75 0 0 1-1.493.102L13 17v-7a.75.75 0 0 1 .75-.75zm-3.5 0a.75.75 0 0 1 .743.648L11 10v7a.75.75 0 0 1-1.493.102L9.5 17v-7a.75.75 0 0 1 .75-.75zm1.75-6a1.75 1.75 0 0 0-1.744 1.606L10.25 5h3.5A1.75 1.75 0 0 0 12 3.25z" fill="currentColor"></path></g></svg>
          </NIcon>
        </template>
        Delete
      </NButton>
    </NSpace>
    <!-- Feedback Modal -->
    <!--<NModal v-model:show="showUploadFeedback">
      <NAlert :type="uploadFeedbackType">{{ uploadFeedbackMessage }}</NAlert>
    </NModal>-->

  </NSpace>

  <!-- Feedback Modal -->
  <NModal
      v-model:show="showFeedback"
      transform-origin="center"
      :mask-closable="false"
      :close-on-esc="false">
    <NSpace vertical align="center" class="feedback-modal-wrapper">
      <NAlert
          :bordered="false"
          v-model:type="feedbackType"
          class="modal-alert">
        {{ feedbackMessage }}
      </NAlert>
    </NSpace>
  </NModal>

  <!-- Password Input Modal -->
  <NModal
      v-model:show="passwordModal.showModal"
      transform-origin="center"
      :mask-closable="false"
      :close-on-esc="false">
    <NSpace vertical align="center" class="password-modal-wrapper">
      <NAlert
          v-show="passwordModal.showAlert"
          :bordered="false"
          v-model:type="passwordModal.alertType"
          class="modal-alert">
        {{ passwordModal.alertMessage }}
      </NAlert>
      <NSpace class="px-2 pt-2">
        <NPopover v-model:disabled="passwordForm.disabled" trigger="hover" placement="bottom" >
          <template #trigger>
            <NInput
                v-model:value="passwordForm.password"
                type="password"
                placeholder="Password"
                show-password-on="click"
                maxlength="16"
                v-model:status="passwordForm.status"
                @focus="validatePassword"
                @updateValue="validatePassword"
            />
          </template>
          <template #default>
            <span>{{ passwordForm.message }}</span>
          </template>
        </NPopover>
        <NButton @click="submitPassword" :disabled="!passwordForm.disabled">Submit</NButton>
      </NSpace>
    </NSpace>
  </NModal>

  <!-- Feedback Message
  <div v-if="deleteStatus" :class="{'success': isDeleteSuccess, 'error': !isDeleteSuccess}">
    {{ deleteStatus }}
  </div>
-->
  <MonacoEditor
      ref="monacoEditor"
      id="codeEditor"
      v-model="snippet.code"
      :lang="snippet.language"
      :options="{
        theme: 'vs-dark',
        readOnly: true,
        scrollBeyondLastLine: false, // Disable scrolling beyond the last line
        scrollbar: {
          vertical: 'auto', // Auto scrollbar behavior (show only when needed)
          verticalScrollbarSize: 10 // Size of the scrollbar, or 0 to hide
        }
      }"/>
</template>

<script lang="ts" setup>
import { MonacoEditor} from "#components";
import { useLoadingBar, useDialog } from 'naive-ui'
import Countdown from "~/components/Countdown.vue";

enum Status {
  Loading = 'loading',
  Loaded = 'loaded',
  Editing = 'editing',
  Error = 'error',
}

const loadingStatus = ref(Status.Loading)

const route = useRoute();
const router = useRouter();
const dialog = useDialog();



/********* Snippet Data *********/
const monacoEditor = ref(null);


const snippet = ref({
  title: '',
  language: '',
  code: '',
  expiration_date: '',
  slug: '',
});
snippet.value.slug = route.params.id;
/********* Snippet Data *********/

/******** Remaining Time ********/


/******** Remaining Time ********/

/********** Loading Bar **********/
const loadingBar = useLoadingBar();
const loadingBarDisabled = ref(true)
const handleLoadingBar = {
  start() {
    loadingBar.start();
    loadingBarDisabled.value = false;
  },
  finish() {
    loadingBar.finish();
    loadingBarDisabled.value = true;
  },
  error() {
    loadingBar.error();
    loadingBarDisabled.value = true;
  }
};
/********** Loading Bar **********/

/********** Feedback **********/
const showFeedback = ref(false); // Modal visibility
const feedbackType = ref('error'); // Upload feedback type
const feedbackMessage = ref(''); // Upload feedback message
function showFeedbackModal(type: string, message: string) {
  showFeedback.value = true;
  feedbackType.value = type;
  feedbackMessage.value = message;
}
/********** Feedback **********/

/********** Modal Blur **********/
function handleModalBlur() {
  document.getElementById('__nuxt')?.classList.toggle('modal-open');
}
/********** Modal Blur **********/

/********** Password **********/
const passwordForm = ref({
  password: '',
  disabled: true,
  status: '',
  message: '',
});
const passwordRequired = ref(false);

function validatePassword(): void {
  setTimeout(() => {
    const { password } = passwordForm.value;
    if (password.length === 0) {
      updatePasswordForm('error', 'Password is required.', false);
    } else if (password.length < 4) {
      updatePasswordForm('error', 'Password must be at least 4 characters long.', false);
    } else if (password.length > 16) {
      updatePasswordForm('error', 'Password must be at most 16 characters long.', false);
    } else {
      updatePasswordForm('success', '', true);
    }
  }, 0);
}
function updatePasswordForm(status, message, disabled): void {
  passwordForm.value = { ...passwordForm.value, status, message, disabled };
}
/********** Password Validation **********/

/********** Password Modal **********/
const passwordModal = ref({
  alertType: '',
  alertMessage: '',
  showAlert: false,
  showModal: false,
});

function openPasswordModal() {
  updatePasswordModalAlert('error', 'Password is required to view this snippet.');
  passwordModal.value.showModal = true;
}
function updatePasswordModalAlert(type: string, message: string) {
  passwordModal.value.alertType = type;
  passwordModal.value.alertMessage = message;
  passwordModal.value.showAlert = true;
}
/********** Password Modal **********/

/********** Password Submit **********/
async function submitPassword() {
  handleLoadingBar.start();
  passwordModal.value.showAlert = false;
  deleteAuthToken();
  await fetchSnippetBeforeAuth(passwordForm.value.password);
}
/********** Password Submit **********/

/********** Auth Token **********/
const authToken: string | null = () => localStorage.getItem('snippetToken-' + snippet.value.slug);
const deleteAuthToken: void = () => localStorage.removeItem('snippetToken-' + snippet.value.slug);
const authRequired = ref(false);
/********** Auth Token **********/

/********** Logout **********/
function logout(): void {
  handleModalBlur();
  handleLoadingBar.start();
  deleteAuthToken();
  showFeedbackModal('success', 'Logged out successfully');
  handleLoadingBar.finish();
  window.location.reload();
}
/********** Logout **********/

/********** Fetch Snippet **********/
function updateSnippetData(data: any): void {
  snippet.value = { ...snippet.value, ...data };
}
function showContentFetchedFeedback(): void {
  showFeedbackModal('success', 'Snippet content fetched successfully');
  setTimeout(() => {
    loadingStatus.value = Status.Loaded;
    showFeedback.value = false;
    handleModalBlur();
  }, 250);
}

async function fetchSnippet(): void {
  try {
    const headers = authToken() ? { 'Authorization': `Bearer ${authToken()}` } : {};
    console.log(JSON.stringify(headers));
    const res = await fetch(`/api/snippets/${route.params.id}`, {
      method: 'GET',
      headers
    });
    const data = await res.json();

    // Error fetching snippet metadata
    if (!res.ok) {
      loadingStatus.value = Status.Error;
      handleLoadingBar.error();
      showFeedbackModal('error', 'Error fetching snippet metadata: ' + JSON.stringify(res.status));
    }

    // Snippet not found
    if (data.statusCode === 404) {
      loadingStatus.value = Status.Error;
      handleLoadingBar.error();
      showFeedbackModal('error', 'Snippet not found... Redirecting to homepage');
      setTimeout(() => {
        router.push('/error/snippetnotfound');
      }, 5000);
      return;
    }

    // Snippet has expired
    if (data.statusCode === 402) {
      loadingStatus.value = Status.Error;
      handleLoadingBar.error();
      handleLoadingBarError();
      showFeedbackModal('error', 'Snippet has expired... Redirecting to homepage');
      setTimeout(() => {
        router.push('/error/snippetexpired');
      }, 5000);
      return;
    }

    // Snippet requires password (if not authenticated, jwt check afterwards)
    if (data.statusCode === 401) {
      passwordRequired.value = true;
      loadingStatus.value = Status.Error;
      handleLoadingBar.error();
      openPasswordModal();
      return;
    }

    // Invalid token provided, revalidate with password
    if (data.statusCode === 405 || data.statusCode === 406) {
      loadingStatus.value = Status.Error;
      handleLoadingBar.error();
      if (data.statusCode === 405) {
        showFeedbackModal('error', 'Invalid Authorization Token provided. Revalidate with your password.');
      } else {
        showFeedbackModal('error', 'Authentication expired. Revalidate with your password.');
      }
      deleteAuthToken();
      setTimeout(() => {
        showFeedback.value = false;
        openPasswordModal();
      }, 1500);
      return;
    }

    loadingStatus.value = Status.Loaded;
    handleLoadingBar.finish();
    updateSnippetData(data);
    showContentFetchedFeedback();
  } catch (error) {
    loadingStatus.value = Status.Error;
    handleLoadingBar.error();
    console.log('Error fetching snippet metadata: ' + error);
    showFeedbackModal('error', 'Error fetching snippet metadata: ' + JSON.stringify(error.message));
  } finally {
    console.log('Snippet metadata fetched');
    loadingStatus.value = Status.Loaded;
    handleLoadingBar.finish();
  }
};

// Second request: Fetch snippet content with or without password
async function fetchSnippetBeforeAuth(password: string | null) {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (authToken()) headers['Authorization'] = `Bearer ${authToken()}`;

    const res = await fetch(`/api/snippets/${route.params.id}`, {
      method: 'POST',
      body: JSON.stringify({ password }),
      headers: headers,
    });

    const data = await res.json();
    if (!res.ok) {
      handleModalBlur();
      console.log('Error fetching snippet content: ' + res.statusText);
      return;
    }

    // Incorrect password provided
    if (data.statusCode === 403) {
      loadingStatus.value = Status.Error;
      handleLoadingBar.error();
      updatePasswordModalAlert('error', 'Incorrect password. Please try again.');
      return;
    }

    // Invalid token provided, revalidate with password
    if (data.statusCode === 405 || data.statusCode === 406) {
      loadingStatus.value = Status.Error;
      handleLoadingBar.error();
      if (data.statusCode === 405) {
        showFeedbackModal('error', 'Invalid Authorization Token provided. Revalidate with your password.');
      } else {
        showFeedbackModal('error', 'Authentication expired. Revalidate with your password.');
      }
      deleteAuthToken();
      setTimeout(() => {
        showFeedback.value = false;
        openPasswordModal();
      }, 1500);
      return;
    }

    updateSnippetData(data)
    if (data.token) {
      localStorage.setItem('snippetToken-' + snippet.value.slug, data.token);
    }

    passwordModal.value.showModal = false;
    loadingStatus.value = Status.Loaded;
    handleLoadingBar.finish();
    authRequired.value = authToken() !== null;
    showContentFetchedFeedback();
  } catch(error) {
    loadingStatus.value = Status.Error;
    handleModalBlur();
    handleLoadingBar.error();
    showFeedbackModal('error', 'Error fetching snippet content. Please try again later.');
  }
};



/********** Deleting Snippet **********/
function openDeleteDialog(): void {
  dialog.create({
    type: 'error',
    title: 'Delete Snippet',
    content: 'Are you sure you want to delete this snippet?',
    positiveText: 'Delete it',
    positiveButtonProps: {
      type: 'error',
    },
    negativeText: 'Cancel',
    maskClosable: false,
    onPositiveClick: async () => {
      await deleteSnippet()
    },
    onMaskClick: () => {},
    onEsc: () => {}
  })
}

/********** Edit Title **********/
const editing = ref(false);
const formEditingStatus = !editing.value


const deleteStatus = ref(''); // Feedback for delete action
const isDeleteSuccess = ref(false); // To determine if delete was successful
// Delete the snippet
async function deleteSnippet() {
  const token = authToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const confirmDelete = confirm('Are you sure you want to delete this snippet?');
  if (!confirmDelete) return;

  try {
    const res = await fetch(`/api/snippets/${route.params.id}/delete`, {
      method: 'POST',
      headers,
    });

    if (res.ok) {
      deleteStatus.value = 'Snippet deleted successfully';
      isDeleteSuccess.value = true;
      setTimeout(() => {
        router.push('/');
      }, 5000);
    } else {
      const error = await res.json();
      deleteStatus.value = `Error deleting snippet: ${error.message}`;
      isDeleteSuccess.value = false;
    }
  } catch (error) {
    deleteStatus.value = 'Failed to delete snippet: ' + error;
    isDeleteSuccess.value = false;
  }
}

// Download the snippet
async function downloadSnippet(): Promise<void> {
  const headers: Record<string, string> = {};
  if (authRequired.value) {
    headers['Authorization'] = `Bearer ${authToken()}`;
  }

  try {
    const response = await fetch(`/api/snippets/${route.params.id}/download`, {
      method: 'GET',
      headers: headers,
    });

    if (!response.ok) {
      handleModalBlur();
      showFeedbackModal('error', 'Failed to download snippet');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${route.params.id}.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    handleModalBlur();
    showFeedbackModal('error', 'Error downloading snippet: ' + error.message);
    console.error('Error downloading snippet:', error);
  }
}

// Fetch snippet metadata on component mount
onMounted(() => {
  authRequired.value = authToken() !== null;
  handleModalBlur();
  handleLoadingBar.start();
  fetchSnippet();
});
</script>
<style lang="sass">
body
  background: #1E1E1E
.modal-open > :not(.n-modal)
  @apply blur-md

.password-modal-wrapper
  @apply w-[330px] max-w-[330px] bg-[#181818] pb-4 rounded-md
  .modal-alert
    @apply rounded-t-md rounded-b-none w-[330px]

#codeEditor
  height: calc(100vh - 100px)
  margin-top: .5rem
</style>