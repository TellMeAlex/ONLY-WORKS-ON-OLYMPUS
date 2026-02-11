# JSON Schema for olimpus.jsonc

## Overview

El archivo `assets/olimpus.schema.json` define el esquema JSON Schema Draft-07 para la configuración de Olimpus. Este schema:

1. **Extiende** el schema original de oh-my-opencode vía `allOf`
2. **Define** tipos específicos de Olimpus (meta-agents, routing rules, matchers)
3. **Se genera automáticamente** desde el código TypeScript para mantener sincronización

## Schema Location

```
https://raw.githubusercontent.com/TellMeAlex/ONLY-WORKS-ON-OLYMPUS/main/assets/olimpus.schema.json
```

## Cómo se usa en olimpus.jsonc

Cualquier configuración de Olimpus debe referenciar el schema en el primer campo:

```jsonc
{
  "$schema": "https://raw.githubusercontent.com/nttdata-emea/olimpus/main/assets/olimpus.schema.json",
  
  "meta_agents": {
    // ... resto de configuración
  }
}
```

Esto permite que IDEs como VS Code validen automáticamente el fichero mientras escribes.

## Generación automática

El schema **NO se escribe manualmente**. Se genera automáticamente desde el código TypeScript:

### Flujo de actualización

```
src/config/schema.ts (Zod definitions)
           ↓
      scripts/generate-schema.ts (transforma a JSON Schema)
           ↓
      assets/olimpus.schema.json (resultado)
```

### Comandos

**Generar schema después de cambios en src/config/schema.ts:**
```bash
bun run schema:generate
```

**Validar que el schema sea correcto:**
```bash
bun run schema:validate
```

**Build automático (genera schema al compilar):**
```bash
bun run build
```

## Estructura del Schema

El schema combina dos estructuras vía `allOf`:

### 1. Base Schema (oh-my-opencode)

```json
{
  "$ref": "https://raw.githubusercontent.com/code-yeongyu/oh-my-opencode/master/assets/oh-my-opencode.schema.json"
}
```

Incluye campos que oh-my-opencode soporta:
- `agents` (passthrough)
- `categories` (passthrough)
- `disabled_hooks` (passthrough)
- Etc.

### 2. Olimpus Extensions

Propiedades nuevas definidas por Olimpus:

```json
{
  "meta_agents": { /* MetaAgent definitions */ },
  "settings": { /* OlimpusSettings */ },
  "skills": [ /* array de paths */ ]
}
```

## Definiciones en el Schema

### `MetaAgent`

```json
{
  "base_model": "claude-3-5-sonnet-20241022",
  "delegates_to": ["oracle", "prometheus"],
  "routing_rules": [ /* RoutingRule array */ ],
  "prompt_template": "optional",
  "temperature": 0.3
}
```

### `RoutingRule`

```json
{
  "matcher": { /* one of Matcher types */ },
  "target_agent": "oracle|sisyphus|etc",
  "config_overrides": {
    "model": "optional",
    "temperature": "optional",
    "prompt": "optional",
    "variant": "optional"
  }
}
```

### Matcher Types (discriminated union)

- `KeywordMatcher`: Matches if prompt contains keywords
- `ComplexityMatcher`: Routes based on complexity score
- `RegexMatcher`: Matches regex pattern
- `ProjectContextMatcher`: Checks project files/deps
- `AlwaysMatcher`: Catch-all fallback

## Sincronización con Zod

Cuando modificas `src/config/schema.ts` (Zod schema), debes regenerar el JSON Schema:

```bash
bun run schema:generate
```

Esto garantiza que:
- Los tipos en TypeScript y JSON Schema están sincronizados
- No hay desviaciones entre validación Zod y validación IDE
- Los cambios en matchers se reflejan automáticamente

## Validación en VS Code

Para que VS Code valide tu `olimpus.jsonc` con este schema:

1. Asegúrate de que el primer campo es: `"$schema": "https://...olimpus.schema.json"`
2. VS Code descargará el schema automáticamente
3. Obtendrás validación en tiempo real mientras escribes

Si VS Code no detecta el schema:
- Usa `Ctrl+Shift+P` → "JSON: Change Schema"
- Selecciona el schema de Olimpus

## CI/CD Integration

En tu pipeline CI, añade:

```yaml
- name: Validate Schema
  run: bun run schema:validate
```

Esto verifica que `assets/olimpus.schema.json` sea válido antes de merge.

## Debugging

Si ves errores de validación en el IDE:

1. **Regenera el schema:**
   ```bash
   bun run schema:generate
   ```

2. **Valida que sea correcto:**
   ```bash
   bun run schema:validate
   ```

3. **Verifica que tu JSON es válido:**
   ```bash
   bun run typecheck
   ```

4. **Si persiste, limpia el cache de VS Code:**
   - Abre el schema URL en navegador → F12 → Storage → Clear Site Data
   - Recarga VS Code
