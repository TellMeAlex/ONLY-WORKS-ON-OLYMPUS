<script lang="ts">
  import type { Toast as ToastType } from '$lib/stores/ui.svelte'
  import Toast from './Toast.svelte'

  let { toasts, onDismiss }: {
    toasts: ToastType[]
    onDismiss: (id: string) => void
  } = $props()
</script>

<div class="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
  {#each toasts as toast (toast.id)}
    <Toast {toast} {onDismiss} />
  {/each}
</div>
