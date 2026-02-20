<script lang="ts">
  import type { Snippet } from 'svelte'

  let { label, hint, error, children }: {
    label: string
    hint?: string
    error?: string
    children: Snippet
  } = $props()
</script>

<div class="space-y-1">
  <label class="block text-sm font-medium text-gray-700">{label}</label>
  {#if hint}
    <p class="text-xs text-gray-500">{hint}</p>
  {/if}
  {@render children()}
  {#if error}
    <p class="text-xs text-red-500">{error}</p>
  {/if}
</div>
