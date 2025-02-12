<template>
  <ThemeProvider>
    <NLoadingBarProvider>
      <NModalProvider>
        <NDialogProvider>
          <NMessageProvider>
            <!--<Preloader />-->
            <NuxtLayout name="default" class="h-screen">

            </NuxtLayout>
          </NMessageProvider>
        </NDialogProvider>
      </NModalProvider>
    </NLoadingBarProvider>
  </ThemeProvider>
</template>
<script setup lang="ts">

</script>