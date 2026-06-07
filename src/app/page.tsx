"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { useCart, CartItem } from "@/context/CartContext";
import { menuItems as defaultMenuItems, MenuItem } from "@/data/menuData";
import { Language } from "@/data/translations";
import { cn } from "@/lib/utils";
import {
  Search, X, Shield, Menu, Globe, ChevronDown, Star, ShoppingCart, Plus, Minus, Trash2, Copy, Upload, Check, View,
} from "lucide-react";
import { ARView } from "@/components/ARView";

const LANGUAGES: { code: Language; label: string }[] = [
  { code: "en", label: "English" },
  { code: "am", label: "አማርኛ" },
  { code: "or", label: "Afaan Oromoo" },
];

const CATEGORIES = [
  { id: "all", labelKey: "menu" as const },
  { id: "fastfood", labelKey: "burgerPizza" as const },
  { id: "breakfast", labelKey: "breakfast" as const },
  { id: "lunch", labelKey: "lunch" as const },
  { id: "drinks", labelKey: "drinks" as const },
];

const DRINK_SUBCATS = [
  { id: "hot", labelKey: "hotDrinks" as const },
  { id: "cold", labelKey: "coldDrinks" as const },
  { id: "alcoholic", labelKey: "alcoholic" as const },
];

const FASTING_OPTIONS = [
  { id: "all", labelKey: "all" as const },
  { id: "nonFasting", labelKey: "nonFasting" as const },
  { id: "fasting", labelKey: "fasting" as const },
];

interface Review {
  id: string;
  itemId: string;
  author: string;
  rating: number;
  comment: string;
  date: string;
}

type OrderStep = "cart" | "checkout" | "payment" | "confirmation";

export default function Home() {
  const { language, setLanguage, t } = useLanguage();
  const cart = useCart();
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [category, setCategory] = useState("fastfood");
  const [drinkSub, setDrinkSub] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [items, setItems] = useState<MenuItem[]>(defaultMenuItems);
  const [fastingFilter, setFastingFilter] = useState("all");
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [drinkDropdownOpen, setDrinkDropdownOpen] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewForm, setReviewForm] = useState({ author: "", rating: 5, comment: "" });
  const searchRef = useRef<HTMLInputElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const drinkDropdownRef = useRef<HTMLDivElement>(null);

  // Cart / Order state
  const [showCart, setShowCart] = useState(false);
  const [orderStep, setOrderStep] = useState<OrderStep>("cart");
  const [tableNumber, setTableNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [specialNotes, setSpecialNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"telebirr" | "cbe" | "">("");
  const [screenshotBase64, setScreenshotBase64] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState<{ orderId: string; createdAt: string } | null>(null);
  const [copied, setCopied] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showSearch && searchRef.current) searchRef.current.focus();
  }, [showSearch]);

  useEffect(() => {
    const stored = localStorage.getItem("menu_items");
    if (stored) {
      try { setItems(JSON.parse(stored)); } catch { setItems(defaultMenuItems); }
    }
    const storedReviews = localStorage.getItem("menu_reviews");
    if (storedReviews) {
      try { setReviews(JSON.parse(storedReviews)); } catch { }
    }
    fetch("/api/menu-items").then((r) => r.json()).then((apiItems) => {
      if (apiItems && apiItems.length > 0) {
        setItems(apiItems);
        localStorage.setItem("menu_items", JSON.stringify(apiItems));
      }
    }).catch(() => {});
    fetch("/api/reviews").then((r) => r.json()).then((apiReviews) => {
      if (apiReviews && apiReviews.length > 0) {
        setReviews(apiReviews);
        localStorage.setItem("menu_reviews", JSON.stringify(apiReviews));
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (drinkDropdownRef.current && !drinkDropdownRef.current.contains(e.target as Node)) {
        setDrinkDropdownOpen(false);
      }
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) {
        setCategoryDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Open cart and reset checkout steps
  const openCart = () => {
    setOrderStep("cart");
    setShowCart(true);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(""), 2000);
    }).catch(() => {});
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setScreenshotBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const submitOrder = async () => {
    if (!tableNumber.trim() || !paymentMethod) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableNumber: tableNumber.trim(),
          customerName: customerName.trim(),
          phoneNumber: phoneNumber.trim(),
          specialNotes: specialNotes.trim(),
          items: cart.items.map((ci) => ({
            id: ci.item.id,
            name: ci.item.name,
            price: ci.item.price,
            quantity: ci.quantity,
          })),
          totalAmount: cart.totalPrice,
          paymentMethod,
          paymentScreenshot: screenshotBase64,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setOrderResult({ orderId: data.orderId, createdAt: data.createdAt });
        setOrderStep("confirmation");
        cart.clearCart();
      }
    } catch { }
    setSubmitting(false);
  };

  const resetOrder = () => {
    setShowCart(false);
    setOrderStep("cart");
    setTableNumber("");
    setCustomerName("");
    setPhoneNumber("");
    setSpecialNotes("");
    setPaymentMethod("");
    setScreenshotBase64("");
    setOrderResult(null);
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (!item.is_available) return false;
      if (fastingFilter === "fasting" && !item.isFasting) return false;
      if (fastingFilter === "nonFasting" && item.isFasting) return false;
      if (category === "all") return true;
      if (category === "fastfood") {
        const n = item.name.en.toLowerCase();
        return n.includes("burger") || n.includes("pizza");
      }
      if (category === "drinks") {
        if (item.category !== "drinks") return false;
        if (drinkSub !== "all" && item.subcategory !== drinkSub) return false;
        return true;
      }
      return item.category === category;
    }).filter((item) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.name[language].toLowerCase().includes(q) ||
        item.description[language].toLowerCase().includes(q)
      );
    });
  }, [category, drinkSub, fastingFilter, searchQuery, language, items]);

  const cartItemCount = cart.totalItems;

  return (
    <div className="luxury-bg">
      <div className="app-container">
        <div className="tibeb-corner tibeb-corner-tl" />
        <div className="tibeb-corner tibeb-corner-tr" />
        <div className="tibeb-corner tibeb-corner-bl" />
        <div className="tibeb-corner tibeb-corner-br" />

        {/* HEADER */}
        <header className="relative pt-10 pb-6 text-center border-b border-border-warm">
          <div className="absolute top-4 left-5 flex items-center gap-1.5">
            <div className="w-6 h-px bg-gradient-to-r from-transparent to-gold/40" />
            <div className="gold-diamond" />
          </div>
          <div className="absolute top-4 right-5 flex items-center gap-1.5">
            <div className="gold-diamond" />
            <div className="w-6 h-px bg-gradient-to-l from-transparent to-gold/40" />
          </div>

          <div className="absolute top-4 right-14 flex items-center gap-1">
            <button onClick={() => setShowSearch(!showSearch)} className="w-9 h-9 flex items-center justify-center text-coffee-muted/60 hover:text-gold transition-colors">
              <Search size={16} />
            </button>
            <button onClick={() => setShowLangPicker(true)} className="w-9 h-9 flex items-center justify-center text-gold">
              <Globe size={16} />
            </button>
          </div>
          <button onClick={() => setShowSidebar(true)} className="absolute top-4 left-14 w-9 h-9 flex items-center justify-center text-coffee-muted/60 hover:text-gold transition-colors">
            <Menu size={18} />
          </button>

          <div>
            <div className="gold-flourish mb-3">
              <div className="gold-diamond" />
            </div>
            <h1 className="text-4xl font-logo text-coffee drop-shadow-[0_1px_2px_rgba(212,163,95,0.2)]">{t.welcome}</h1>
            <p className="text-[9px] font-heading text-coffee-muted/70 tracking-[0.3em] uppercase mt-1.5">{t.tagline}</p>
            <div className="tibeb-divider mt-4">
              <div className="tibeb-cross">
                <div className="tibeb-cross-inner" />
              </div>
            </div>
          </div>

          <AnimatePresence>
            {showSearch && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-4 px-5">
                <div className="relative">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-coffee-muted/40" />
                  <input
                    ref={searchRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t.search}
                    className="w-full pl-9 pr-9 py-2.5 bg-cream-dark/80 rounded-lg text-sm text-coffee placeholder-coffee-muted/40 border border-border-warm focus:outline-none focus:border-gold/50 transition-colors"
                  />
                  {searchQuery && <button onClick={() => setSearchQuery("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-coffee-muted/40"><X size={14} /></button>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        {/* CATEGORY & FASTING FILTERS */}
        <div className="sticky top-0 z-20 border-b border-border-warm/60 bg-cream-dark/90 backdrop-blur-sm">
          <div className="px-5 py-3 relative" ref={categoryDropdownRef}>
            <button
              onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
              className="flex items-center gap-2 w-full border border-border-warm bg-white rounded-lg px-3.5 py-2.5 text-sm text-coffee-muted font-heading tracking-wider uppercase"
            >
              <span className="flex-1 text-left">{t[CATEGORIES.find(c => c.id === category)!.labelKey]}</span>
              <ChevronDown size={14} className={`text-gold transition-transform ${categoryDropdownOpen ? "rotate-180" : ""}`} />
            </button>
            {categoryDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-border-warm rounded-lg shadow-xl z-30 py-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => { setCategory(cat.id); setDrinkSub("all"); setCategoryDropdownOpen(false); }}
                    className={cn(
                      "w-full text-left px-4 py-2.5 text-[12px] font-heading tracking-wider uppercase transition-colors",
                      category === cat.id ? "text-gold font-semibold bg-gold/5" : "text-coffee-muted/60 hover:text-coffee-muted hover:bg-cream-dark"
                    )}
                  >
                    {t[cat.labelKey]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {category === "drinks" && (
            <div className="px-5 pb-3">
              <div className="relative" ref={drinkDropdownRef}>
                <button
                  onClick={() => setDrinkDropdownOpen(!drinkDropdownOpen)}
                  className="flex items-center gap-1.5 text-[10px] font-heading tracking-wider uppercase text-gold font-semibold"
                >
                  {drinkSub === "all" ? t.all : t[DRINK_SUBCATS.find(s => s.id === drinkSub)!.labelKey]}
                  <ChevronDown size={11} className={`transition-transform ${drinkDropdownOpen ? "rotate-180" : ""}`} />
                </button>
                {drinkDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1.5 w-36 bg-white border border-border-warm rounded-lg shadow-xl z-30 py-1">
                    <button
                      onClick={() => { setDrinkSub("all"); setDrinkDropdownOpen(false); }}
                      className={cn("w-full text-left px-4 py-2 text-[11px] tracking-wider uppercase transition-colors", drinkSub === "all" ? "text-gold" : "text-coffee-muted/60 hover:text-coffee-muted hover:bg-cream-dark")}
                    >
                      {t.all}
                    </button>
                    {DRINK_SUBCATS.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => { setDrinkSub(sub.id); setDrinkDropdownOpen(false); }}
                        className={cn("w-full text-left px-4 py-2 text-[11px] tracking-wider uppercase transition-colors", drinkSub === sub.id ? "text-gold" : "text-coffee-muted/60 hover:text-coffee-muted hover:bg-cream-dark")}
                      >
                        {t[sub.labelKey]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="px-5 pb-3 flex gap-2">
            {FASTING_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setFastingFilter(opt.id)}
                className={cn("px-3.5 py-1.5 rounded-full text-[10px] font-heading tracking-wider uppercase transition-all", fastingFilter === opt.id ? "bg-gold text-white" : "bg-white text-coffee-muted/60 border border-border-warm hover:text-coffee-muted")}
              >
                {t[opt.labelKey]}
              </button>
            ))}
          </div>
        </div>

        {/* SEARCH RESULTS OVERLAY */}
        {searchQuery && (
          <div className="px-5 py-4 space-y-2 bg-cream-dark/40 min-h-[50dvh]">
            <p className="text-[10px] font-heading text-coffee-muted/50 uppercase tracking-[0.2em] mb-3">{t.searchResults}</p>
            {items.filter((it) => it.is_available && (it.name[language].toLowerCase().includes(searchQuery.toLowerCase()) || it.description[language].toLowerCase().includes(searchQuery.toLowerCase()))).map((it) => (
              <button key={it.id} onClick={() => setSelectedItem(it)} className="w-full text-left py-2.5 px-3 rounded-lg bg-white/60 hover:bg-white transition-colors flex items-center gap-3 border border-border-warm/40">
                <span className="text-sm text-coffee flex-1 truncate">{it.name[language]}</span>
                <span className="text-xs text-gold">{it.price}</span>
              </button>
            ))}
            {items.filter((it) => it.is_available && (it.name[language].toLowerCase().includes(searchQuery.toLowerCase()) || it.description[language].toLowerCase().includes(searchQuery.toLowerCase()))).length === 0 && (
              <p className="text-sm text-coffee-muted/50 text-center py-6">{t.noResults}</p>
            )}
          </div>
        )}

        {/* MENU ITEMS */}
        {!searchQuery && (
          <div className="px-5 pb-24 pt-5">
            <div className="space-y-0">
              {filteredItems.map((item, idx) => (
                <React.Fragment key={item.id}>
                  {idx > 0 && (
                    <div className="menu-divider py-2">
                      <div className="gold-diamond" />
                    </div>
                  )}
                  <MenuItemRow item={item} language={language} t={t} reviews={reviews} onClick={() => setSelectedItem(item)} delay={idx} onAddToCart={() => cart.addItem(item)} />
                </React.Fragment>
              ))}
              {filteredItems.length === 0 && (
                <div className="text-center py-16">
                  <p className="text-sm text-coffee-muted/50">{t.noItems}</p>
                </div>
              )}
            </div>
            <div className="mt-12 text-center">
              <div className="tibeb-divider">
                <div className="tibeb-cross">
                  <div className="tibeb-cross-inner" />
                </div>
              </div>
              <p className="text-[8px] text-coffee-muted/40 tracking-[0.2em] uppercase mt-3 font-heading">{t.designedBy}</p>
            </div>
          </div>
        )}

        {/* SIDEBAR */}
        <AnimatePresence>
          {showSidebar && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-coffee/50" onClick={() => setShowSidebar(false)}>
              <motion.div initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} transition={{ type: "spring", damping: 28, stiffness: 300 }} className="absolute top-0 left-0 bottom-0 w-[280px] max-w-[75vw] wood-sidebar border-r border-white/5 shadow-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="p-7">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-logo text-white">{t.welcome}</h2>
                    <button onClick={() => setShowSidebar(false)} className="w-8 h-8 flex items-center justify-center text-white/50 hover:text-white transition-colors"><X size={18} /></button>
                  </div>
                  <p className="text-[10px] font-heading text-white/50 mb-7 leading-relaxed tracking-[0.15em] uppercase">{t.subtitle}</p>
                  <div className="space-y-1">
                    {CATEGORIES.map((cat) => (
                      <button key={cat.id} onClick={() => { setCategory(cat.id); setShowSidebar(false); }} className={cn("w-full text-left py-3 px-4 rounded-lg text-sm font-heading transition-all tracking-wider uppercase", category === cat.id ? "bg-gold/20 text-gold font-semibold" : "text-white/60 hover:text-white hover:bg-white/5")}>
                        {t[cat.labelKey]}
                      </button>
                    ))}
                  </div>
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <p className="text-[10px] text-white/50 mb-3 uppercase tracking-wider">{t.diet}</p>
                    <div className="flex flex-wrap gap-2">
                      {FASTING_OPTIONS.map((opt) => (
                        <button key={opt.id} onClick={() => { setFastingFilter(opt.id); setShowSidebar(false); }} className={cn("px-3 py-1.5 rounded-full text-[10px] font-heading tracking-wider uppercase transition-all", fastingFilter === opt.id ? "bg-gold/20 text-gold" : "text-white/50 hover:text-white border border-white/10 hover:border-white/20")}>
                          {t[opt.labelKey]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mt-8 pt-7 border-t border-white/10">
                    <p className="text-[10px] text-white/50 mb-3 uppercase tracking-wider">{t.language}</p>
                    <div className="space-y-1.5">
                      {LANGUAGES.map((lang) => (
                        <button key={lang.code} onClick={() => { setLanguage(lang.code); setShowSidebar(false); }} className={cn("w-full text-left py-2.5 px-4 rounded-lg text-sm transition-colors", language === lang.code ? "bg-gold/20 text-gold font-medium" : "text-white/60 hover:text-white hover:bg-white/5")}>
                          {lang.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => window.location.href = "/admin"} className="mt-6 w-full py-2.5 px-4 rounded-lg text-xs text-white/30 hover:text-gold hover:bg-white/5 transition-all tracking-wider uppercase border border-white/10">
                    {t.admin}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* LANGUAGE PICKER */}
        <AnimatePresence>
          {showLangPicker && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-coffee/50" onClick={() => setShowLangPicker(false)}>
              <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }} transition={{ type: "spring", damping: 28, stiffness: 300 }} className="absolute bottom-0 left-0 right-0 max-w-[480px] mx-auto bg-white rounded-t-2xl p-6 border-t border-border-warm" onClick={(e) => e.stopPropagation()}>
                <div className="w-8 h-0.5 bg-gold/30 rounded-full mx-auto mb-6" />
                <h3 className="text-base font-medium text-coffee text-center mb-5">{t.language}</h3>
                {LANGUAGES.map((lang) => (
                  <button key={lang.code} onClick={() => { setLanguage(lang.code); setShowLangPicker(false); }} className={cn("w-full py-3.5 px-4 rounded-xl text-left text-sm mb-1.5 transition-colors", language === lang.code ? "bg-gold/15 text-gold font-medium" : "bg-cream-dark text-coffee-muted hover:bg-cream-dark/80")}>
                    {lang.label}
                  </button>
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ===== ITEM DETAIL MODAL ===== */}
        <AnimatePresence>
          {selectedItem && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-coffee/50 backdrop-blur-sm" onClick={() => setSelectedItem(null)}>
              <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 300 }} className="absolute bottom-0 left-0 right-0 max-w-[480px] mx-auto bg-white rounded-t-2xl max-h-[90dvh] overflow-y-auto border-t border-gold/30" onClick={(e) => e.stopPropagation()}>
                <div className="sticky top-0 z-10 py-3 px-5 flex items-center justify-between bg-white border-b border-border-warm">
                  <div className="w-8 h-0.5 bg-gold/30 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-2.5" />
                  <button onClick={() => setSelectedItem(null)} className="ml-auto w-7 h-7 flex items-center justify-center text-coffee-muted/50 hover:text-coffee bg-cream-dark rounded-full transition-colors"><X size={16} /></button>
                </div>
                <div className="relative h-72 bg-cream-dark mx-5 mt-4 rounded-lg overflow-hidden border border-border-warm">
                  <img src={selectedItem.image} alt={selectedItem.name[language]} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                </div>
                <div className="p-5">
                  {selectedItem.arModel && (
                    <div className="mb-5">
                      <h4 className="text-[10px] font-heading text-gold uppercase tracking-[0.15em] mb-2.5 flex items-center gap-1.5 font-semibold">
                        <View size={12} /> 3D AR Experience
                      </h4>
                      <ARView 
                        glbSrc={selectedItem.arModel.glb} 
                        usdzSrc={selectedItem.arModel.usdz} 
                        alt={selectedItem.name[language]} 
                        poster={selectedItem.image}
                      />
                    </div>
                  )}
                  <h2 className="text-xl font-item text-coffee font-semibold tracking-wide">{selectedItem.name[language]}</h2>
                  <p className="text-sm text-coffee-muted/80 leading-relaxed mt-3">{selectedItem.description[language]}</p>
                  <div className="mt-5 pt-4 border-t border-border-warm">
                    <span className="text-lg font-price text-gold font-semibold">{selectedItem.price} <span className="text-sm font-normal text-coffee-muted/50">{t.birr}</span></span>
                  </div>
                  <div className="mt-5">
                    <h4 className="text-[10px] font-heading text-gold uppercase tracking-[0.15em] mb-2.5 font-semibold">{t.ingredients}</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedItem.ingredients[language].map((ing, idx) => (
                        <span key={idx} className="text-xs text-coffee-muted bg-cream-dark px-3 py-1.5 rounded-full border border-border-warm">{ing}</span>
                      ))}
                    </div>
                  </div>
                  {selectedItem.allergens[language].filter((a) => a.toLowerCase() !== "none").length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-[10px] font-heading text-gold uppercase tracking-[0.15em] mb-2.5 flex items-center gap-1.5 font-semibold">
                        <Shield size={12} /> {t.allergens}
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedItem.allergens[language].filter((a) => a.toLowerCase() !== "none").map((a, idx) => (
                          <span key={idx} className="text-xs text-[#C0392B] bg-red-50/80 px-3 py-1.5 rounded-full border border-red-200">{a}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  <button onClick={() => { cart.addItem(selectedItem); setSelectedItem(null); }} className="mt-5 w-full py-3 bg-gold text-white rounded-xl font-semibold text-sm hover:bg-coffee-muted transition-colors flex items-center justify-center gap-2">
                    <Plus size={16} /> Add to Cart — {selectedItem.price} {t.birr}
                  </button>

                  {/* REVIEWS */}
                  <div className="mt-6 pt-5 border-t border-border-warm">
                    <h4 className="text-[10px] font-heading text-gold uppercase tracking-[0.15em] mb-3 font-semibold">{t.reviews}</h4>
                    {reviews.filter(r => r.itemId === selectedItem.id).length > 0 ? (
                      <div className="space-y-3 mb-4">
                        {reviews.filter(r => r.itemId === selectedItem.id).map((review) => (
                          <div key={review.id} className="bg-cream-dark/50 rounded-lg px-3.5 py-2.5 border border-border-warm/60">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-coffee font-medium">{review.author}</span>
                              <span className="text-[9px] text-coffee-muted/40">{review.date}</span>
                            </div>
                            <div className="flex items-center gap-0.5 mb-1.5">
                              {[1,2,3,4,5].map((star) => (
                                <Star key={star} size={10} className={star <= review.rating ? "text-gold" : "text-border-warm"} fill={star <= review.rating ? "#D4A35F" : "transparent"} />
                              ))}
                            </div>
                            <p className="text-[11px] text-coffee-muted/70 leading-relaxed">{review.comment}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-coffee-muted/40 mb-4">{t.noReviews}</p>
                    )}
                    <div className="bg-cream-dark/50 rounded-lg p-3.5 border border-border-warm/60">
                      <p className="text-[10px] text-gold/80 uppercase tracking-wider mb-2.5 font-medium">{t.writeReview}</p>
                      <input type="text" placeholder={t.yourName} value={reviewForm.author} onChange={(e) => setReviewForm({ ...reviewForm, author: e.target.value })} className="w-full bg-white rounded-lg px-3 py-2 text-xs text-coffee placeholder-coffee-muted/40 border border-border-warm focus:outline-none focus:border-gold/50 transition-colors mb-2" />
                      <div className="flex items-center gap-1 mb-2">
                        <span className="text-[10px] text-coffee-muted/60 mr-1">Rating:</span>
                        {[1,2,3,4,5].map((star) => (
                          <button key={star} onClick={() => setReviewForm({ ...reviewForm, rating: star })}>
                            <Star size={14} className={star <= reviewForm.rating ? "text-gold" : "text-border-warm"} fill={star <= reviewForm.rating ? "#D4A35F" : "transparent"} />
                          </button>
                        ))}
                      </div>
                      <textarea placeholder={t.shareThoughts} value={reviewForm.comment} onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })} rows={2} className="w-full bg-white rounded-lg px-3 py-2 text-xs text-coffee placeholder-coffee-muted/40 border border-border-warm focus:outline-none focus:border-gold/50 transition-colors resize-none mb-2" />
                      <button
                        onClick={() => {
                          if (!reviewForm.author.trim() || !reviewForm.comment.trim()) return;
                          const newReview: Review = { id: Date.now().toString(), itemId: selectedItem.id, author: reviewForm.author.trim(), rating: reviewForm.rating, comment: reviewForm.comment.trim(), date: new Date().toLocaleDateString() };
                          const updated = [...reviews, newReview];
                          setReviews(updated);
                          localStorage.setItem("menu_reviews", JSON.stringify(updated));
                          fetch("/api/reviews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newReview) }).catch(() => {});
                          setReviewForm({ author: "", rating: 5, comment: "" });
                        }}
                        className="w-full py-2 text-[10px] tracking-wider uppercase bg-gold/15 hover:bg-gold/25 text-gold font-semibold rounded-lg transition-colors border border-gold/20"
                      >
                        {t.submitReview}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ===== STICKY CART BUTTON ===== */}
        {cartItemCount > 0 && (
          <div className="sticky bottom-0 z-30 px-4 pb-3 pt-1">
            <button
              onClick={openCart}
              className="w-full relative bg-coffee text-white rounded-xl py-3.5 px-4 shadow-xl flex items-center justify-between hover:bg-coffee-muted transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-gold/20 flex items-center justify-center">
                  <ShoppingCart size={16} className="text-gold" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold tracking-wide">View Cart ({cartItemCount} {cartItemCount === 1 ? "item" : "items"})</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-base font-bold text-gold">{cart.totalPrice.toLocaleString()} <span className="text-xs font-normal text-white/70">ETB</span></div>
              </div>
            </button>
          </div>
        )}

        {/* ===== CART / ORDER MODAL ===== */}
        <AnimatePresence>
          {showCart && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-coffee/50 backdrop-blur-sm" onClick={resetOrder}>
              <motion.div
                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 300 }}
                className="absolute bottom-0 left-0 right-0 max-w-[480px] mx-auto bg-white rounded-t-2xl max-h-[95dvh] overflow-y-auto border-t border-gold/30"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close handle */}
                <div className="sticky top-0 z-10 bg-white pt-3 pb-2 px-5 border-b border-border-warm flex items-center justify-between">
                  <div className="w-8 h-0.5 bg-gold/30 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-2.5" />
                  <button onClick={resetOrder} className="ml-auto w-7 h-7 flex items-center justify-center text-coffee-muted/50 hover:text-coffee bg-cream-dark rounded-full transition-colors"><X size={16} /></button>
                </div>

                {orderStep === "cart" && (
                  <div className="p-5">
                    <h2 className="text-lg font-bold text-coffee mb-5">Your Order</h2>
                    {cart.items.length === 0 ? (
                      <div className="text-center py-12">
                        <ShoppingCart size={40} className="mx-auto text-coffee-muted/30 mb-3" />
                        <p className="text-sm text-coffee-muted/50">Your cart is empty</p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-3 mb-6">
                          {cart.items.map((ci) => (
                            <div key={ci.item.id} className="flex items-center gap-3 bg-cream-dark/50 rounded-xl p-3 border border-border-warm/60">
                              <div className="w-12 h-12 rounded-lg overflow-hidden bg-cream-dark flex-shrink-0 border border-border-warm/40">
                                <img src={ci.item.image} alt={ci.item.name[language]} className="w-full h-full object-cover" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-coffee truncate">{ci.item.name[language]}</p>
                                <p className="text-xs text-coffee-muted/50">{ci.item.price} ETB each</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button onClick={() => cart.updateQuantity(ci.item.id, ci.quantity - 1)} className="w-7 h-7 rounded-full bg-white border border-border-warm flex items-center justify-center text-coffee-muted hover:text-coffee transition-colors">
                                  <Minus size={12} />
                                </button>
                                <span className="w-6 text-center text-sm font-semibold text-coffee">{ci.quantity}</span>
                                <button onClick={() => cart.updateQuantity(ci.item.id, ci.quantity + 1)} className="w-7 h-7 rounded-full bg-white border border-border-warm flex items-center justify-center text-coffee-muted hover:text-coffee transition-colors">
                                  <Plus size={12} />
                                </button>
                              </div>
                              <div className="text-right min-w-[70px]">
                                <p className="text-sm font-bold text-coffee">{(ci.item.price * ci.quantity).toLocaleString()}</p>
                                <p className="text-[9px] text-coffee-muted/40">ETB</p>
                              </div>
                              <button onClick={() => cart.removeItem(ci.item.id)} className="w-6 h-6 flex items-center justify-center text-coffee-muted/30 hover:text-[#C0392B] transition-colors">
                                <Trash2 size={13} />
                              </button>
                            </div>
                          ))}
                        </div>

                        <div className="border-t border-border-warm pt-4 mb-5">
                          <div className="flex items-center justify-between text-base">
                            <span className="font-semibold text-coffee">Total</span>
                            <span className="font-bold text-gold text-lg">{cart.totalPrice.toLocaleString()} ETB</span>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <button onClick={resetOrder} className="flex-1 py-3 text-sm font-medium text-coffee-muted bg-cream-dark rounded-xl hover:bg-cream-dark/80 transition-colors">
                            Continue Browsing
                          </button>
                          <button onClick={() => setOrderStep("checkout")} className="flex-1 py-3 text-sm font-semibold text-white bg-gold rounded-xl hover:bg-coffee-muted transition-colors">
                            Proceed To Payment
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {orderStep === "checkout" && (
                  <div className="p-5">
                    <h2 className="text-lg font-bold text-coffee mb-5">Checkout</h2>
                    <div className="space-y-3 mb-6">
                      <div>
                        <label className="text-[10px] font-medium text-coffee-muted/50 uppercase tracking-wider block mb-1">Table Number *</label>
                        <input type="text" value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} placeholder="e.g. 12" className="w-full px-3 py-2.5 bg-cream-dark rounded-xl text-sm text-coffee focus:outline-none focus:ring-2 focus:ring-gold/50" />
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-coffee-muted/50 uppercase tracking-wider block mb-1">Customer Name</label>
                        <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Optional" className="w-full px-3 py-2.5 bg-cream-dark rounded-xl text-sm text-coffee focus:outline-none focus:ring-2 focus:ring-gold/50" />
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-coffee-muted/50 uppercase tracking-wider block mb-1">Phone Number</label>
                        <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="Optional" className="w-full px-3 py-2.5 bg-cream-dark rounded-xl text-sm text-coffee focus:outline-none focus:ring-2 focus:ring-gold/50" />
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-coffee-muted/50 uppercase tracking-wider block mb-1">Special Notes</label>
                        <textarea value={specialNotes} onChange={(e) => setSpecialNotes(e.target.value)} placeholder='e.g. "No onions please"' rows={2} className="w-full px-3 py-2.5 bg-cream-dark rounded-xl text-sm text-coffee focus:outline-none focus:ring-2 focus:ring-gold/50 resize-none" />
                      </div>
                    </div>

                    <div className="border-t border-border-warm pt-4 mb-5">
                      <div className="flex items-center justify-between text-base">
                        <span className="font-semibold text-coffee">TOTAL AMOUNT</span>
                        <span className="font-bold text-gold text-lg">{cart.totalPrice.toLocaleString()} ETB</span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button onClick={() => setOrderStep("cart")} className="flex-1 py-3 text-sm font-medium text-coffee-muted bg-cream-dark rounded-xl hover:bg-cream-dark/80 transition-colors">
                        Back
                      </button>
                      <button onClick={() => setOrderStep("payment")} className="flex-1 py-3 text-sm font-semibold text-white bg-gold rounded-xl hover:bg-coffee-muted transition-colors disabled:opacity-50" disabled={!tableNumber.trim()}>
                        Continue
                      </button>
                    </div>
                  </div>
                )}

                {orderStep === "payment" && (
                  <div className="p-5">
                    <h2 className="text-lg font-bold text-coffee mb-5">Payment</h2>

                    <div className="mb-5">
                      <label className="text-[10px] font-medium text-coffee-muted/50 uppercase tracking-wider block mb-2">Payment Method</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setPaymentMethod("telebirr")}
                          className={cn("flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-all", paymentMethod === "telebirr" ? "border-gold bg-gold/5 text-gold" : "border-border-warm text-coffee-muted bg-cream-dark")}
                        >
                          Telebirr
                        </button>
                        <button
                          onClick={() => setPaymentMethod("cbe")}
                          className={cn("flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-all", paymentMethod === "cbe" ? "border-gold bg-gold/5 text-gold" : "border-border-warm text-coffee-muted bg-cream-dark")}
                        >
                          CBE
                        </button>
                      </div>
                    </div>

                    {paymentMethod === "telebirr" && (
                      <div className="bg-cream-dark/70 rounded-xl p-4 border border-border-warm mb-4">
                        <p className="text-[11px] font-bold text-coffee mb-2 uppercase tracking-wider">Telebirr</p>
                        <p className="text-sm text-coffee-muted">Account Name: Abel</p>
                        <p className="text-sm text-coffee-muted mb-3">Phone Number: 0954948027</p>
                        <button
                          onClick={() => handleCopy("0954948027", "telebirr")}
                          className="flex items-center gap-2 px-4 py-2 bg-gold/10 text-gold rounded-lg text-xs font-semibold hover:bg-gold/20 transition-colors"
                        >
                          {copied === "telebirr" ? <Check size={14} /> : <Copy size={14} />}
                          {copied === "telebirr" ? "Copied!" : "Copy Telebirr Number"}
                        </button>
                      </div>
                    )}

                    {paymentMethod === "cbe" && (
                      <div className="bg-cream-dark/70 rounded-xl p-4 border border-border-warm mb-4">
                        <p className="text-[11px] font-bold text-coffee mb-2 uppercase tracking-wider">Commercial Bank of Ethiopia (CBE)</p>
                        <p className="text-sm text-coffee-muted">Account Name: Abel</p>
                        <p className="text-sm text-coffee-muted mb-3">Account Number: 100083389579</p>
                        <button
                          onClick={() => handleCopy("100083389579", "cbe")}
                          className="flex items-center gap-2 px-4 py-2 bg-gold/10 text-gold rounded-lg text-xs font-semibold hover:bg-gold/20 transition-colors"
                        >
                          {copied === "cbe" ? <Check size={14} /> : <Copy size={14} />}
                          {copied === "cbe" ? "Copied!" : "Copy CBE Account Number"}
                        </button>
                      </div>
                    )}

                    <div className="mb-5">
                      <label className="text-[10px] font-medium text-coffee-muted/50 uppercase tracking-wider block mb-2">Upload Payment Screenshot</label>
                      <p className="text-[10px] text-coffee-muted/40 mb-2">Supported: JPG, PNG</p>
                      <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png" onChange={handleFileChange} className="hidden" />
                      {screenshotBase64 ? (
                        <div className="flex items-center gap-3 bg-cream-dark/70 rounded-xl p-3 border border-border-warm">
                          <div className="w-14 h-14 rounded-lg overflow-hidden bg-cream-dark border border-border-warm flex-shrink-0">
                            <img src={screenshotBase64} alt="Screenshot preview" className="w-full h-full object-cover" />
                          </div>
                          <span className="text-xs text-coffee-muted flex-1">Screenshot uploaded</span>
                          <button onClick={() => { setScreenshotBase64(""); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="text-xs text-[#C0392B] hover:underline">Remove</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full py-8 rounded-xl border-2 border-dashed border-border-warm text-coffee-muted/50 hover:border-gold/50 hover:text-gold transition-all flex flex-col items-center gap-2"
                        >
                          <Upload size={20} />
                          <span className="text-xs font-medium">Tap to upload</span>
                        </button>
                      )}
                    </div>

                    <div className="border-t border-border-warm pt-4 mb-5">
                      <div className="flex items-center justify-between text-base">
                        <span className="font-semibold text-coffee">TOTAL AMOUNT</span>
                        <span className="font-bold text-gold text-lg">{cart.totalPrice.toLocaleString()} ETB</span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button onClick={() => setOrderStep("checkout")} className="flex-1 py-3 text-sm font-medium text-coffee-muted bg-cream-dark rounded-xl hover:bg-cream-dark/80 transition-colors">
                        Back
                      </button>
                      <button
                        onClick={submitOrder}
                        disabled={submitting || !tableNumber.trim() || !paymentMethod}
                        className="flex-1 py-3 text-sm font-semibold text-white bg-gold rounded-xl hover:bg-coffee-muted transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {submitting ? "Submitting..." : "Submit Order"}
                      </button>
                    </div>
                  </div>
                )}

                {orderStep === "confirmation" && orderResult && (
                  <div className="p-5 text-center">
                    <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
                      <Check size={28} className="text-gold" />
                    </div>
                    <h2 className="text-lg font-bold text-coffee mb-2">Order Submitted!</h2>
                    <p className="text-sm text-coffee-muted/70 mb-6">Your order has been submitted successfully. Please wait while payment is verified.</p>

                    <div className="bg-cream-dark/70 rounded-xl p-4 border border-border-warm mb-6 text-left space-y-2">
                      <div className="flex justify-between">
                        <span className="text-xs text-coffee-muted/60">Order Number</span>
                        <span className="text-sm font-bold text-coffee">{orderResult.orderId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-coffee-muted/60">Table Number</span>
                        <span className="text-sm font-bold text-coffee">{tableNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-coffee-muted/60">Total Amount</span>
                        <span className="text-sm font-bold text-gold">{cart.totalPrice.toLocaleString()} ETB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-coffee-muted/60">Payment Method</span>
                        <span className="text-sm font-bold text-coffee capitalize">{paymentMethod}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-coffee-muted/60">Status</span>
                        <span className="text-sm font-bold text-amber-600">Waiting For Verification</span>
                      </div>
                    </div>

                    <button
                      onClick={resetOrder}
                      className="w-full py-3 text-sm font-semibold text-white bg-gold rounded-xl hover:bg-coffee-muted transition-colors"
                    >
                      Browse Again
                    </button>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function MenuItemRow({ item, language, t, reviews, onClick, delay, onAddToCart }: {
  item: MenuItem;
  language: Language;
  t: any;
  reviews: Review[];
  onClick: () => void;
  delay: number;
  onAddToCart: () => void;
}) {
  const itemReviews = reviews.filter(r => r.itemId === item.id);
  const avgRating = itemReviews.length > 0 ? Math.round(itemReviews.reduce((s, r) => s + r.rating, 0) / itemReviews.length * 10) / 10 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.02 }}
      className="flex items-stretch gap-0"
    >
      <button
        onClick={onClick}
        className={cn(
          "text-left group card-accent flex-1",
          "rounded-l-lg px-3 py-2.5 transition-all duration-300"
        )}
      >
        <div className="flex gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-[15px] font-item text-coffee font-semibold leading-tight group-hover:text-gold transition-colors tracking-wide">{item.name[language]}</h3>
              <span className="text-sm font-price text-gold font-semibold flex-shrink-0">{item.price} <span className="text-[10px] font-normal text-coffee-muted/50">{t.birr}</span></span>
            </div>
            {item.isFasting && (
              <span className="inline-block text-[8px] font-heading text-coffee-muted/50 tracking-wider uppercase mt-0.5">{t.fasting}</span>
            )}
            <p className="text-[12px] text-coffee-muted/70 mt-0.5 leading-relaxed line-clamp-2">{item.description[language]}</p>
            {itemReviews.length > 0 && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <div className="flex items-center gap-[1px]">
                  {[1,2,3,4,5].map((star) => (
                    <Star key={star} size={8} className={star <= Math.round(avgRating) ? "text-gold" : "text-border-warm"} fill={star <= Math.round(avgRating) ? "#D4A35F" : "transparent"} />
                  ))}
                </div>
                <span className="text-[9px] text-coffee-muted/40">({itemReviews.length})</span>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <div className="w-[72px] h-[72px] flex-shrink-0 rounded-lg overflow-hidden bg-cream-dark border border-border-warm/60 opacity-80 group-hover:opacity-100 transition-all duration-300 group-hover:border-gold/30 group-hover:shadow-[0_0_12px_rgba(212,163,95,0.1)] relative">
              <img src={item.image} alt={item.name[language]} className="w-full h-full object-cover" loading="lazy" />
              {item.arModel && (
                <div className="absolute top-1 right-1 bg-gold text-white text-[7px] font-bold px-1.5 py-0.5 rounded-sm flex items-center gap-0.5 shadow-sm">
                  <View size={6} /> 3D
                </div>
              )}
            </div>
          </div>
        </div>
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onAddToCart(); }}
        className="w-10 flex-shrink-0 bg-gold/10 hover:bg-gold/20 border-l border-gold/20 rounded-r-lg flex flex-col items-center justify-center gap-0.5 transition-colors group"
        title="Add to cart"
      >
        <Plus size={16} className="text-gold" />
        <span className="text-[7px] font-heading text-gold tracking-wider uppercase">Add</span>
      </button>
    </motion.div>
  );
}
