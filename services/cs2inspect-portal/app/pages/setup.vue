<template>
  <div class="min-h-screen bg-gray-950">
    <AppNavbar />

    <main class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
      <div class="mb-10">
        <h1 class="text-3xl font-bold text-white">Setup Guide</h1>
        <p class="mt-2 text-gray-400">Get the CS2Inspect plugin running on your server in minutes.</p>
      </div>

      <ol class="space-y-6">
        <!-- Step 1 -->
        <li class="flex gap-5">
          <div class="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold mt-0.5">
            1
          </div>
          <div class="flex-1 pb-6 border-b border-gray-800">
            <h2 class="text-base font-semibold text-white mb-1">Download the Plugin</h2>
            <p class="text-sm text-gray-400 mb-3">
              Download the latest CS2Inspect plugin from GitHub. Grab the <code class="text-blue-300 bg-gray-900 px-1.5 py-0.5 rounded text-xs">.zip</code> from the releases page.
            </p>
            <a
              href="https://github.com/CS2Inspect/cs2-plugin/releases"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 text-sm text-gray-200 transition-colors"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
              </svg>
              View Releases on GitHub
            </a>
          </div>
        </li>

        <!-- Step 2 -->
        <li class="flex gap-5">
          <div class="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold mt-0.5">
            2
          </div>
          <div class="flex-1 pb-6 border-b border-gray-800">
            <h2 class="text-base font-semibold text-white mb-1">Add License Key</h2>
            <p class="text-sm text-gray-400 mb-3">
              Open the plugin configuration file and add your license key. You can find your license key on the
              <NuxtLink to="/dashboard" class="text-blue-400 hover:text-blue-300 transition-colors">dashboard</NuxtLink>.
            </p>
            <div class="rounded-xl overflow-hidden border border-gray-800">
              <div class="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800">
                <span class="text-xs text-gray-500 font-mono">cs2inspect.cfg</span>
                <button
                  class="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                  @click="copyConfig"
                >
                  {{ configCopied ? 'Copied!' : 'Copy' }}
                </button>
              </div>
              <pre class="text-sm text-blue-300 bg-gray-950 px-4 py-4 overflow-x-auto font-mono leading-relaxed"><span class="text-gray-500">{</span>
  <span class="text-green-400">"LicenseKey"</span><span class="text-gray-400">:</span> <span class="text-yellow-300">"CS2I-XXXX-XXXX-XXXX"</span>
<span class="text-gray-500">}</span></pre>
            </div>
          </div>
        </li>

        <!-- Step 3 -->
        <li class="flex gap-5">
          <div class="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold mt-0.5">
            3
          </div>
          <div class="flex-1 pb-6 border-b border-gray-800">
            <h2 class="text-base font-semibold text-white mb-1">Restart Server</h2>
            <p class="text-sm text-gray-400">
              Restart your CS2 server to activate the plugin. The plugin will validate your license on startup and register your server address automatically.
            </p>
          </div>
        </li>

        <!-- Step 4 -->
        <li class="flex gap-5">
          <div class="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 flex items-center justify-center mt-0.5">
            <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div class="flex-1">
            <h2 class="text-base font-semibold text-white mb-1">Done</h2>
            <p class="text-sm text-gray-400">
              Your players can now customize their weapons! They can use the inspect key in-game to open the customization menu.
            </p>
          </div>
        </li>
      </ol>

      <!-- Help note -->
      <div class="mt-10 rounded-xl bg-gray-900 border border-gray-800 px-5 py-4 text-sm text-gray-400">
        <span class="font-medium text-gray-200">Need help?</span>
        Visit our
        <a href="https://github.com/CS2Inspect/cs2-plugin/wiki" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:text-blue-300 transition-colors">documentation</a>
        or open an issue on GitHub.
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
const configCopied = ref(false)

function copyConfig() {
  navigator.clipboard.writeText(`{\n  "LicenseKey": "CS2I-XXXX-XXXX-XXXX"\n}`)
  configCopied.value = true
  setTimeout(() => { configCopied.value = false }, 2000)
}

useSeoMeta({
  title: 'Setup Guide — CS2Inspect',
  description: 'Step-by-step guide to install and configure the CS2Inspect plugin on your CS2 server.',
})
</script>
