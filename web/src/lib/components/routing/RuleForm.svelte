<script lang="ts">
  import type { Matcher, RoutingRule } from '$lib/types'
  import { configSnapshot, addRule, updateRule } from '$lib/stores/config.svelte'
  import { showToast } from '$lib/stores/ui.svelte'
  import { Select } from '$lib/components/ui/index'
  import KeywordMatcherForm from './matchers/KeywordMatcherForm.svelte'
  import ComplexityMatcherForm from './matchers/ComplexityMatcherForm.svelte'
  import RegexMatcherForm from './matchers/RegexMatcherForm.svelte'
  import ProjectContextMatcherForm from './matchers/ProjectContextMatcherForm.svelte'
  import AlwaysMatcherForm from './matchers/AlwaysMatcherForm.svelte'

  let { agentName, ruleIndex, onSave, onCancel }: {
    agentName: string
    ruleIndex?: number
    onSave: () => void
    onCancel: () => void
  } = $props()

  const agentDef = $derived(configSnapshot().meta_agents?.[agentName])
  const existingRule = $derived(
    ruleIndex !== undefined ? agentDef?.routing_rules[ruleIndex] : undefined
  )

  let matcherType = $state<Matcher['type']>(existingRule?.matcher.type ?? 'keyword')
  let matcher = $state<Matcher>(existingRule?.matcher ?? { type: 'keyword', keywords: [''], mode: 'any' })
  let targetAgent = $state(existingRule?.target_agent ?? '')
  let showOverrides = $state(!!existingRule?.config_overrides)
  let overrideModel = $state(existingRule?.config_overrides?.model ?? '')
  let overrideTemp = $state(existingRule?.config_overrides?.temperature?.toString() ?? '')
  let overridePrompt = $state(existingRule?.config_overrides?.prompt ?? '')
  let overrideVariant = $state(existingRule?.config_overrides?.variant ?? '')

  const matcherTypes = [
    { value: 'keyword', label: 'Keyword' },
    { value: 'complexity', label: 'Complexity' },
    { value: 'regex', label: 'Regex' },
    { value: 'project_context', label: 'Project Context' },
    { value: 'always', label: 'Always (catch-all)' },
  ]

  function switchMatcherType(type: string) {
    matcherType = type as Matcher['type']
    switch (type) {
      case 'keyword': matcher = { type: 'keyword', keywords: [''], mode: 'any' }; break
      case 'complexity': matcher = { type: 'complexity', threshold: 'medium' }; break
      case 'regex': matcher = { type: 'regex', pattern: '' }; break
      case 'project_context': matcher = { type: 'project_context' }; break
      case 'always': matcher = { type: 'always' }; break
    }
  }

  function handleSave() {
    if (!targetAgent) {
      showToast('Please select a target agent', 'error')
      return
    }

    let finalMatcher = matcher
    if (finalMatcher.type === 'keyword' && finalMatcher.keywords.filter(k => k.trim()).length === 0) {
      showToast('Add at least one keyword', 'error')
      return
    }

    const overrides = showOverrides
      ? {
          ...(overrideModel ? { model: overrideModel } : {}),
          ...(overrideTemp ? { temperature: parseFloat(overrideTemp) } : {}),
          ...(overridePrompt ? { prompt: overridePrompt } : {}),
          ...(overrideVariant ? { variant: overrideVariant } : {}),
        }
      : undefined

    const rule: RoutingRule = {
      matcher: finalMatcher,
      target_agent: targetAgent,
      ...(overrides && Object.keys(overrides).length > 0 ? { config_overrides: overrides } : {}),
    }

    if (ruleIndex !== undefined) {
      updateRule(agentName, ruleIndex, rule)
      showToast('Rule updated', 'success')
    } else {
      addRule(agentName, rule)
      showToast('Rule added', 'success')
    }
    onSave()
  }
</script>

<div class="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4">
  <h4 class="font-medium text-gray-900">{ruleIndex !== undefined ? 'Edit Rule' : 'Add Rule'}</h4>

  <div>
    <label class="block text-sm font-medium text-gray-700 mb-1">Matcher Type</label>
    <Select
      value={matcherType}
      options={matcherTypes}
      onChange={switchMatcherType}
    />
  </div>

  <div class="pl-3 border-l-2 border-blue-200">
    {#if matcher.type === 'keyword'}
      <KeywordMatcherForm {matcher} onUpdate={(m) => { matcher = m }} />
    {:else if matcher.type === 'complexity'}
      <ComplexityMatcherForm {matcher} onUpdate={(m) => { matcher = m }} />
    {:else if matcher.type === 'regex'}
      <RegexMatcherForm {matcher} onUpdate={(m) => { matcher = m }} />
    {:else if matcher.type === 'project_context'}
      <ProjectContextMatcherForm {matcher} onUpdate={(m) => { matcher = m }} />
    {:else if matcher.type === 'always'}
      <AlwaysMatcherForm />
    {/if}
  </div>

  <div>
    <label class="block text-sm font-medium text-gray-700 mb-1">Target Agent</label>
    {#if agentDef}
      <Select
        value={targetAgent}
        options={agentDef.delegates_to.map(a => ({ value: a, label: a }))}
        onChange={(v) => { targetAgent = v }}
        placeholder="Select target agent..."
      />
    {/if}
  </div>

  <div>
    <label class="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={showOverrides}
        onchange={() => { showOverrides = !showOverrides }}
        class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
      <span class="text-sm text-gray-700">Config Overrides</span>
    </label>
  </div>

  {#if showOverrides}
    <div class="space-y-3 pl-3 border-l-2 border-purple-200">
      <div>
        <label class="block text-xs font-medium text-gray-600 mb-1">Model Override</label>
        <input type="text" bind:value={overrideModel} class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded" placeholder="e.g. gpt-4-turbo" />
      </div>
      <div>
        <label class="block text-xs font-medium text-gray-600 mb-1">Temperature Override</label>
        <input type="text" bind:value={overrideTemp} class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded" placeholder="e.g. 0.3" />
      </div>
      <div>
        <label class="block text-xs font-medium text-gray-600 mb-1">Prompt Override</label>
        <textarea bind:value={overridePrompt} rows={2} class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded font-mono" placeholder="Custom prompt..."></textarea>
      </div>
      <div>
        <label class="block text-xs font-medium text-gray-600 mb-1">Variant</label>
        <input type="text" bind:value={overrideVariant} class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded" placeholder="e.g. tdd" />
      </div>
    </div>
  {/if}

  <div class="flex gap-2 pt-2">
    <button onclick={handleSave} class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Save Rule</button>
    <button onclick={onCancel} class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Cancel</button>
  </div>
</div>
