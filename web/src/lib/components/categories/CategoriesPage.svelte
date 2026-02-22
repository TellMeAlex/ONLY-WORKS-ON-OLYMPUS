<script lang="ts">
  import { configSnapshot, addCategory, updateCategory, deleteCategory } from '$lib/stores/config.svelte'
  import { showToast } from '$lib/stores/ui.svelte'
  import { ConfirmModal, FormField } from '$lib/components/ui/index'
  import type { CategoryConfig } from '$lib/types'

  const categories = $derived(configSnapshot().categories)
  const categoryEntries = $derived(Object.entries(categories ?? {}))

  let showAddForm = $state(false)
  let newCatName = $state('')
  let editingCat = $state<string | null>(null)
  let deleteTarget = $state<string | null>(null)

  let editModel = $state('')
  let editVariant = $state('')
  let editTemp = $state('')
  let editDescription = $state('')

  function startEdit(name: string) {
    const def = categories?.[name]
    if (!def) return
    editingCat = name
    editModel = def.model ?? ''
    editVariant = def.variant ?? ''
    editTemp = def.temperature?.toString() ?? ''
    editDescription = def.description ?? ''
  }

  function saveEdit() {
    if (!editingCat) return
    const def: CategoryConfig = {
      ...(editModel ? { model: editModel } : {}),
      ...(editVariant ? { variant: editVariant } : {}),
      ...(editTemp ? { temperature: parseFloat(editTemp) } : {}),
      ...(editDescription ? { description: editDescription } : {}),
    }
    updateCategory(editingCat, def)
    showToast(`Updated "${editingCat}"`, 'success')
    editingCat = null
  }

  function handleAdd() {
    const name = newCatName.trim()
    if (!name) return
    addCategory(name, {})
    showToast(`Added "${name}"`, 'success')
    newCatName = ''
    showAddForm = false
    startEdit(name)
  }

  function handleDelete(name: string) {
    deleteCategory(name)
    if (editingCat === name) editingCat = null
    showToast(`Deleted "${name}"`, 'success')
    deleteTarget = null
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') handleAdd()
    if (e.key === 'Escape') { showAddForm = false; newCatName = '' }
  }
</script>

<div class="max-w-2xl space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h3 class="text-lg font-semibold text-gray-900">Categories</h3>
      <p class="text-sm text-gray-500">Define task categories with model/variant overrides.</p>
    </div>
    <button onclick={() => { showAddForm = true }} class="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">+ Add Category</button>
  </div>

  {#if showAddForm}
    <div class="flex gap-2 p-3 bg-gray-50 rounded-lg border">
      <input type="text" bind:value={newCatName} onkeydown={handleKeydown} placeholder="category name" class="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded" />
      <button onclick={handleAdd} class="px-3 py-1.5 text-sm bg-blue-600 text-white rounded">Add</button>
      <button onclick={() => { showAddForm = false; newCatName = '' }} class="px-3 py-1.5 text-sm bg-gray-200 rounded">Cancel</button>
    </div>
  {/if}

  {#each categoryEntries as [name, def]}
    <div class="border border-gray-200 rounded-lg p-4 space-y-3">
      <div class="flex items-center justify-between">
        <h4 class="font-medium text-gray-900">{name}</h4>
        <div class="flex gap-2">
          {#if editingCat === name}
            <button onclick={saveEdit} class="text-xs text-blue-600 hover:text-blue-800">Save</button>
            <button onclick={() => { editingCat = null }} class="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
          {:else}
            <button onclick={() => startEdit(name)} class="text-xs text-blue-600 hover:text-blue-800">Edit</button>
          {/if}
          <button onclick={() => { deleteTarget = name }} class="text-xs text-red-500 hover:text-red-700">Delete</button>
        </div>
      </div>

      {#if editingCat === name}
        <div class="space-y-3 pl-3 border-l-2 border-blue-200">
          <FormField label="Model">
            <input type="text" bind:value={editModel} class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded" />
          </FormField>
          <FormField label="Variant">
            <input type="text" bind:value={editVariant} class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded" />
          </FormField>
          <FormField label="Temperature">
            <input type="text" bind:value={editTemp} class="w-32 px-2 py-1.5 text-sm border border-gray-300 rounded" />
          </FormField>
          <FormField label="Description">
            <input type="text" bind:value={editDescription} class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded" />
          </FormField>
        </div>
      {:else}
        <div class="text-xs text-gray-500 space-y-0.5">
          {#if def.model}<p>Model: {def.model}</p>{/if}
          {#if def.variant}<p>Variant: {def.variant}</p>{/if}
          {#if def.temperature !== undefined}<p>Temperature: {def.temperature}</p>{/if}
          {#if def.description}<p>{def.description}</p>{/if}
          {#if !def.model && !def.variant && !def.temperature && !def.description}
            <p class="text-gray-400 italic">No configuration set</p>
          {/if}
        </div>
      {/if}
    </div>
  {/each}

  {#if categoryEntries.length === 0 && !showAddForm}
    <div class="text-center py-8 text-gray-400 text-sm border border-dashed border-gray-300 rounded-lg">
      No categories configured.
    </div>
  {/if}
</div>

<ConfirmModal
  open={deleteTarget !== null}
  title="Delete Category"
  message={`Delete category "${deleteTarget}"?`}
  onConfirm={() => { if (deleteTarget) handleDelete(deleteTarget) }}
  onClose={() => { deleteTarget = null }}
/>
