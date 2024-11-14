<template >
  <SitePreloader />
  <NSpace class="bg-[#181818] px-4" size="small">
    <NIcon size="30" class="pt-2" color="#86DFBA" @click="router.push('/')">
      <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24"><g fill="none"><path d="M19.754 11a.75.75 0 0 1 .743.648l.007.102v7a3.25 3.25 0 0 1-3.065 3.246l-.185.005h-11a3.25 3.25 0 0 1-3.244-3.066l-.006-.184V11.75a.75.75 0 0 1 1.494-.102l.006.102v7a1.75 1.75 0 0 0 1.607 1.745l.143.006h11A1.75 1.75 0 0 0 19 18.894l.005-.143V11.75a.75.75 0 0 1 .75-.75zM6.22 7.216l4.996-4.996a.75.75 0 0 1 .976-.073l.084.072l5.005 4.997a.75.75 0 0 1-.976 1.134l-.084-.073l-3.723-3.716l.001 11.694a.75.75 0 0 1-.648.743l-.102.007a.75.75 0 0 1-.743-.648L11 16.255V4.558L7.28 8.277a.75.75 0 0 1-.976.073l-.084-.073a.75.75 0 0 1-.073-.977l.073-.084l4.996-4.996L6.22 7.216z" fill="currentColor"/></g></svg>
    </NIcon>
    <NH2 class="m-0 pt-2" @click="router.push('/')">Share</NH2>
    <NSpace/>
    <NSpace/>
    <!-- Snippet Form -->
    <NForm id="form" ref="formRef" :model="formModel"  label-placement="left" size="small" class="pt-3" inline :rules="formRules">
      <!-- Snippet Title Input -->
      <NFormItem
          ref="titleFormItemRef"
          path="title"
          label="Title"
          class="h-10"
          :show-feedback="false">
        <NPopover v-model:disabled="formErrors.title.disabled" trigger="hover">
          <template #trigger>
            <NInput
                v-model:value="formModel.title"
                class="min-w-48 max-w-64"
                maxlength="64"
                autosize
                placeholder="Enter Snippet Title"
                @updateValue="validateTitle"/>
          </template>
          <template #default>
            <span>{{ formErrors.title.message }}</span>
          </template>
        </NPopover>
      </NFormItem>

      <!-- Snippet Language Dropdown -->
      <NFormItem
          path="language"
          label="Language"
          class="h-10">
        <NSelect
            v-model:value="formModel.language"
            class="w-40"
            filterable
            :options="languageOptions"
            :consistent-menu-width="true"
            size="small"/>
      </NFormItem>

      <!-- Snippet Expiry Time Dropdown -->
      <NFormItem
          class="h-10"
          path="expiry"
          label="Expiration in">
        <NSelect
            v-model:value="formModel.expiry"
            :options="expirationOptions"
            :consistent-menu-width="false"
            class="w-40"
            size="small"
            @updateValue="validatePassword"/>
      </NFormItem>

      <!-- Password Input (Optional) -->
      <NFormItem
          ref="passwordFormItemRef"
          class="h-10"
          path="password"
          label="Password"
          :show-require-mark="passwordRequired"
          :show-feedback="false">
        <NPopover v-model:disabled="formErrors.password.disabled" trigger="hover" >
          <template #trigger>
            <NInput
                v-model:value="formModel.password"
                class="w-40 max-w-40"
                placeholder="Password"
                type="password"
                show-password-on="click"
                maxlength="16"
                size="small"
                @updateValue="validatePassword"
            />
          </template>
          <template #default>
            <span>{{ formErrors.password.message }}</span>
          </template>
        </NPopover>
      </NFormItem>

      <!-- Submit Button -->
      <NButton v-model:disabled="formDisabled" class="px-8 font-semibold" size="small" attr-type="button" @click="uploadSnippet">
        Share
      </NButton>
    </NForm>

    <!-- Feedback Modal -->
    <NModal v-model:show="showUploadFeedback">
      <NAlert :type="uploadFeedbackType">{{ uploadFeedbackMessage }}</NAlert>
    </NModal>
  </NSpace>
  <!--<pre>{{ JSON.stringify(formModel, null, 2) }}</pre>
  <pre>{{ JSON.stringify(formErrors, null, 2) }}</pre>-->

  <!-- Snippet Code Input (Textarea) -->
  <LazyClientOnly>
    <MonacoEditor id="codeEditor" v-model="code" :lang="formModel.language" :options="{ theme: 'vs-dark' }" class="w-100"/>
  </LazyClientOnly>
</template>

<script setup lang="ts">
import { useLoadingBar } from 'naive-ui'
import type {
  FormInst,
  FormItemInst,
  FormItemRule,
  FormRules } from 'naive-ui'

const router = useRouter();
const code = ref('');

/******* Password Validation *******/
const passwordFormItemRef = ref<FormItemInst | null>(null)
const passwordRequired: boolean = computed(() => formModel.value.expiry === 'permanent');
function validatePassword(): void {
  // Delay to ensure form item is updated
  setTimeout(() => {
    formErrors.value.password.disabled = true;
    formErrors.value.password.message = '';

    passwordFormItemRef.value?.validate().catch((errors) => {
      if (errors) {
        formErrors.value.password.disabled = false;
        formErrors.value.password.message = errors[0].message;
      }
    });
  }, 0);
}

/******* Title Validation *******/
const titleFormItemRef = ref<FormItemInst | null>(null)
function validateTitle(): void {
  setTimeout(() => {
    formErrors.value.title.disabled = true;
    formErrors.value.title.message = '';

    titleFormItemRef.value?.validate().catch((errors) => {
      if (errors) {
        formErrors.value.title.disabled = false;
        formErrors.value.title.message = errors[0].message;
      }
    });
  }, 0);
}

/******* Form Handling *******/
/*
  - Data Options for Selects
  - Data Binding with Form Model
  - Error Handling with Form Errors
  - Form Rules for Validation
  - Form Disabled State for Submit Button
 */
const formRef = ref<FormInst | null>(null)

const expirationOptions = [
  { label: '1 Hour',  value: '1_hour', },
  { label: '2 Hours', value: '2_hours', },
  { label: '4 Hours', value: '4_hours', },
  { label: '8 Hours', value: '8_hours', },
  { label: '1 Day',   value: '1_day', },
  { label: '1 Week (Default)', value: '1_week', },
  { label: '1 Month', value: '1_month', },
  { label: 'Permanent', value: 'permanent', },
];
const languageOptions = [
  { label: 'Text', value: 'plaintext' },
  { label: 'Abap', value: 'abap' },
  { label: 'Apex', value: 'apex' },
  { label: 'Bat', value: 'bat' },
  { label: 'Bicep', value: 'bicep' },
  { label: 'Cameligo', value: 'cameligo' },
  { label: 'Clojure', value: 'clojure' },
  { label: 'Coffeescript', value: 'coffeescript' },
  { label: 'C', value: 'c' },
  { label: 'C++', value: 'cpp' },
  { label: 'C#', value: 'csharp' },
  { label: 'Csp', value: 'csp' },
  { label: 'CSS', value: 'css' },
  { label: 'Cypher', value: 'cypher' },
  { label: 'Dart', value: 'dart' },
  { label: 'Dockerfile', value: 'dockerfile' },
  { label: 'Ecl', value: 'ecl' },
  { label: 'Elixir', value: 'elixir' },
  { label: 'Flow9', value: 'flow9' },
  { label: 'F#', value: 'fsharp' },
  { label: 'Go', value: 'go' },
  { label: 'GraphQL', value: 'graphql' },
  { label: 'Handlebars', value: 'handlebars' },
  { label: 'Hcl', value: 'hcl' },
  { label: 'HTML', value: 'html' },
  { label: 'ini', value: 'ini' },
  { label: 'Java', value: 'java' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'Julia', value: 'julia' },
  { label: 'Kotlin', value: 'kotlin' },
  { label: 'Less', value: 'less' },
  { label: 'Lexon', value: 'lexon' },
  { label: 'Lua', value: 'lua' },
  { label: 'Liquid', value: 'liquid' },
  { label: 'M3', value: 'm3' },
  { label: 'Markdown', value: 'markdown' },
  { label: 'Mdx', value: 'mdx' },
  { label: 'Mips', value: 'mips' },
  { label: 'Msdax', value: 'msdax' },
  { label: 'MySQL', value: 'mysql' },
  { label: 'Objective C', value: 'objective-c' },
  { label: 'Pascal', value: 'pascal' },
  { label: 'Pascaligo', value: 'pascaligo' },
  { label: 'Perl', value: 'perl' },
  { label: 'PgSQL', value: 'pgsql' },
  { label: 'PHP', value: 'php' },
  { label: 'Pla', value: 'pla' },
  { label: 'Postiats', value: 'postiats' },
  { label: 'Powerquery', value: 'powerquery' },
  { label: 'Powershell', value: 'powershell' },
  { label: 'Proto', value: 'proto' },
  { label: 'Pug', value: 'pug' },
  { label: 'Python', value: 'python' },
  { label: 'Q#', value: 'qsharp' },
  { label: 'R', value: 'r' },
  { label: 'Razor', value: 'razor' },
  { label: 'Redis', value: 'redis' },
  { label: 'Redshift', value: 'redshift' },
  { label: 'Ruby', value: 'ruby' },
  { label: 'Rust', value: 'rust' },
  { label: 'Sb', value: 'sb' },
  { label: 'Scala', value: 'scala' },
  { label: 'Scheme', value: 'scheme' },
  { label: 'SCSS', value: 'scss' },
  { label: 'Shell', value: 'shell' },
  { label: 'Sol', value: 'sol' },
  { label: 'Aes', value: 'aes' },
  { label: 'Sparql', value: 'sparql' },
  { label: 'SQL', value: 'sql' },
  { label: 'St', value: 'st' },
  { label: 'Swift', value: 'swift' },
  { label: 'Verilog', value: 'verilog' },
  { label: 'Tcl', value: 'tcl' },
  { label: 'Twig', value: 'twig' },
  { label: 'TypeScript', value: 'typescript' },
  { label: 'Typespec', value: 'typespec' },
  { label: 'Visual Basic', value: 'vb' },
  { label: 'Wgsl', value: 'wgsl' },
  { label: 'XML', value: 'xml' },
  { label: 'Yaml', value: 'yaml' },
  { label: 'Json', value: 'json' },
];

const formModel = ref({
  title: '' as string,
  language: 'plaintext' as string,
  password: '' as string,
  expiry: '1_week' as string
});
const formErrors = ref({
  password: {
    message: '',
    disabled: true,
  },
  title: {
    message: '',
    disabled: true,
  }
});
const formRules: FormRules = {
  title: [{
    required: true,
    validator(rule: FormItemRule, value: string) {
      if (!value) {
        return new Error('Title is required.');
      }
      if (value.length < 3) {
        return new Error('Title must be at least 3 characters.');
      }
      if (value.length > 64) {
        return new Error('Title must be less than 64 characters.');
      }
      return true;
    },
    trigger: ['input']
  }],
  password: [
    {
      required: passwordRequired,
      validator(rule: FormItemRule, value: string) {
        if (formModel.value.expiry === 'permanent') {
          if (!value) {
            return new Error('Password is required for permanent snippets.');
          }
          if (value.length < 4) {
            return new Error('Password must be at least 4 characters.');
          }
          if (value.length > 16) {
            return new Error('Password must be less than 16 characters.');
          }
          return true;
        }
        return true;
      },
      trigger: ['input']
    }
  ]
}

const formDisabled = computed(() => {
  return !formModel.value.title
      || !code.value
      || code.value.length < 3
      || formModel.value.title.length < 3
      || formModel.value.expiry === 'permanent' && (!formModel.value.password || formModel.value.password.length < 4);
});

/********** Loading Bar **********/
const loadingBar = useLoadingBar()
const loadingBarDisabled = ref(true)

function handleLoadingBarStart() {
  loadingBar.start()
  loadingBarDisabled.value = false
}
function handleLoadingBarFinish() {
  loadingBar.finish()
  loadingBarDisabled.value = true
}
function handleLoadingBarError() {
  loadingBarDisabled.value = true
  loadingBar.error()
}

/********** Upload Feedback **********/
const showUploadFeedback = ref(false); // Modal visibility
const uploadFeedbackType = ref('error'); // Upload feedback type
const uploadFeedbackMessage = ref(''); // Upload feedback message

function showUploadFeedbackModal(type: string, message: string) {
  showUploadFeedback.value = true;
  uploadFeedbackType.value = type;
  uploadFeedbackMessage.value = message;
}

/* Automatically detect language based on code content (unfinshed)
//const languageList = languageOptions.map(option => option.value);
watch(code, (newCode: string) => {
  // Detect language
  const detected: string = hljs.highlightAuto(newCode, languageList);
  selectedLanguage.value = detected.language;
});*/



/********** Upload Snippet **********/
const uploadSnippet = async () => {
  handleLoadingBarStart();
  // Prepare the request body
  const payload = {
    title: formModel.value.title,
    code: code.value,
    language: formModel.value.language, // Default to plaintext
    password: formModel.value.password, // Optional password
    expiry: formModel.value.expiry, // Expiry time selection
  };
  try {
    const response = await fetch('/api/snippets/upload', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    if (response.ok) {
      handleLoadingBarFinish();
      showUploadFeedbackModal('success', 'Snippet uploaded successfully! Access it at: ' + data.slug + " or wait for the redirect.");

      setTimeout(() => {
        router.push(`/snippet/${data.slug}`);
      }, 5000);
    } else {
      handleLoadingBarError();
      showUploadFeedbackModal('error', data.message);
      throw new Error(data.message || 'Error uploading snippet.');
    }
  } catch (error) {
    handleLoadingBarError();
    showUploadFeedbackModal('error', error.message);
  }
};
</script>

<style lang="sass">
body, html
  background: #1E1E1E
#codeEditor
  height: calc(100vh - 100px)
  margin-top: .5rem

</style>