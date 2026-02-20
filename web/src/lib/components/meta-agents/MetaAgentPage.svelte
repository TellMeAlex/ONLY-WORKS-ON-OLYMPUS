<script lang="ts">
  import MetaAgentList from './MetaAgentList.svelte'
  import MetaAgentForm from './MetaAgentForm.svelte'
  import RoutingPage from '$lib/components/routing/RoutingPage.svelte'
  import { selectedMetaAgent } from '$lib/stores/ui.svelte'
</script>

<div class="flex gap-6 h-full">
  <div class="w-72 shrink-0 border-r border-gray-200 pr-4">
    <MetaAgentList />
  </div>
  <div class="flex-1 min-w-0 overflow-auto">
    {#if selectedMetaAgent()}
      <div class="space-y-8">
        <MetaAgentForm agentName={selectedMetaAgent()!} />
        <div class="border-t border-gray-200 pt-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Routing Rules</h3>
          <RoutingPage agentName={selectedMetaAgent()!} />
        </div>
      </div>
    {:else}
      <div class="flex items-center justify-center h-full">
        <div class="text-center text-gray-400">
          <p class="text-lg">Select a meta-agent</p>
          <p class="text-sm mt-1">or create a new one from the sidebar</p>
        </div>
      </div>
    {/if}
  </div>
</div>
