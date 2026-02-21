<script lang="ts">
  import type { Toast } from '$lib/stores/ui.svelte'

  let { toast, onDismiss }: {
    toast: Toast
    onDismiss: (id: string) => void
  } = $props()

  const colorMap = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  }
</script>

<div class="flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white {colorMap[toast.type]}">
  <span class="flex-1 text-sm">{toast.message}</span>
  <button
    onclick={() => onDismiss(toast.id)}
    class="text-white/80 hover:text-white text-lg leading-none"
  >&times;</button>
</div>
