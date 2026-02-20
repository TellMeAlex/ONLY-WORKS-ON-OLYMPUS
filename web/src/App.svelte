<script lang="ts">
  import Sidebar from '$lib/components/layout/Sidebar.svelte'
  import TopBar from '$lib/components/layout/TopBar.svelte'
  import MetaAgentPage from '$lib/components/meta-agents/MetaAgentPage.svelte'
  import ProvidersPage from '$lib/components/providers/ProvidersPage.svelte'
  import SettingsPage from '$lib/components/settings/SettingsPage.svelte'
  import AgentsPage from '$lib/components/agents/AgentsPage.svelte'
  import CategoriesPage from '$lib/components/categories/CategoriesPage.svelte'
  import SkillsPage from '$lib/components/skills/SkillsPage.svelte'
  import PreviewPage from '$lib/components/preview/PreviewPage.svelte'
  import ImportModal from '$lib/components/import/ImportModal.svelte'
  import { ToastContainer } from '$lib/components/ui/index'
  import { createPersistence, type ConfigPersistence } from '$lib/api/index'
  import { loadConfig, configSnapshot, isDirty, DEFAULT_CONFIG } from '$lib/stores/config.svelte'
  import { toasts, dismissToast, showToast, setConnectionStatus, connectionStatus } from '$lib/stores/ui.svelte'
  import { decodeConfigFromURL } from '$lib/utils/config-io'

  let activeSection = $state<string>('meta_agents')
  let importModalOpen = $state(false)
  let persistence = $state<ConfigPersistence | null>(null)
  let loading = $state(true)
  let healthCheckInterval: ReturnType<typeof setInterval> | null = null

  $effect(() => {
    initApp()
    return () => {
      if (healthCheckInterval) clearInterval(healthCheckInterval)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  })

  $effect(() => {
    if (connectionStatus() === 'standalone' && persistence) {
      persistence.scheduleAutoSave?.(configSnapshot())
    }
  })

  async function initApp() {
    loading = true
    try {
      const urlConfig = decodeConfigFromURL()
      const p = await createPersistence()
      persistence = p
      setConnectionStatus(p.getMode())
      if (urlConfig) {
        loadConfig(urlConfig)
        showToast('Config loaded from URL', 'info')
      } else {
        try {
          const config = await p.load()
          loadConfig(config)
        } catch {
          loadConfig(DEFAULT_CONFIG)
        }
      }
      if (p.getMode() === 'connected') {
        healthCheckInterval = setInterval(async () => {
          const available = await p.isAvailable()
          if (!available) {
            setConnectionStatus('standalone')
            showToast('Lost connection to server. Switched to standalone mode.', 'error')
            if (healthCheckInterval) clearInterval(healthCheckInterval)
          }
        }, 30000)
      }
    } catch {
      loadConfig(DEFAULT_CONFIG)
      setConnectionStatus('standalone')
    } finally {
      loading = false
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
  }

  function handleBeforeUnload(e: BeforeUnloadEvent) {
    if (isDirty()) e.preventDefault()
  }
</script>

{#if loading}
  <div class="flex h-screen items-center justify-center bg-white">
    <div class="text-center">
      <div class="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
      <p class="text-sm text-gray-500">Loading config...</p>
    </div>
  </div>
{:else}
  <div class="flex h-screen bg-white overflow-hidden">
    <Sidebar {activeSection} onNavigate={(section) => activeSection = section} />
    <div class="flex flex-col flex-1 min-w-0">
      <TopBar {activeSection} onImport={() => importModalOpen = true} />
      <main class="flex-1 overflow-auto p-6">
        {#if activeSection === 'meta_agents'}
          <MetaAgentPage />
        {:else if activeSection === 'providers'}
          <ProvidersPage />
        {:else if activeSection === 'settings'}
          <SettingsPage />
        {:else if activeSection === 'agents'}
          <AgentsPage />
        {:else if activeSection === 'categories'}
          <CategoriesPage />
        {:else if activeSection === 'skills'}
          <SkillsPage />
        {:else if activeSection === 'preview'}
          <PreviewPage />
        {/if}
      </main>
    </div>
  </div>
{/if}

<ImportModal open={importModalOpen} onClose={() => importModalOpen = false} />
<ToastContainer toasts={toasts()} onDismiss={dismissToast} />
