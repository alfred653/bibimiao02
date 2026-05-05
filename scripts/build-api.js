import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['src/api/_all.ts'],
  outfile: 'dist-api/handlers.js',
  platform: 'node',
  target: 'es2023',
  format: 'esm',
  packages: 'external',
  bundle: true,
});

console.log('Built dist-api/handlers.js');
