<script lang="ts">
  import type { KeywordMatcher } from '$lib/types'
  import { ChipInput, Select } from '$lib/components/ui/index'

  let { matcher, onUpdate }: {
    matcher: KeywordMatcher
    onUpdate: (m: KeywordMatcher) => void
  } = $props()
</script>

<div class="space-y-3">
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-1">Keywords</label>
    <ChipInput
      values={matcher.keywords}
      onChange={(kw) => onUpdate({ ...matcher, keywords: kw })}
      placeholder="Add keyword..."
    />
  </div>
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-1">Mode</label>
    <Select
      value={matcher.mode}
      options={[{ value: 'any', label: 'Any (match at least one)' }, { value: 'all', label: 'All (match every keyword)' }]}
      onChange={(v) => onUpdate({ ...matcher, mode: v as 'any' | 'all' })}
    />
  </div>
</div>
