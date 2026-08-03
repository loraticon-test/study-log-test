const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const esbuild = require('esbuild');

const root = path.resolve(__dirname, '..');

const widgetName = 'test';
const appJsName = 'test-app.js';
const cssName = 'test.css';

const devHtmlPath = path.join(root, 'test_v3.5.dev.html');
const htmlPath = path.join(root, 'test_v3.5.html');
const jsDir = path.join(root, 'assets', 'js');
const cssDir = path.join(root, 'assets', 'css');
const tempSrcDir = path.join(root, 'src-generated');
const tempJsxPath = path.join(tempSrcDir, `${widgetName}-app.jsx`);
const outJsPath = path.join(jsDir, appJsName);
const outCssPath = path.join(cssDir, cssName);

fs.mkdirSync(jsDir, { recursive: true });
fs.mkdirSync(cssDir, { recursive: true });
fs.mkdirSync(tempSrcDir, { recursive: true });

if (!fs.existsSync(devHtmlPath)) {
  fs.copyFileSync(htmlPath, devHtmlPath);
}

const html = fs.readFileSync(devHtmlPath, 'utf8');
const babelBlockMatch = html.match(/<script\s+type=["']text\/babel["']>\s*([\s\S]*?)\s*<\/script>/);
if (!babelBlockMatch) {
  throw new Error('Could not find <script type="text/babel"> block.');
}

const styleBlockMatch = html.match(/<style>\s*([\s\S]*?)\s*<\/style>/);
const customCss = styleBlockMatch ? styleBlockMatch[1].trim() : '';

fs.writeFileSync(tempJsxPath, babelBlockMatch[1].trim() + '\n', 'utf8');

const tailwindInputPath = path.join(root, 'src', 'tailwind.css');
const tailwindCli = path.join(root, 'node_modules', 'tailwindcss', 'lib', 'cli.js');
execFileSync(
  process.execPath,
  [tailwindCli, '-c', 'tailwind.config.js', '-i', tailwindInputPath, '-o', outCssPath, '--minify'],
  { cwd: root, stdio: 'inherit' }
);

if (customCss) {
  fs.appendFileSync(outCssPath, `\n${customCss}\n`, 'utf8');
}

esbuild.buildSync({
  entryPoints: [tempJsxPath],
  outfile: outJsPath,
  bundle: false,
  format: 'iife',
  globalName: 'TestApp',
  jsx: 'transform',
  minify: true,
  target: ['es2018'],
  charset: 'utf8',
  legalComments: 'none',
});

let builtHtml = html
  .replace(/\s*<script\s+src=["']https:\/\/unpkg\.com\/@babel\/standalone@[^"']*["']><\/script>/, '')
  .replace(/\s*<script\s+src=["']https:\/\/cdn\.tailwindcss\.com["']><\/script>/, '')
  .replace(/\s*<script>\s*tailwind\.config\s*=\s*\{[\s\S]*?\}\s*<\/script>/, '')
  .replace(/\s*<style>[\s\S]*?<\/style>/, '')
  .replace(
    /(<link\s+rel=["']stylesheet["']\s+href=["']https:\/\/cdn\.jsdelivr\.net\/gh\/orioncactus\/pretendard\/dist\/web\/variable\/pretendardvariable-dynamic-subset\.css["']>)/,
    `$1\n    <link rel="stylesheet" href="./assets/css/${cssName}">`
  )
  .replace(/<script\s+type=["']text\/babel["']>[\s\S]*?<\/script>/, `<script src="./assets/js/${appJsName}"></script>`);

fs.writeFileSync(htmlPath, builtHtml, 'utf8');

console.log(`Updated ${path.basename(htmlPath)}`);
console.log(`Preserved ${path.basename(devHtmlPath)}`);
console.log(`Built assets/js/${appJsName}`);
console.log(`Built assets/css/${cssName}`);
