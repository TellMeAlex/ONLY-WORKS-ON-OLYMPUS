<script lang="ts">
  import type { Snippet } from 'svelte'

  let { open, title, onClose, children }: {
    open: boolean
    title: string
    onClose: () => void
    children: Snippet
  } = $props()

  function handleBackdrop(e: MouseEvent) {
    if (e.target === e.currentTarget) onClose()
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') onClose()
  }
</script>

{#if open}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    onclick={handleBackdrop}
    onkeydown={handleKeydown}
    role="dialog"
    aria-modal="true"
    aria-label={title}
  >
    <div class="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-auto">
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <h2 class="text-lg font-semibold text-gray-900">{title}</h2>
        <button
          onclick={onClose}
          class="text-gray-400 hover:text-gray-600 text-xl leading-none"
        >&times;</button>
      </div>
      <div class="p-6">
        {@render children()}
      </div>
    </div>
  </div>
{/if}
