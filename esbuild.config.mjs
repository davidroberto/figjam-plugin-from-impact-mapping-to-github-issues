import { build } from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

build({
  entryPoints: [path.resolve(__dirname, 'src/plugin.ts')],
  bundle: true,
  outfile: path.resolve(__dirname, 'dist/code.js'),
  format: 'iife',
  target: 'es2017',
  alias: {
    '@src': path.resolve(__dirname, 'src'),
  },
}).catch(() => process.exit(1));
