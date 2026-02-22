<script lang="ts">
  import ConnectionStatus from './ConnectionStatus.svelte'
  import { configSnapshot, markClean, isDirty } from '$lib/stores/config.svelte'
  import { connectionStatus, showToast } from '$lib/stores/ui.svelte'
  import { stringifyConfig, downloadAsFile, encodeConfigToURL, copyToClipboard } from '$lib/utils/config-io'
  import { createPersistence } from '$lib/api/persistence'

  let { activeSection, onImport }: {
    activeSection: string
    onImport: () => void
  } = $props()

  const sectionTitles: Record<string, string> = {
    meta_agents: 'Meta-Agents',
    providers: 'Providers',
    settings: 'Settings',
    agents: 'Agents',
    categories: 'Categories',
    skills: 'Skills & Hooks',
    preview: 'Live Preview',
  }

  async function handleExport() {
    const content = stringifyConfig(configSnapshot())
    downloadAsFile('olimpus.jsonc', content)
    showToast('Config exported', 'success')
  }

  async function handleShare() {
    const url = encodeConfigToURL(configSnapshot())
    await copyToClipboard(url)
    showToast('URL copied!', 'success')
  }

  async function handleSave() {
    try {
      const persistence = await createPersistence()
      await persistence.save(configSnapshot())
      markClean()
      showToast('Saved', 'success')
    } catch (err) {
      showToast(`Save failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error')
    }
  }
</script>

<header class="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white shrink-0">
  <div class="flex items-center gap-3">
    <h2 class="text-lg font-semibold text-gray-900">{sectionTitles[activeSection] ?? activeSection}</h2>
    {#if isDirty()}
      <span class="text-xs text-amber-600 font-medium px-2 py-0.5 bg-amber-50 rounded">Unsaved changes</span>
    {/if}
  </div>
  <div class="flex items-center gap-3">
    <ConnectionStatus status={connectionStatus()} />
    <button
      onclick={onImport}
      class="px-3 py-1.5 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
    >Import</button>
    <button
      onclick={handleExport}
      class="px-3 py-1.5 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
    >Export</button>
    <button
      onclick={handleShare}
      class="px-3 py-1.5 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
    >Share</button>
    <button
      onclick={handleSave}
      class="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
    >Save</button>
  </div>
</header>
