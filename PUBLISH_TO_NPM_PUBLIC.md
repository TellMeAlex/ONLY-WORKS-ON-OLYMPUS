# Publicar `only-works-on-olympus` en NPM Público

## Resumen
Convertir el paquete de privado (GitHub Packages con scope `@tellmealex`) a **público en NPM Registry** sin scope, bajo el nombre `only-works-on-olympus`.

---

## ⚠️ Advertencias Importantes

1. **Cambio de Privacidad**: El paquete será PÚBLICO (cualquiera puede verlo e instalarlo)
2. **Cambio de Ubicación**: Se mueve de GitHub Package Registry → npm.js.com (público)
3. **Cambio de Nombre**: `@tellmealex/only-works-on-olympus` → `only-works-on-olympus`
4. **Cambio de Registry**: Necesitarás cuenta en npmjs.com
5. **Reversible**: Puedes unpublish en 72 horas de la primera publicación

---

## Paso 1: Verificar Disponibilidad del Nombre

```bash
npm search only-works-on-olympus
```

**Esperado**: No debe haber otro paquete con este nombre.

---

## Paso 2: Crear Cuenta en npmjs.com (Si No Tienes)

1. Ve a: https://www.npmjs.com/signup
2. Completa registro (email, usuario, contraseña)
3. Verifica email
4. **Guarda tus credenciales**

---

## Paso 3: Loguear en npm CLI

```bash
npm login
```

**Ingresa**:
- Username: tu usuario de npmjs.com
- Password: tu contraseña
- Email: email registrado

**Verificación**:
```bash
npm whoami
# Debe mostrar tu username de npmjs.com
```

---

## Paso 4: Actualizar package.json

Cambia el nombre del paquete:

```json
{
  "name": "only-works-on-olympus",
  "version": "0.1.0",
  "description": "A meta-orchestrator for oh-my-opencode that routes requests to specialized agents using intelligent matching rules",
  "main": "dist/index.js",
  "type": "module",
  "types": "dist/index.d.ts",
  "repository": {
    "type": "git",
    "url": "https://github.com/TellMeAlex/ONLY-WORKS-ON-OLYMPUS.git"
  },
  "homepage": "https://github.com/TellMeAlex/ONLY-WORKS-ON-OLYMPUS#readme",
  "bugs": {
    "url": "https://github.com/TellMeAlex/ONLY-WORKS-ON-OLYMPUS/issues"
  },
  "scripts": {
    "build": "bun build src/index.ts --outdir dist --target bun",
    "typecheck": "bunx tsc --noEmit"
  },
  "keywords": [
    "opencode",
    "plugin",
    "meta-agent",
    "routing",
    "orchestrator"
  ],
  "license": "MIT",
  "dependencies": {
    "oh-my-opencode": "^3.4.0",
    "@opencode-ai/plugin": "^1.1.19",
    "@opencode-ai/sdk": "^1.1.19",
    "zod": "^4.1.8",
    "jsonc-parser": "^3.3.1"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "typescript": "^5"
  },
  "peerDependencies": {
    "@opencode-ai/plugin": "^1.1.19",
    "@opencode-ai/sdk": "^1.1.19"
  }
}
```

**Cambios clave**:
- `"name": "only-works-on-olympus"` (SIN `@tellmealex/`)
- `"license": "MIT"` (recomendado para públicos)
- `"keywords": [...]` (ayuda en búsquedas)

---

## Paso 5: Actualizar .npmrc

Cambia el registry a npm público:

```bash
cd /Users/adelafde/dev/NTT/olimpo

# Reemplaza el .npmrc actual con:
cat > .npmrc << 'NPMRC'
registry=https://registry.npmjs.org/
NPMRC
```

**Verificación**:
```bash
npm config get registry
# Debe mostrar: https://registry.npmjs.org/
```

---

## Paso 6: Construir el Paquete

```bash
cd /Users/adelafde/dev/NTT/olimpo
rm -rf dist/
bun run build
```

**Verificación**:
```bash
ls -lah dist/index.js
# Debe existir y tener ~2.88 MB
```

---

## Paso 7: Test de Publicación (Dry-Run)

```bash
npm publish --dry-run
```

**Esperado**:
```
npm notice name:          only-works-on-olympus
npm notice version:       0.1.0
npm notice filename:      only-works-on-olympus-0.1.0.tgz
npm notice tarball size:  620.9 kB
npm notice unpacked size: 3.0 MB
npm notice shasum:        [sha]
npm notice integrity:     sha512-[...]
npm notice total files:   29
```

---

## Paso 8: Publicar Realmente

```bash
npm publish
```

**Esperado**:
```
npm notice Publishing to https://registry.npmjs.org/
+ only-works-on-olympus@0.1.0
```

---

## Paso 9: Verificar Publicación

### En npm Registry

```bash
npm view only-works-on-olympus
```

**Debe retornar**:
```
only-works-on-olympus@0.1.0 | MIT | deps: 5 | versions: 1

https://github.com/TellMeAlex/ONLY-WORKS-ON-OLYMPUS#readme

dist
.tarball: https://registry.npmjs.org/only-works-on-olympus/-/only-works-on-olympus-0.1.0.tgz
...
```

### En Web

Ve a: `https://www.npmjs.com/package/only-works-on-olympus`

---

## Paso 10: Git Commit

Commitea los cambios:

```bash
cd /Users/adelafde/dev/NTT/olimpo
git add package.json .npmrc
git commit -m "refactor: publish as public npm package (only-works-on-olympus)

- Changed from scoped @tellmealex/only-works-on-olympus to only-works-on-olympus
- Switched from GitHub Package Registry to npm public registry
- Made package publicly available at https://www.npmjs.com/package/only-works-on-olympus
- Updated .npmrc to use npm registry (not GitHub)
- Version: 0.1.0"

git push origin main
```

---

## Paso 11: Crear Tag de Release

```bash
git tag -a v0.1.0-public -m "Release only-works-on-olympus v0.1.0 to npm public registry"
git push origin v0.1.0-public
```

---

## Paso 12: Actualizar README

Actualiza `README.md` con nuevas instrucciones de instalación:

```markdown
## Installation

### npm
```bash
npm install only-works-on-olympus
```

### Bun
```bash
bun install only-works-on-olympus
```

### Yarn
```bash
yarn add only-works-on-olympus
```

## Usage in OpenCode

Edit `.opencode.jsonc`:
```jsonc
{
  "plugins": ["only-works-on-olympus"]
}
```

No se requiere configuración especial de .npmrc (es un paquete público).
```

---

## Verificación Final

### Local Test
```bash
mkdir /tmp/only-works-test
cd /tmp/only-works-test
npm init -y
npm install only-works-on-olympus
ls node_modules/only-works-on-olympus/
# Debe existir dist/index.js
```

### OpenCode Integration
```jsonc
// ~/.opencode/opencode.jsonc
{
  "plugins": ["only-works-on-olympus"]
}
```

Sin necesidad de .npmrc especial (es público).

---

## Rollback (Si Es Necesario)

Si dentro de 72 horas necesitas revertir:

```bash
npm unpublish only-works-on-olympus@0.1.0 --force
```

**Nota**: Solo funciona dentro de 72 horas de la publicación.

---

## Diferencias: Privado vs Público

| Aspecto | Privado (@tellmealex/...) | Público (only-works-on-olympus) |
|---------|---------------------------|--------------------------------|
| Registry | GitHub Package Registry | npm.js.com |
| Acceso | Solo usuarios autorizados | Cualquiera |
| Autenticación | GitHub PAT requerido | No requiere |
| .npmrc | Configuración especial | Sin necesidad |
| Scope | `@tellmealex/` | Sin scope |
| URL | npm.pkg.github.com | npmjs.com |

---

## Próximos Pasos

Una vez publicado en npm público:

1. ✅ Actualizar OpenCode config para usar `only-works-on-olympus`
2. ✅ Remover bun link local
3. ✅ Publicar en comunidades (DEV.to, npm trending, etc.)
4. ✅ Documentar changelog
