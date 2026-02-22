<script lang="ts">
  let { activeSection, onNavigate }: {
    activeSection: string
    onNavigate: (section: string) => void
  } = $props()

  const navItems = [
    { id: 'meta_agents', label: 'Meta-Agents' },
    { id: 'providers', label: 'Providers' },
    { id: 'settings', label: 'Settings' },
    { id: 'agents', label: 'Agents' },
    { id: 'categories', label: 'Categories' },
    { id: 'skills', label: 'Skills & Hooks' },
    { id: 'preview', label: 'Live Preview' },
  ]
</script>

<aside class="w-56 bg-gray-900 text-white flex flex-col shrink-0">
  <div class="px-4 py-5 border-b border-gray-700">
    <h1 class="text-lg font-bold tracking-wide">Olimpus</h1>
    <p class="text-xs text-gray-400 mt-0.5">Config Editor</p>
  </div>
  <nav class="flex-1 py-2">
    {#each navItems as item}
      <button
        onclick={() => onNavigate(item.id)}
        class="w-full text-left px-4 py-2.5 text-sm transition-colors {activeSection === item.id ? 'bg-blue-600 text-white font-medium' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}"
      >{item.label}</button>
    {/each}
  </nav>
</aside>
