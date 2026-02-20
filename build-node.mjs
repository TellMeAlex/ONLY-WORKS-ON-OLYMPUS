import { build } from 'esbuild';
import { mkdir, writeFile } from 'fs/promises';

async function buildNode() {
  try {
    await mkdir('dist-node', { recursive: true });

    await build({
      entryPoints: ['src/index.ts'],
      outfile: 'dist-node/index.js',
      bundle: true,
      format: 'esm',
      platform: 'node',
      target: 'node18',
      external: [
        'zod',
        'jsonc-parser',
        'oh-my-opencode',
        '@opencode-ai/plugin',
        '@opencode-ai/sdk',
      ],
      packages: 'external',
      sourcemap: true,
    });

    console.log('✅ Node.js build completed');
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

buildNode();
