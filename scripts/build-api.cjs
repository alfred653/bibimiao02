const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['src/api/_all.ts'],
  outfile: 'dist-api/handlers.js',
  platform: 'node',
  target: 'es2023',
  format: 'esm',
  packages: 'external',
  bundle: true,
}).then(() => {
  console.log('Built dist-api/handlers.js');
}).catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
