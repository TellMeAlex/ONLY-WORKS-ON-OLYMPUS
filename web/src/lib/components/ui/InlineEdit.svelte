<script lang="ts">
  let { value, onSave, placeholder }: {
    value: string
    onSave: (newValue: string) => void
    placeholder?: string
  } = $props()

  let editing = $state(false)
  let draft = $state(value)

  function startEdit() {
    draft = value
    editing = true
  }

  function save() {
    if (draft.trim() && draft !== value) {
      onSave(draft.trim())
    }
    editing = false
  }

  function cancel() {
    editing = false
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') save()
    if (e.key === 'Escape') cancel()
  }
</script>

{#if editing}
  <input
    type="text"
    bind:value={draft}
    onblur={save}
    onkeydown={handleKeydown}
    class="px-2 py-1 text-sm border border-blue-400 rounded outline-none focus:ring-2 focus:ring-blue-500"
    placeholder={placeholder}
  />
{:else}
  <button
    onclick={startEdit}
    class="text-sm text-gray-800 hover:text-blue-600 cursor-pointer"
  >{value || placeholder || 'Click to edit'}</button>
{/if}
