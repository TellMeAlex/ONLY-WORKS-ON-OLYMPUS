<script lang="ts">
  import { configSnapshot, metaAgentNames } from '$lib/stores/config.svelte'
  import { Select } from '$lib/components/ui/index'
  import { evaluateAllRules } from '$lib/utils/matcher-evaluator'
  import type { RoutingRule } from '$lib/types'

  let selectedAgent = $state('')
  let prompt = $state('')

  interface EvalResult {
    rule: RoutingRule
    matched: boolean
    reason: string
  }

  let results = $state<EvalResult[]>([])
  let hasRun = $state(false)

  function handleEvaluate() {
    const rules = configSnapshot().meta_agents?.[selectedAgent]?.routing_rules ?? []
    results = evaluateAllRules(rules, prompt)
    hasRun = true
  }

  const anyMatch = $derived(results.some(r => r.matched))
  const firstMatch = $derived(results.findIndex(r => r.matched))
</script>

<div class="max-w-3xl space-y-6">
  <div>
    <h3 class="text-lg font-semibold text-gray-900 mb-1">Live Preview</h3>
    <p class="text-sm text-gray-500">Test routing rules against a sample prompt.</p>
  </div>

  <div class="grid grid-cols-2 gap-4">
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Meta-Agent</label>
      <Select
        value={selectedAgent}
        options={metaAgentNames().map(n => ({ value: n, label: n }))}
        onChange={(v) => { selectedAgent = v; hasRun = false; results = [] }}
        placeholder="Select agent..."
      />
    </div>
    <div class="flex items-end">
      <button
        onclick={handleEvaluate}
        disabled={!selectedAgent || !prompt.trim()}
        class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >Evaluate</button>
    </div>
  </div>

  <div>
    <label class="block text-sm font-medium text-gray-700 mb-1">Test Prompt</label>
    <textarea
      bind:value={prompt}
      rows={4}
      class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      placeholder="Enter a prompt to test routing..."
    ></textarea>
  </div>

  {#if hasRun}
    <div class="rounded-lg border {anyMatch ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'} p-3">
      <p class="text-sm font-medium {anyMatch ? 'text-green-800' : 'text-yellow-800'}">
        {#if anyMatch}
          Matched! Routes to: <strong>{results[firstMatch].rule.target_agent}</strong> (rule #{firstMatch + 1})
        {:else}
          No rules matched this prompt.
        {/if}
      </p>
    </div>

    <div class="border border-gray-200 rounded-lg overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">#</th>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Matcher</th>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Target</th>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Detail</th>
          </tr>
        </thead>
        <tbody>
          {#each results as result, i}
            <tr class="border-t {result.matched && i === firstMatch ? 'bg-green-50' : ''}">
              <td class="px-4 py-2 text-gray-600">{i + 1}</td>
              <td class="px-4 py-2">
                <span class="px-2 py-0.5 text-xs font-medium rounded bg-gray-100">{result.rule.matcher.type}</span>
              </td>
              <td class="px-4 py-2 text-gray-700">{result.rule.target_agent}</td>
              <td class="px-4 py-2">
                {#if result.matched && i === firstMatch}
                  <span class="text-green-600 font-medium">&#10003; Winner</span>
                {:else if result.matched}
                  <span class="text-green-500">&#10003; Match</span>
                {:else}
                  <span class="text-gray-400">&mdash; No match</span>
                {/if}
              </td>
              <td class="px-4 py-2 text-xs text-gray-500">{result.reason}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>
