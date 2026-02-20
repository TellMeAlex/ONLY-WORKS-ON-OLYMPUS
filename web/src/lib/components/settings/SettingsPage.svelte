<script lang="ts">
  import { configSnapshot, updateSettings } from '$lib/stores/config.svelte'
  import { FormField } from '$lib/components/ui/index'
  import type { Settings } from '$lib/types'

  const settings = $derived(configSnapshot().settings)

  function update(partial: Partial<Settings>) {
    updateSettings({
      namespace_prefix: settings?.namespace_prefix ?? 'olimpus',
      max_delegation_depth: settings?.max_delegation_depth ?? 3,
      ...settings,
      ...partial,
    })
  }
</script>

<div class="max-w-2xl space-y-6">
  <div>
    <h3 class="text-lg font-semibold text-gray-900 mb-1">Settings</h3>
    <p class="text-sm text-gray-500">Global Olimpus configuration settings.</p>
  </div>

  <FormField label="Namespace Prefix" hint="Prefix for custom skills to avoid name collisions">
    <input
      type="text"
      value={settings?.namespace_prefix ?? 'olimpus'}
      oninput={(e) => update({ namespace_prefix: (e.target as HTMLInputElement).value })}
      class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </FormField>

  <FormField label="Max Delegation Depth" hint="Maximum routing chain depth (1-10)">
    <input
      type="number"
      min="1" max="10"
      value={settings?.max_delegation_depth ?? 3}
      oninput={(e) => update({ max_delegation_depth: parseInt((e.target as HTMLInputElement).value) || 3 })}
      class="w-32 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </FormField>

  <div class="border-t border-gray-200 pt-4">
    <h4 class="text-sm font-semibold text-gray-700 mb-3">Execution</h4>
    <div class="space-y-3">
      <label class="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={settings?.ultrawork_enabled ?? false}
          onchange={(e) => update({ ultrawork_enabled: (e.target as HTMLInputElement).checked })}
          class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <span class="text-sm text-gray-700">Ultrawork Mode</span>
      </label>
      <label class="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={settings?.todo_continuation ?? false}
          onchange={(e) => update({ todo_continuation: (e.target as HTMLInputElement).checked })}
          class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <span class="text-sm text-gray-700">Todo Continuation</span>
      </label>
      <label class="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={settings?.verify_before_completion ?? false}
          onchange={(e) => update({ verify_before_completion: (e.target as HTMLInputElement).checked })}
          class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <span class="text-sm text-gray-700">Verify Before Completion</span>
      </label>
    </div>
  </div>

  <div class="border-t border-gray-200 pt-4">
    <h4 class="text-sm font-semibold text-gray-700 mb-3">Code Quality</h4>
    <div class="space-y-3">
      <label class="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={settings?.lsp_refactoring_preferred ?? false}
          onchange={(e) => update({ lsp_refactoring_preferred: (e.target as HTMLInputElement).checked })}
          class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <span class="text-sm text-gray-700">LSP Refactoring Preferred</span>
      </label>
      <label class="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={settings?.aggressive_comment_pruning ?? false}
          onchange={(e) => update({ aggressive_comment_pruning: (e.target as HTMLInputElement).checked })}
          class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <span class="text-sm text-gray-700">Aggressive Comment Pruning</span>
      </label>
    </div>
  </div>
</div>
