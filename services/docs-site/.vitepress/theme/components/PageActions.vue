<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useData } from 'vitepress'

const { page, title } = useData()
const isOpen = ref(false)
const copied = ref('')
const el = ref<HTMLElement>()

const BASE = 'https://sak0a.github.io/cs2inspect-web'
const rawUrl = computed(() => `${BASE}/raw/${page.value.relativePath}`)
const pageUrl = computed(() => {
  const p = page.value.relativePath.replace(/\.md$/, '')
  return `${BASE}/${p === 'index' ? '' : p}`
})
const pageTitle = computed(() => page.value.title || title.value || 'CS2Inspect')

function close() { isOpen.value = false }
function flash(key: string) { copied.value = key; setTimeout(() => copied.value = '', 1500) }

async function copyPage() {
  try {
    const text = await (await fetch(rawUrl.value)).text()
    await navigator.clipboard.writeText(text)
  } catch { await navigator.clipboard.writeText(pageUrl.value) }
  flash('page'); close()
}
async function copyLink() {
  await navigator.clipboard.writeText(`[${pageTitle.value}](${pageUrl.value})`)
  flash('link'); close()
}
function openUrl(url: string) { window.open(url, '_blank'); close() }
function aiUrl(base: string) {
  return `${base}${encodeURIComponent(`Read ${rawUrl.value} so I can ask questions about it.`)}`
}

function onClick(e: MouseEvent) { if (el.value && !el.value.contains(e.target as Node)) close() }
function onKey(e: KeyboardEvent) { if (e.key === 'Escape') close() }
onMounted(() => { document.addEventListener('click', onClick); document.addEventListener('keydown', onKey) })
onUnmounted(() => { document.removeEventListener('click', onClick); document.removeEventListener('keydown', onKey) })
</script>

<template>
  <div class="pa" ref="el">
    <button class="pa-trigger" @click="isOpen = !isOpen" :aria-expanded="isOpen">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
      <span>Copy page</span>
      <svg :class="{ open: isOpen }" class="chev" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
    </button>
    <Transition name="dd">
      <div v-if="isOpen" class="pa-menu">
        <button class="mi" @click="copyPage">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
          {{ copied === 'page' ? 'Copied!' : 'Copy page' }}
        </button>
        <button class="mi" @click="copyLink">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
          {{ copied === 'link' ? 'Copied!' : 'Copy Markdown link' }}
        </button>
        <div class="sep" />
        <button class="mi" @click="openUrl(rawUrl)">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          View as Markdown <span class="ext">&#8599;</span>
        </button>
        <div class="sep" />
        <button class="mi" @click="openUrl(aiUrl('https://chatgpt.com/?q='))">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"/></svg>
          Open in ChatGPT <span class="ext">&#8599;</span>
        </button>
        <button class="mi" @click="openUrl(aiUrl('https://claude.ai/new?q='))">
          <svg width="12" height="12" viewBox="0 0 92.2 65" fill="currentColor"><path d="M66.5,0H52.4l25.7,65h14.1L66.5,0z M25.7,0L0,65h14.4l5.3-13.6h26.9L51.8,65h14.4L40.5,0C40.5,0,25.7,0,25.7,0z M24.3,39.3l8.8-22.8l8.8,22.8H24.3z"/></svg>
          Open in Claude <span class="ext">&#8599;</span>
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.pa { position: absolute; top: 9px; right: 0; z-index: 10; }
.pa-trigger {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 8px; font-size: 11px; font-weight: 500;
  color: var(--vp-c-text-2); background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border); border-radius: 6px;
  cursor: pointer; transition: all 0.2s; font-family: var(--vp-font-family-base);
}
.pa-trigger:hover { color: var(--vp-c-brand-1); border-color: var(--vp-c-brand-1); }
.chev { transition: transform 0.2s; }
.chev.open { transform: rotate(180deg); }
.pa-menu {
  position: absolute; top: calc(100% + 3px); right: 0;
  min-width: 180px; padding: 3px;
  background: var(--vp-c-bg-soft); border: 1px solid var(--vp-c-border);
  border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.4); z-index: 50;
}
.mi {
  display: flex; align-items: center; gap: 6px; width: 100%;
  padding: 4px 8px; font-size: 11px; color: var(--vp-c-text-2);
  background: none; border: none; border-radius: 5px;
  cursor: pointer; transition: all 0.15s; font-family: var(--vp-font-family-base); text-align: left;
}
.mi:hover { color: var(--vp-c-text-1); background: var(--vp-c-bg-mute); }
.ext { margin-left: auto; opacity: 0.4; font-size: 10px; }
.sep { height: 1px; margin: 2px 6px; background: var(--vp-c-border); }
.dd-enter-active { transition: all 0.15s ease-out; }
.dd-leave-active { transition: all 0.1s ease-in; }
.dd-enter-from, .dd-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
