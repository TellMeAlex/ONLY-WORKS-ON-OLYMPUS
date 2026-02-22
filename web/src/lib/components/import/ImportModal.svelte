<script lang="ts">
  import { Modal } from '$lib/components/ui/index'
  import { loadConfig } from '$lib/stores/config.svelte'
  import { showToast } from '$lib/stores/ui.svelte'
  import { parseJSONC, validateConfig } from '$lib/utils/config-io'

  let { open, onClose }: {
    open: boolean
    onClose: () => void
  } = $props()

  let activeTab = $state<'file' | 'paste'>('file')
  let pasteContent = $state('')
  let error = $state('')
  let preview = $state('')

  function reset() {
    pasteContent = ''
    error = ''
    preview = ''
    activeTab = 'file'
  }

  function handleClose() {
    reset()
    onClose()
  }

  function tryParse(text: string) {
    try {
      const data = parseJSONC(text)
      const config = validateConfig(data)
      preview = JSON.stringify(config, null, 2).slice(0, 500)
      error = ''
      return config
    } catch (e) {
      error = e instanceof Error ? e.message : 'Invalid config'
      preview = ''
      return null
    }
  }

  function handleFileChange(e: Event) {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const text = reader.result as string
      const config = tryParse(text)
      if (config) {
        loadConfig(config)
        showToast('Config imported from file', 'success')
        handleClose()
      }
    }
    reader.readAsText(file)
  }

  function handlePasteLoad() {
    if (!pasteContent.trim()) {
      error = 'Please paste your config JSON/JSONC'
      return
    }
    const config = tryParse(pasteContent)
    if (config) {
      loadConfig(config)
      showToast('Config imported', 'success')
      handleClose()
    }
  }
</script>

<Modal {open} title="Import Configuration" onClose={handleClose}>
  <div class="space-y-4">
    <div class="flex gap-2 border-b border-gray-200">
      <button
        onclick={() => { activeTab = 'file' }}
        class="px-3 py-2 text-sm font-medium border-b-2 -mb-px {activeTab === 'file' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
      >File</button>
      <button
        onclick={() => { activeTab = 'paste' }}
        class="px-3 py-2 text-sm font-medium border-b-2 -mb-px {activeTab === 'paste' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
      >Paste</button>
    </div>

    {#if activeTab === 'file'}
      <div>
        <label class="block text-sm text-gray-700 mb-2">Select a .json or .jsonc file</label>
        <input
          type="file"
          accept=".jsonc,.json"
          onchange={handleFileChange}
          class="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>
    {:else}
      <div class="space-y-3">
        <textarea
          bind:value={pasteContent}
          rows={10}
          class="w-full px-3 py-2 text-sm font-mono border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Paste your olimpus.jsonc content here..."
        ></textarea>
        <button
          onclick={handlePasteLoad}
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >Load Config</button>
      </div>
    {/if}

    {#if error}
      <div class="p-3 text-sm text-red-700 bg-red-50 rounded-md border border-red-200">
        {error}
      </div>
    {/if}

    {#if preview}
      <div class="p-3 bg-gray-50 rounded-md border">
        <p class="text-xs text-gray-500 mb-1">Preview (truncated):</p>
        <pre class="text-xs text-gray-700 overflow-auto max-h-32">{preview}</pre>
      </div>
    {/if}
  </div>
</Modal>
