<script lang="ts">
  import { configSnapshot, addSkill, removeSkill, addDisabledHook, removeDisabledHook } from '$lib/stores/config.svelte'
  import { FormField, ChipInput } from '$lib/components/ui/index'

  const snap = $derived(configSnapshot())

  function handleSkillsChange(values: string[]) {
    const current = configSnapshot().skills ?? []
    const added = values.filter(v => !current.includes(v))
    const removed = current.filter(v => !values.includes(v))
    for (const s of removed) removeSkill(s)
    for (const s of added) addSkill(s)
  }

  function handleHooksChange(values: string[]) {
    const current = configSnapshot().disabled_hooks ?? []
    const added = values.filter(v => !current.includes(v))
    const removed = current.filter(v => !values.includes(v))
    for (const h of removed) removeDisabledHook(h)
    for (const h of added) addDisabledHook(h)
  }
</script>

<div class="max-w-2xl space-y-6">
  <div>
    <h3 class="text-lg font-semibold text-gray-900 mb-1">Skills & Hooks</h3>
    <p class="text-sm text-gray-500">Manage custom skill files and disabled hooks.</p>
  </div>

  <FormField label="Skills" hint="Paths to skill markdown files (relative to project root)">
    <ChipInput
      values={snap.skills ?? []}
      onChange={handleSkillsChange}
      placeholder="e.g. docs/skills/my-skill.md"
    />
  </FormField>

  <FormField label="Disabled Hooks" hint="Hooks to disable (pass-through to oh-my-opencode)">
    <ChipInput
      values={snap.disabled_hooks ?? []}
      onChange={handleHooksChange}
      placeholder="e.g. pre-commit"
    />
  </FormField>
</div>
