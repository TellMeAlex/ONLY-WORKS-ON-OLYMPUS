<script lang="ts">
  import { configSnapshot, updateProviders } from '$lib/stores/config.svelte'
  import { showToast } from '$lib/stores/ui.svelte'
  import { FormField, ChipInput } from '$lib/components/ui/index'
  import type { ProviderConfig } from '$lib/types'

  const providers = $derived(configSnapshot().providers)

  function ensureProviders(): ProviderConfig {
    return providers ?? {}
  }

  function handlePriorityChain(values: string[]) {
    updateProviders({ ...ensureProviders(), priority_chain: values.length > 0 ? values : undefined })
  }

  function handleResearchProviders(values: string[]) {
    updateProviders({ ...ensureProviders(), research_providers: values.length > 0 ? values : undefined })
  }

  function handleStrategyProviders(values: string[]) {
    updateProviders({ ...ensureProviders(), strategy_providers: values.length > 0 ? values : undefined })
  }
</script>

<div class="max-w-2xl space-y-6">
  <div>
    <h3 class="text-lg font-semibold text-gray-900 mb-1">Providers</h3>
    <p class="text-sm text-gray-500">Configure LLM provider chains and settings.</p>
  </div>

  <FormField label="Priority Chain" hint="Order of providers to try (first available wins)">
    <ChipInput
      values={providers?.priority_chain ?? []}
      onChange={handlePriorityChain}
      placeholder="e.g. anthropic, openai, google"
    />
  </FormField>

  <FormField label="Research Providers" hint="Providers preferred for research/analysis tasks">
    <ChipInput
      values={providers?.research_providers ?? []}
      onChange={handleResearchProviders}
      placeholder="e.g. anthropic, openai"
    />
  </FormField>

  <FormField label="Strategy Providers" hint="Providers preferred for strategic planning">
    <ChipInput
      values={providers?.strategy_providers ?? []}
      onChange={handleStrategyProviders}
      placeholder="e.g. anthropic"
    />
  </FormField>
</div>
