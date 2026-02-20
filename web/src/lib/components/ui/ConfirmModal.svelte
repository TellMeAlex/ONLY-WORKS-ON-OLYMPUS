<script lang="ts">
  let { open, title, message, onConfirm, onClose }: {
    open: boolean
    title: string
    message: string
    onConfirm: () => void
    onClose: () => void
  } = $props()

  function handleConfirm() {
    onConfirm()
    onClose()
  }

  function handleBackdrop(e: MouseEvent) {
    if (e.target === e.currentTarget) onClose()
  }
</script>

{#if open}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    onclick={handleBackdrop}
    role="dialog"
    aria-modal="true"
    aria-label={title}
  >
    <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
      <div class="px-6 py-4 border-b border-gray-200">
        <h2 class="text-lg font-semibold text-gray-900">{title}</h2>
      </div>
      <div class="px-6 py-4">
        <p class="text-gray-600">{message}</p>
      </div>
      <div class="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
        <button
          onclick={onClose}
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
        >Cancel</button>
        <button
          onclick={handleConfirm}
          class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
        >Confirm</button>
      </div>
    </div>
  </div>
{/if}
