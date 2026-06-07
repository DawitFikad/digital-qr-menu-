export type Language = 'en' | 'am' | 'or' | 'zh';

export interface Translations {
  title: string;
  subtitle: string;
  menu: string;
  language: string;
  search: string;
  breakfast: string;
  lunch: string;
  drinks: string;
  burgerPizza: string;
  hotDrinks: string;
  coldDrinks: string;
  alcoholic: string;
  rating: string;
  description: string;
  ingredients: string;
  allergens: string;
  calories: string;
  prepTime: string;
  price: string;
  backToMenu: string;
  bestSeller: string;
  signature: string;
  newItem: string;
  spicy: string;
  birr: string;
  min: string;
  kcal: string;
  close: string;
  welcome: string;
  tagline: string;
  searchResults: string;
  noResults: string;
  noItems: string;
  reviews: string;
  noReviews: string;
  writeReview: string;
  yourName: string;
  shareThoughts: string;
  submitReview: string;
  admin: string;
  diet: string;
  fasting: string;
  nonFasting: string;
  all: string;
  filter: string;
  designedBy: string;
  clearSearch: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    title: "Menu",
    subtitle: "Premium Hospitality & Traditional Flavors",
    menu: "Our Menu",
    language: "Language",
    search: "Search menu...",
    breakfast: "Breakfast",
    lunch: "Lunch & Dinner",
    drinks: "Drinks",
    burgerPizza: "Burger & Pizza",
    hotDrinks: "Hot",
    coldDrinks: "Cold",
    alcoholic: "Alcoholic",
    rating: "Rating",
    description: "Description",
    ingredients: "Ingredients",
    allergens: "Allergens",
    calories: "Calories",
    prepTime: "Prep Time",
    price: "Price",
    backToMenu: "Back",
    bestSeller: "Best Seller",
    signature: "Signature",
    newItem: "New",
    spicy: "Spicy",
    birr: "ETB",
    min: "min",
    kcal: "kcal",
    close: "Close",
    welcome: "Welcome",
    tagline: "A Taste of Home",
    searchResults: "Search Results",
    noResults: "No results found",
    noItems: "No items available",
    reviews: "Reviews",
    noReviews: "No reviews yet",
    writeReview: "Write a Review",
    yourName: "Your name",
    shareThoughts: "Share your thoughts...",
    submitReview: "Submit Review",
    admin: "Admin",
    diet: "Diet",
    fasting: "Fasting",
    nonFasting: "Non-Fasting",
    all: "All",
    filter: "Filter",
    designedBy: "Designed by Kuraz Tech",
    clearSearch: "Clear search",
  },
  am: {
    title: "ሜኑ",
    subtitle: "ምርጥ መስተንግዶ እና ባህላዊ ጣዕሞች",
    menu: "ማውጫ",
    language: "ቋንቋ",
    search: "ሜኑ ፈልግ...",
    breakfast: "ቁርስ",
    lunch: "ምሳ እና እራት",
    drinks: "መጠጦች",
    burgerPizza: "በርገር እና ፒዛ",
    hotDrinks: "ትኩስ",
    coldDrinks: "ቀዝቃዛ",
    alcoholic: "አልኮል",
    rating: "ደረጃ",
    description: "መግለጫ",
    ingredients: "ንጥረ ነገሮች",
    allergens: "አለርጂዎች",
    calories: "ካሎሪ",
    prepTime: "የዝግጅት ጊዜ",
    price: "ዋጋ",
    backToMenu: "ተመለስ",
    bestSeller: "ምርጥ",
    signature: "ልዩ",
    newItem: "አዲስ",
    spicy: "ቅመም",
    birr: "ብር",
    min: "ደቂቃ",
    kcal: "ካሎሪ",
    close: "ዝጋ",
    welcome: "እንኳን ደህና መጣችሁ",
    tagline: "የቤት ጣዕም",
    searchResults: "የፍለጋ ውጤቶች",
    noResults: "ምንም ውጤት አልተገኘም",
    noItems: "ምንም እቃ አይገኝም",
    reviews: "አስተያየቶች",
    noReviews: "እስካሁን ምንም አስተያየት የለም",
    writeReview: "አስተያየት ይጻፉ",
    yourName: "ስምዎ",
    shareThoughts: "ሃሳብዎን ያጋሩ...",
    submitReview: "አስተያየት ያስገቡ",
    admin: "አስተዳዳሪ",
    diet: "አመጋገብ",
    fasting: "ጾም",
    nonFasting: "ጾም ያልሆነ",
    all: "ሁሉም",
    filter: "ማጣሪያ",
    designedBy: "በኩራዝ ቴክ የተዘጋጀ",
    clearSearch: "ፍለጋ አጽዱ",
  },
  or: {
    title: "Menuu",
    subtitle: "Simannaa Ol'aanaa fi Mi'aa Aadaa",
    menu: "Menuu Keenya",
    language: "Afaan",
    search: "Menuu barbaadi...",
    breakfast: "Ciree",
    lunch: "Laxana fi Irbaata",
    drinks: "Dhugaatii",
    burgerPizza: "Baargarii & Piizaa",
    hotDrinks: "Ho'aa",
    coldDrinks: "Qabbanaawaa",
    alcoholic: "Alkoolii",
    rating: "Sadarkaa",
    description: "Ibsa",
    ingredients: "Qabeentoota",
    allergens: "Allerjii",
    calories: "Kaalorii",
    prepTime: "Yeroo Qophaa'insa",
    price: "Gatii",
    backToMenu: "Deebi'i",
    bestSeller: "Filatamaa",
    signature: "Addaa",
    newItem: "Haaraa",
    spicy: "Qara",
    birr: "Birrii",
    min: "daqiiqaa",
    kcal: "kaalorii",
    close: "Cufi",
    welcome: "Baga Nagaan Dhufte",
    tagline: "Mi'aa Manaa",
    searchResults: "Bu'aa Barbaaduu",
    noResults: "Bu'aan Hin Argamne",
    noItems: "Meeshaan Hin Jiru",
    reviews: "Yaada",
    noReviews: "Ammaatti Yaadaan Hin Jiru",
    writeReview: "Yaada Barreessi",
    yourName: "Maqaa Kee",
    shareThoughts: "Yaada Kee Qoodi...",
    submitReview: "Yaada Olgali",
    admin: "Bulchaa",
    diet: "Soorata",
    fasting: "Sooma",
    nonFasting: "Sooma Malee",
    all: "Hunda",
    filter: "Calleessaa",
    designedBy: "Kuraz Tech Qopha'ee",
    clearSearch: "Barbaaduu qulqulleessi",
  },
  zh: {
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
  },
};
