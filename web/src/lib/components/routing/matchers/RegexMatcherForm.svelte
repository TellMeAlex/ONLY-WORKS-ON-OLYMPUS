<script lang="ts">
  import type { RegexMatcher } from '$lib/types'

  let { matcher, onUpdate }: {
    matcher: RegexMatcher
    onUpdate: (m: RegexMatcher) => void
  } = $props()

  let regexError = $state('')

  function validatePattern(pattern: string) {
    try {
      new RegExp(pattern, matcher.flags ?? 'i')
      regexError = ''
    } catch (e) {
      regexError = e instanceof Error ? e.message : 'Invalid regex'
    }
    onUpdate({ ...matcher, pattern })
  }
</script>

<div class="space-y-3">
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-1">Pattern</label>
    <input
      type="text"
      value={matcher.pattern}
      oninput={(e) => validatePattern((e.target as HTMLInputElement).value)}
      class="w-full px-3 py-2 text-sm font-mono border rounded-md {regexError ? 'border-red-300' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500"
      placeholder="(docs|documentation|guide)"
    />
    {#if regexError}
      <p class="text-xs text-red-500 mt-1">{regexError}</p>
    {/if}
  </div>
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-1">Flags</label>
    <input
      type="text"
      value={matcher.flags ?? ''}
      oninput={(e) => onUpdate({ ...matcher, flags: (e.target as HTMLInputElement).value || undefined })}
      class="w-full px-3 py-2 text-sm font-mono border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      placeholder="i"
    />
  </div>
</div>
