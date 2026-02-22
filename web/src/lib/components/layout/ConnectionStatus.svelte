<script lang="ts">
  import type { ConnectionStatus } from '$lib/stores/ui.svelte'

  let { status }: { status: ConnectionStatus } = $props()

  const statusConfig = {
    connected: { color: 'bg-green-500', label: 'Connected' },
    standalone: { color: 'bg-yellow-500', label: 'Standalone' },
    checking: { color: 'bg-gray-400', label: 'Checking...' },
  }

  const cfg = $derived(statusConfig[status])
</script>

<div class="flex items-center gap-1.5 text-xs text-gray-500">
  <span class="w-2 h-2 rounded-full {cfg.color}"></span>
  {cfg.label}
</div>
