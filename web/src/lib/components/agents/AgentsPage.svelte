<script lang="ts">
  import { configSnapshot, addAgent, updateAgent, deleteAgent } from '$lib/stores/config.svelte'
  import { showToast } from '$lib/stores/ui.svelte'
  import { ConfirmModal, FormField } from '$lib/components/ui/index'
  import type { AgentOverride } from '$lib/types'

  const agents = $derived(configSnapshot().agents)
  const agentEntries = $derived(Object.entries(agents ?? {}))

  let showAddForm = $state(false)
  let newAgentName = $state('')
  let editingAgent = $state<string | null>(null)
  let deleteTarget = $state<string | null>(null)

  let editModel = $state('')
  let editTemp = $state('')
  let editPrompt = $state('')
  let editVariant = $state('')
  let editDescription = $state('')

  function startEdit(name: string) {
    const def = agents?.[name]
    if (!def) return
    editingAgent = name
    editModel = def.model ?? ''
    editTemp = def.temperature?.toString() ?? ''
    editPrompt = def.prompt ?? ''
    editVariant = def.variant ?? ''
    editDescription = def.description ?? ''
  }

  function saveEdit() {
    if (!editingAgent) return
    const def: AgentOverride = {
      ...(editModel ? { model: editModel } : {}),
      ...(editTemp ? { temperature: parseFloat(editTemp) } : {}),
      ...(editPrompt ? { prompt: editPrompt } : {}),
      ...(editVariant ? { variant: editVariant } : {}),
      ...(editDescription ? { description: editDescription } : {}),
    }
    updateAgent(editingAgent, def)
    showToast(`Updated "${editingAgent}"`, 'success')
    editingAgent = null
  }

  function handleAdd() {
    const name = newAgentName.trim()
    if (!name) return
    addAgent(name, {})
    showToast(`Added "${name}"`, 'success')
    newAgentName = ''
    showAddForm = false
    startEdit(name)
  }

  function handleDelete(name: string) {
    deleteAgent(name)
    if (editingAgent === name) editingAgent = null
    showToast(`Deleted "${name}"`, 'success')
    deleteTarget = null
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') handleAdd()
    if (e.key === 'Escape') { showAddForm = false; newAgentName = '' }
  }
</script>

<div class="max-w-2xl space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h3 class="text-lg font-semibold text-gray-900">Agent Overrides</h3>
      <p class="text-sm text-gray-500">Customize builtin agent settings.</p>
    </div>
    <button onclick={() => { showAddForm = true }} class="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">+ Add Agent</button>
  </div>

  {#if showAddForm}
    <div class="flex gap-2 p-3 bg-gray-50 rounded-lg border">
      <input type="text" bind:value={newAgentName} onkeydown={handleKeydown} placeholder="agent name" class="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded" />
      <button onclick={handleAdd} class="px-3 py-1.5 text-sm bg-blue-600 text-white rounded">Add</button>
      <button onclick={() => { showAddForm = false; newAgentName = '' }} class="px-3 py-1.5 text-sm bg-gray-200 rounded">Cancel</button>
    </div>
  {/if}

  {#each agentEntries as [name, def]}
    <div class="border border-gray-200 rounded-lg p-4 space-y-3">
      <div class="flex items-center justify-between">
        <h4 class="font-medium text-gray-900">{name}</h4>
        <div class="flex gap-2">
          {#if editingAgent === name}
            <button onclick={saveEdit} class="text-xs text-blue-600 hover:text-blue-800">Save</button>
            <button onclick={() => { editingAgent = null }} class="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
          {:else}
            <button onclick={() => startEdit(name)} class="text-xs text-blue-600 hover:text-blue-800">Edit</button>
          {/if}
          <button onclick={() => { deleteTarget = name }} class="text-xs text-red-500 hover:text-red-700">Delete</button>
        </div>
      </div>

      {#if editingAgent === name}
        <div class="space-y-3 pl-3 border-l-2 border-blue-200">
          <FormField label="Model">
            <input type="text" bind:value={editModel} class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded" placeholder="e.g. claude-3-5-sonnet-20241022" />
          </FormField>
          <FormField label="Temperature">
            <input type="text" bind:value={editTemp} class="w-32 px-2 py-1.5 text-sm border border-gray-300 rounded" placeholder="e.g. 0.3" />
          </FormField>
          <FormField label="Variant">
            <input type="text" bind:value={editVariant} class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded" />
          </FormField>
          <FormField label="Description">
            <input type="text" bind:value={editDescription} class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded" />
          </FormField>
          <FormField label="Prompt">
            <textarea bind:value={editPrompt} rows={3} class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded font-mono"></textarea>
          </FormField>
        </div>
      {:else}
        <div class="text-xs text-gray-500 space-y-0.5">
          {#if def.model}<p>Model: {def.model}</p>{/if}
          {#if def.temperature !== undefined}<p>Temperature: {def.temperature}</p>{/if}
          {#if def.variant}<p>Variant: {def.variant}</p>{/if}
          {#if def.description}<p>Description: {def.description}</p>{/if}
          {#if !def.model && !def.temperature && !def.variant && !def.description}
            <p class="text-gray-400 italic">No overrides configured</p>
          {/if}
        </div>
      {/if}
    </div>
  {/each}

  {#if agentEntries.length === 0 && !showAddForm}
    <div class="text-center py-8 text-gray-400 text-sm border border-dashed border-gray-300 rounded-lg">
      No agent overrides configured. Add one to customize builtin agent behavior.
    </div>
  {/if}
</div>

<ConfirmModal
  open={deleteTarget !== null}
  title="Delete Agent Override"
  message={`Delete override for "${deleteTarget}"?`}
  onConfirm={() => { if (deleteTarget) handleDelete(deleteTarget) }}
  onClose={() => { deleteTarget = null }}
/>
