<script lang="ts">
  let { value, options, onChange, placeholder }: {
    value: string
    options: { value: string; label: string }[]
    onChange: (newValue: string) => void
    placeholder?: string
  } = $props()
</script>

<select
  {value}
  onchange={(e) => onChange((e.target as HTMLSelectElement).value)}
  class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
>
  {#if placeholder}
    <option value="" disabled>{placeholder}</option>
  {/if}
  {#each options as opt}
    <option value={opt.value}>{opt.label}</option>
  {/each}
</select>
