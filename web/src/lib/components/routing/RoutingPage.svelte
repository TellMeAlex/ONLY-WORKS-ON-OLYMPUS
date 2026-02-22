<script lang="ts">
  import { metaAgentNames } from '$lib/stores/config.svelte'
  import RuleForm from './RuleForm.svelte'
  import RuleList from './RuleList.svelte'
  import { Select } from '$lib/components/ui/index'

  let { agentName: agentNameProp }: { agentName?: string } = $props()

  let internalAgent = $state<string>('')
  let showRuleForm = $state(false)
  let editingRuleIndex = $state<number | undefined>(undefined)

  const resolvedAgent = $derived(agentNameProp ?? internalAgent)

  function handleAddRule() {
    editingRuleIndex = undefined
    showRuleForm = true
  }

  function handleEditRule(i: number) {
    editingRuleIndex = i
    showRuleForm = true
  }

  function handleFormDone() {
    showRuleForm = false
    editingRuleIndex = undefined
  }
</script>

{#if !agentNameProp}
  <div class="mb-4">
    <label class="block text-sm font-medium text-gray-700 mb-1">Select Meta-Agent</label>
    <Select
      value={internalAgent}
      options={metaAgentNames().map(n => ({ value: n, label: n }))}
      onChange={(v) => { internalAgent = v }}
      placeholder="Choose an agent..."
    />
  </div>
{/if}

{#if resolvedAgent}
  {#if showRuleForm}
    <RuleForm
      agentName={resolvedAgent}
      ruleIndex={editingRuleIndex}
      onSave={handleFormDone}
      onCancel={handleFormDone}
    />
  {:else}
    <RuleList
      agentName={resolvedAgent}
      onAddRule={handleAddRule}
      onEditRule={handleEditRule}
    />
  {/if}
{:else if !agentNameProp}
  <p class="text-sm text-gray-400">Select a meta-agent to manage its routing rules.</p>
{/if}
