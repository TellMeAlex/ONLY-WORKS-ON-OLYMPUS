<script lang="ts">
  import { configSnapshot, updateMetaAgent } from '$lib/stores/config.svelte'
  import { metaAgentNames } from '$lib/stores/config.svelte'
  import { FormField, ChipInput } from '$lib/components/ui/index'
  import type { MetaAgentDef } from '$lib/types'

  let { agentName }: { agentName: string } = $props()

  const BUILTIN_AGENTS = [
    'sisyphus', 'hephaestus', 'oracle', 'librarian', 'explore',
    'multimodal-looker', 'metis', 'momus', 'atlas', 'prometheus',
  ]

  const agentDef = $derived(configSnapshot().meta_agents?.[agentName])

  const delegateOptions = $derived([
    ...BUILTIN_AGENTS,
    ...metaAgentNames().filter(n => n !== agentName),
  ])

  function updateField<K extends keyof MetaAgentDef>(field: K, value: MetaAgentDef[K]) {
    const current = configSnapshot().meta_agents?.[agentName]
    if (!current) return
    updateMetaAgent(agentName, { ...current, [field]: value })
  }

  function toggleDelegate(agent: string) {
    const current = configSnapshot().meta_agents?.[agentName]
    if (!current) return
    const delegates = current.delegates_to.includes(agent)
      ? current.delegates_to.filter(d => d !== agent)
      : [...current.delegates_to, agent]
    updateMetaAgent(agentName, { ...current, delegates_to: delegates })
  }
</script>

{#if agentDef}
  <div class="space-y-6">
    <h3 class="text-lg font-semibold text-gray-900 border-b pb-2">Configure: {agentName}</h3>

    <FormField label="Base Model" hint="LLM model identifier (e.g., claude-3-5-sonnet-20241022)">
      <input
        type="text"
        value={agentDef.base_model}
        oninput={(e) => updateField('base_model', (e.target as HTMLInputElement).value)}
        class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="claude-3-5-sonnet-20241022"
      />
    </FormField>

    <FormField label="Temperature" hint="0 = deterministic, 2 = creative">
      <div class="flex items-center gap-3">
        <input
          type="range"
          min="0" max="2" step="0.1"
          value={agentDef.temperature ?? 0}
          oninput={(e) => updateField('temperature', parseFloat((e.target as HTMLInputElement).value))}
          class="flex-1"
        />
        <span class="text-sm text-gray-600 w-10 text-right">{(agentDef.temperature ?? 0).toFixed(1)}</span>
      </div>
    </FormField>

    <FormField label="Delegates To" hint="Agents this meta-agent can route to">
      <div class="grid grid-cols-2 gap-1.5 max-h-48 overflow-auto">
        {#each delegateOptions as agent}
          <label class="flex items-center gap-2 px-2 py-1 rounded text-sm hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              checked={agentDef.delegates_to.includes(agent)}
              onchange={() => toggleDelegate(agent)}
              class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span class={BUILTIN_AGENTS.includes(agent) ? 'text-gray-700' : 'text-purple-700 font-medium'}>{agent}</span>
          </label>
        {/each}
      </div>
    </FormField>

    <FormField label="Prompt Template" hint="Optional system prompt for this meta-agent">
      <textarea
        value={agentDef.prompt_template ?? ''}
        oninput={(e) => updateField('prompt_template', (e.target as HTMLTextAreaElement).value || undefined)}
        rows={4}
        class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Optional system prompt..."
      ></textarea>
    </FormField>
  </div>
{:else}
  <p class="text-gray-400 text-sm">Agent not found</p>
{/if}
