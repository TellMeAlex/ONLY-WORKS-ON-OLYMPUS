<script lang="ts">
  import type { ComplexityMatcher } from '$lib/types'
  import { Select } from '$lib/components/ui/index'

  let { matcher, onUpdate }: {
    matcher: ComplexityMatcher
    onUpdate: (m: ComplexityMatcher) => void
  } = $props()
</script>

<div>
  <label class="block text-sm font-medium text-gray-700 mb-1">Threshold</label>
  <Select
    value={matcher.threshold}
    options={[
      { value: 'low', label: 'Low' },
      { value: 'medium', label: 'Medium' },
      { value: 'high', label: 'High' },
    ]}
    onChange={(v) => onUpdate({ ...matcher, threshold: v as 'low' | 'medium' | 'high' })}
  />
</div>
