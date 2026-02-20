import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['src/index.ts'],
  outfile: 'dist-node/index.js',
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'esm',
  external: ['jsonc-parser', 'oh-my-opencode', '@opencode-ai/plugin', '@opencode-ai/sdk', 'zod'],
  sourcemap: true,
  minify: false,
});

console.log('✅ Build complete: dist-node/index.js');
