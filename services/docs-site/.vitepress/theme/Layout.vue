<script setup>
import DefaultTheme from 'vitepress/theme'
import PageActions from './components/PageActions.vue'
import { useData } from 'vitepress'

const { Layout } = DefaultTheme
const { frontmatter } = useData()
</script>

<template>
  <Layout>
    <template #doc-before>
      <PageActions v-if="frontmatter.layout !== 'home'" />
    </template>
  </Layout>
</template>
