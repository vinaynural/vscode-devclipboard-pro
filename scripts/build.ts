import * as esbuild from 'esbuild';
import { execSync } from 'child_process';
import path from 'path';

const args = process.argv.slice(2);
const isWatch = args.includes('--watch');
const isProduction = args.includes('--production');

async function build() {
  // 1. Build Extension
  console.log('Building extension...');
  const extensionCtx = await esbuild.context({
    entryPoints: ['src/extension.ts'],
    bundle: true,
    outfile: 'dist/extension.js',
    external: ['vscode'],
    format: 'cjs',
    platform: 'node',
    minify: isProduction,
    sourcemap: !isProduction,
    define: {
      'process.env.NODE_ENV': isProduction ? '"production"' : '"development"'
    }
  });

  if (isWatch) {
    await extensionCtx.watch();
  } else {
    await extensionCtx.rebuild();
    await extensionCtx.dispose();
  }

  // 2. Build Webview
  console.log('Building webview...');
  const webviewPath = path.join(process.cwd(), 'webview-ui');
  const viteCmd = isWatch ? 'npm run dev' : 'npm run build';
  
  try {
    // Run vite build (we assume vite is configured to output to ../dist/webview)
    execSync(`cd ${webviewPath} && npm install && ${viteCmd}`, { stdio: 'inherit' });
  } catch (err) {
    console.error('Webview build failed', err);
  }
}

build().catch(err => {
  console.error(err);
  process.exit(1);
});
