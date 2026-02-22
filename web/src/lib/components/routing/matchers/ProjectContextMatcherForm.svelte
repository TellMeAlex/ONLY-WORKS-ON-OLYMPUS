<script lang="ts">
  import type { ProjectContextMatcher } from '$lib/types'
  import { ChipInput } from '$lib/components/ui/index'

  let { matcher, onUpdate }: {
    matcher: ProjectContextMatcher
    onUpdate: (m: ProjectContextMatcher) => void
  } = $props()
</script>

<div class="space-y-3">
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-1">Has Files</label>
    <ChipInput
      values={matcher.has_files ?? []}
      onChange={(files) => onUpdate({ ...matcher, has_files: files.length > 0 ? files : undefined })}
      placeholder="e.g. package.json, tsconfig.json"
    />
  </div>
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-1">Has Dependencies</label>
    <ChipInput
      values={matcher.has_deps ?? []}
      onChange={(deps) => onUpdate({ ...matcher, has_deps: deps.length > 0 ? deps : undefined })}
      placeholder="e.g. vitest, jest"
    />
  </div>
  <p class="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded">
    Note: Project context matching is not available in the browser. This matcher will only work in the CLI.
  </p>
</div>
