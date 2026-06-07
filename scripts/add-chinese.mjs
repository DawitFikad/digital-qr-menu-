import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const paths = {
  trans: resolve(root, 'src/data/translations.ts'),
  ctx: resolve(root, 'src/context/LanguageContext.tsx'),
  data: resolve(root, 'src/data/menuData.ts'),
  page: resolve(root, 'src/app/page.tsx'),
  menuView: resolve(root, 'src/components/MenuView.tsx'),
};

// 1. translations.ts
let t = readFileSync(paths.trans, 'utf-8');
t = t.replace("export type Language = 'en' | 'am' | 'or';", "export type Language = 'en' | 'am' | 'or' | 'zh';");
const zhBlock = `  zh: {
    title: "菜单",
    subtitle: "优质服务与传统风味",
    menu: "菜单",
    language: "语言",
    search: "搜索菜单...",
    breakfast: "早餐",
    lunch: "午餐与晚餐",
    drinks: "饮品",
    burgerPizza: "汉堡与披萨",
    hotDrinks: "热饮",
    coldDrinks: "冷饮",
    alcoholic: "酒精饮料",
    rating: "评分",
    description: "描述",
    ingredients: "配料",
    allergens: "过敏原",
    calories: "卡路里",
    prepTime: "准备时间",
    price: "价格",
    backToMenu: "返回",
    bestSeller: "畅销",
    signature: "招牌",
    newItem: "新品",
    spicy: "辣",
    birr: "比尔",
    min: "分钟",
    kcal: "千卡",
    close: "关闭",
    welcome: "欢迎",
    tagline: "家的味道",
    searchResults: "搜索结果",
    noResults: "未找到结果",
    noItems: "暂无菜品",
    reviews: "评价",
    noReviews: "暂无评价",
    writeReview: "写评价",
    yourName: "您的名字",
    shareThoughts: "分享您的想法...",
    submitReview: "提交评价",
    admin: "管理",
    diet: "饮食",
    fasting: "斋戒",
    nonFasting: "非斋戒",
    all: "全部",
    filter: "筛选",
    designedBy: "由 Kuraz Tech 设计",
    clearSearch: "清除搜索",
  },`;
t = t.slice(0, t.lastIndexOf('};')) + zhBlock + '\n' + t.slice(t.lastIndexOf('};'));
writeFileSync(paths.trans, t, 'utf-8');
console.log('OK translations.ts');

// 2. LanguageContext
let c = readFileSync(paths.ctx, 'utf-8');
c = c.replace("['en', 'am', 'or']", "['en', 'am', 'or', 'zh']");
writeFileSync(paths.ctx, c, 'utf-8');
console.log('OK LanguageContext.tsx');

// 3. menuData.ts: update interface to make zh optional
let d = readFileSync(paths.data, 'utf-8');
// Replace each Record<Language, T> with optional zh
const typeReplacements = [
  ['name: Record<Language, string>', 'name: Record<\'en\' | \'am\' | \'or\', string> & Partial<Record<\'zh\', string>>'],
  ['description: Record<Language, string>', 'description: Record<\'en\' | \'am\' | \'or\', string> & Partial<Record<\'zh\', string>>'],
  ['ingredients: Record<Language, string[]>', 'ingredients: Record<\'en\' | \'am\' | \'or\', string[]> & Partial<Record<\'zh\', string[]>>'],
  ['allergens: Record<Language, string[]>', 'allergens: Record<\'en\' | \'am\' | \'or\', string[]> & Partial<Record<\'zh\', string[]>>'],
];
for (const [from, to] of typeReplacements) {
  d = d.replace(from, to);
}
writeFileSync(paths.data, d, 'utf-8');
console.log('OK menuData.ts');

// 4 & 5. page.tsx and MenuView.tsx: add language picker entry + ?? fallbacks
for (const fp of [paths.page, paths.menuView]) {
  let content = readFileSync(fp, 'utf-8');
  
  // Add zh to LANGUAGES array (only once)
  if (!content.includes('"zh"')) {
    content = content.replace(
      /(code:\s*"or",\s*label:\s*"Afaan Oromoo"\s*)\},/,
      '$1},\n  { code: "zh", label: "中文" },'
    );
  }
  
  // Replace .XXX[language] with (.XXX[language] ?? .XXX.en) for the 4 fields
  for (const field of ['name', 'description', 'ingredients', 'allergens']) {
    // Replace obj.field[language] where obj is a simple identifier chain
    // We match obj.field[language] with word boundaries
    const regex = new RegExp(`([\\w.]+)\\.${field}\\[language\\]`, 'g');
    content = content.replace(regex, (match, obj) => {
      // Already has ?? fallback? skip
      if (content.substring(content.indexOf(match) - 3, content.indexOf(match)).includes('?? ')) return match;
      return `(${obj}.${field}[language] ?? ${obj}.${field}.en)`;
    });
  }
  
  writeFileSync(fp, content, 'utf-8');
  console.log('OK ' + fp.replace(root, ''));
}

console.log('\nDone! Run npm run build to verify.');
