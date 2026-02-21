<script lang="ts">
  import { configSnapshot, deleteRule, reorderRules } from '$lib/stores/config.svelte'
  import { showToast } from '$lib/stores/ui.svelte'
  import { ConfirmModal } from '$lib/components/ui/index'

  let { agentName, onAddRule, onEditRule }: {
    agentName: string
    onAddRule: () => void
    onEditRule: (index: number) => void
  } = $props()

  let deleteTarget = $state<number | null>(null)

  const rules = $derived(configSnapshot().meta_agents?.[agentName]?.routing_rules ?? [])

  const matcherBadgeColors: Record<string, string> = {
    keyword: 'bg-blue-100 text-blue-800',
    complexity: 'bg-purple-100 text-purple-800',
    regex: 'bg-orange-100 text-orange-800',
    project_context: 'bg-green-100 text-green-800',
    always: 'bg-gray-100 text-gray-800',
  }

  function handleDelete(index: number) {
    deleteRule(agentName, index)
    showToast('Rule deleted', 'success')
    deleteTarget = null
  }

  function moveUp(index: number) {
    if (index > 0) reorderRules(agentName, index, index - 1)
  }

  function moveDown(index: number) {
    if (index < rules.length - 1) reorderRules(agentName, index, index + 1)
  }

  function matcherSummary(rule: (typeof rules)[number]): string {
    const m = rule.matcher
    switch (m.type) {
      case 'keyword': return `keywords: ${m.keywords.join(', ')} (${m.mode})`
      case 'complexity': return `threshold: ${m.threshold}`
      case 'regex': return `/${m.pattern}/${m.flags ?? ''}`
      case 'project_context': {
        const parts: string[] = []
        if (m.has_files?.length) parts.push(`files: ${m.has_files.join(', ')}`)
        if (m.has_deps?.length) parts.push(`deps: ${m.has_deps.join(', ')}`)
        return parts.join('; ') || 'no conditions'
      }
      case 'always': return 'catch-all'
    }
  }
</script>

<div class="space-y-2">
  <div class="flex items-center justify-between mb-3">
    <span class="text-sm text-gray-500">{rules.length} rule{rules.length !== 1 ? 's' : ''} (first match wins)</span>
    <button onclick={onAddRule} class="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">+ Add Rule</button>
  </div>

  {#each rules as rule, i}
    <div class="flex items-start gap-2 p-3 border border-gray-200 rounded-lg bg-white group">
      <div class="flex flex-col gap-0.5 text-gray-400">
        <button onclick={() => moveUp(i)} disabled={i === 0} class="text-xs hover:text-gray-600 disabled:opacity-30">&uarr;</button>
        <button onclick={() => moveDown(i)} disabled={i === rules.length - 1} class="text-xs hover:text-gray-600 disabled:opacity-30">&darr;</button>
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1">
          <span class="text-xs font-medium text-gray-400">#{i + 1}</span>
          <span class="px-2 py-0.5 text-xs font-medium rounded {matcherBadgeColors[rule.matcher.type]}">{rule.matcher.type}</span>
          <span class="text-sm font-medium text-gray-700">&rarr; {rule.target_agent}</span>
        </div>
        <p class="text-xs text-gray-500 truncate">{matcherSummary(rule)}</p>
        {#if rule.config_overrides}
          <p class="text-xs text-purple-500 mt-0.5">has overrides</p>
        {/if}
      </div>
      <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onclick={() => onEditRule(i)} class="px-2 py-1 text-xs text-blue-600 hover:text-blue-800">Edit</button>
        <button onclick={() => { deleteTarget = i }} class="px-2 py-1 text-xs text-red-500 hover:text-red-700">Delete</button>
      </div>
    </div>
  {/each}

  {#if rules.length === 0}
    <div class="text-center py-6 text-gray-400 text-sm border border-dashed border-gray-300 rounded-lg">
      No routing rules yet. Add one to start routing.
    </div>
  {/if}
</div>

<ConfirmModal
  open={deleteTarget !== null}
  title="Delete Rule"
  message="Are you sure you want to delete this routing rule?"
  onConfirm={() => { if (deleteTarget !== null) handleDelete(deleteTarget) }}
  onClose={() => { deleteTarget = null }}
/>
