<script lang="ts">
  import { metaAgentNames, addMetaAgent, deleteMetaAgent, renameMetaAgent } from '$lib/stores/config.svelte'
  import { selectedMetaAgent, setSelectedMetaAgent, showToast } from '$lib/stores/ui.svelte'
  import { ConfirmModal, InlineEdit } from '$lib/components/ui/index'

  let showAddInput = $state(false)
  let newAgentName = $state('')
  let deleteTarget = $state<string | null>(null)

  function handleAdd() {
    const name = newAgentName.trim().toLowerCase().replace(/\s+/g, '_')
    if (!name) return
    if (metaAgentNames().includes(name)) {
      showToast(`Agent "${name}" already exists`, 'error')
      return
    }
    addMetaAgent(name, {
      base_model: '',
      delegates_to: ['sisyphus'],
      routing_rules: [{ matcher: { type: 'always' }, target_agent: 'sisyphus' }],
    })
    setSelectedMetaAgent(name)
    showToast(`Created "${name}"`, 'success')
    newAgentName = ''
    showAddInput = false
  }

  function handleDelete(name: string) {
    deleteMetaAgent(name)
    if (selectedMetaAgent() === name) setSelectedMetaAgent(null)
    showToast(`Deleted "${name}"`, 'success')
    deleteTarget = null
  }

  function handleRename(oldName: string, newName: string) {
    const clean = newName.trim().toLowerCase().replace(/\s+/g, '_')
    if (!clean || clean === oldName) return
    if (metaAgentNames().includes(clean)) {
      showToast(`Agent "${clean}" already exists`, 'error')
      return
    }
    renameMetaAgent(oldName, clean)
    if (selectedMetaAgent() === oldName) setSelectedMetaAgent(clean)
    showToast(`Renamed to "${clean}"`, 'success')
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') handleAdd()
    if (e.key === 'Escape') { showAddInput = false; newAgentName = '' }
  }
</script>

<div class="space-y-1">
  <div class="flex items-center justify-between mb-3">
    <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider">Agents</h3>
    <button
      onclick={() => { showAddInput = true }}
      class="text-xs text-blue-600 hover:text-blue-800 font-medium"
    >+ Add</button>
  </div>

  {#if showAddInput}
    <div class="flex gap-1 mb-2">
      <input
        type="text"
        bind:value={newAgentName}
        onkeydown={handleKeydown}
        placeholder="agent_name"
        class="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
      />
      <button onclick={handleAdd} class="px-2 py-1 text-xs bg-blue-600 text-white rounded">Add</button>
      <button onclick={() => { showAddInput = false; newAgentName = '' }} class="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded">Cancel</button>
    </div>
  {/if}

  {#each metaAgentNames() as name}
    <div
      class="flex items-center group rounded-md transition-colors {selectedMetaAgent() === name ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'}"
    >
      <button
        onclick={() => setSelectedMetaAgent(name)}
        class="flex-1 text-left px-3 py-2 text-sm {selectedMetaAgent() === name ? 'text-blue-700 font-medium' : 'text-gray-700'}"
      >
        <InlineEdit value={name} onSave={(newName) => handleRename(name, newName)} />
      </button>
      <button
        onclick={() => { deleteTarget = name }}
        class="px-2 py-1 text-xs text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
      >&times;</button>
    </div>
  {/each}

  {#if metaAgentNames().length === 0}
    <p class="text-sm text-gray-400 text-center py-4">No meta-agents defined</p>
  {/if}
</div>

<ConfirmModal
  open={deleteTarget !== null}
  title="Delete Meta-Agent"
  message={`Are you sure you want to delete "${deleteTarget}"? This cannot be undone.`}
  onConfirm={() => { if (deleteTarget) handleDelete(deleteTarget) }}
  onClose={() => { deleteTarget = null }}
/>
