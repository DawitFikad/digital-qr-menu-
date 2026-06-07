import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// Read the menuData.ts source
const src = readFileSync(resolve(root, 'src/data/menuData.ts'), 'utf-8');

// Strip TypeScript by removing type annotations, interfaces, imports, etc.
let js = src
  // Remove imports
  .replace(/^import .+;$/gm, '')
  // Remove interface definitions
  .replace(/export interface \w+[\s\S]*?^\}/gm, '')
  // Remove type annotations on variables: `: Type[]` `: Type` `as const`
  .replace(/:\s*(?:\w+(?:<[^>]+>)?(?:\[\])?(?:\s*\|\s*\w+(?:<[^>]+>)?(?:\[\])?)*)/g, '')
  .replace(/\bas const\b/g, '')
  // Convert `export const menuItems` to `const menuItems`
  .replace(/^export /gm, '')
  // Remove trailing commas before ] or }
  .replace(/,(\s*[\]}])/g, '$1')
  .trim();

// We need menuItems to be the default export for ESM
// Actually, let's just evaluate and capture menuItems
const code = `
const __items = ${js.match(/const menuItems\s*=\s*([\s\S]+?);$/m)?.[1] || '[]'};
__items;
`;

try {
  const items = eval(code);
  writeFileSync(resolve(root, 'menu.json'), JSON.stringify(items, null, 2), 'utf-8');
  console.log(`Generated menu.json with ${items.length} items`);
} catch (e) {
  console.error('Failed to evaluate menu data:', e.message);
  
  // Fallback: try a simpler regex extraction
  const match = js.match(/const menuItems\s*=\s*(\[[\s\S]*\])\s*;/);
  if (match) {
    try {
      const items = eval(match[1]);
      writeFileSync(resolve(root, 'menu.json'), JSON.stringify(items, null, 2), 'utf-8');
      console.log(`Generated menu.json with ${items.length} items (fallback)`);
    } catch (e2) {
      console.error('Fallback also failed:', e2.message);
      process.exit(1);
    }
  } else {
    console.error('Could not extract menuItems array from source');
    process.exit(1);
  }
}
