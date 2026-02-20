<script lang="ts">
  let { values, onChange, placeholder }: {
    values: string[]
    onChange: (newValues: string[]) => void
    placeholder?: string
  } = $props()

  let inputValue = $state('')

  function addChip() {
    const trimmed = inputValue.trim()
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed])
    }
    inputValue = ''
  }

  function removeChip(chip: string) {
    onChange(values.filter(v => v !== chip))
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addChip()
    }
    if (e.key === 'Backspace' && inputValue === '' && values.length > 0) {
      onChange(values.slice(0, -1))
    }
  }
</script>

<div class="flex flex-wrap items-center gap-1 p-2 border border-gray-300 rounded-md bg-white min-h-[2.5rem]">
  {#each values as chip}
    <span class="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
      {chip}
      <button
        onclick={() => removeChip(chip)}
        class="text-blue-600 hover:text-blue-800 leading-none"
      >&times;</button>
    </span>
  {/each}
  <input
    type="text"
    bind:value={inputValue}
    onkeydown={handleKeydown}
    placeholder={values.length === 0 ? (placeholder ?? 'Type and press Enter') : ''}
    class="flex-1 min-w-[80px] text-sm outline-none bg-transparent"
  />
</div>
