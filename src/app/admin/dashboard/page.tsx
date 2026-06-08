"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { MenuItem, Category as CatType } from "@/data/menuData";
import { Language } from "@/data/translations";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
  LogOut, Edit3, Trash2, Eye, EyeOff, Plus, ChevronLeft, Star, X, Save, RefreshCw,
  MessageSquare, Search, Upload, Image, Box,
} from "lucide-react";
import {
  getAllMenuItems, upsertMenuItem, upsertMenuItems, deleteMenuItem,
  getAllCategories, createCategory, updateCategory, deleteCategory,
  getAllReviews, addReview, deleteReview,
  subscribeToMenuItems, subscribeToCategories,
} from "@/lib/db/database";

interface Review {
  id: string; itemId: string; author: string; rating: number; comment: string; date: string;
}

type TabMode = "items" | "categories" | "messages";

const AR_ITEM_IDS = new Set(["l1", "l2", "l75"]);

const LANGUAGES: Language[] = ["en", "am", "or"];

const emptyItem = (): MenuItem => ({
  id: `item_${Date.now()}`, category: "breakfast",
  name: { en: "", am: "", or: "" }, description: { en: "", am: "", or: "" },
  ingredients: { en: [], am: [], or: [] }, allergens: { en: [], am: [], or: [] },
  price: 0, calories: 0, prep_time: "10-15", image: "", rating: 4.5,
  is_best_seller: false, is_signature: false, is_new: false, is_spicy: false,
  is_available: true, isFasting: false,
});

export default function AdminDashboard() {
  const { t } = useLanguage();
  const router = useRouter();
  const [auth, setAuth] = useState(false);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [originalItems, setOriginalItems] = useState<MenuItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [categories, setCategories] = useState<CatType[]>([]);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [editingCat, setEditingCat] = useState<CatType | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showCatEditor, setShowCatEditor] = useState(false);
  const [mode, setMode] = useState<TabMode>("items");
  const [filterCat, setFilterCat] = useState("all");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasChanges = useMemo(
    () => JSON.stringify(originalItems) !== JSON.stringify(items),
    [originalItems, items]
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push("/admin"); return; }
      setAuth(true);
      loadData();
    });
  }, [router]);

  useEffect(() => {
    if (!auth) return;
    const unsub1 = subscribeToMenuItems(() => loadItems());
    const unsub2 = subscribeToCategories(() => loadCategories());
    return () => {
      unsub1.unsubscribe();
      unsub2.unsubscribe();
    };
  }, [auth]);

  async function loadData() {
    await Promise.all([loadItems(), loadCategories(), loadReviews()]);
  }

  async function loadItems() {
    try {
      const data = await getAllMenuItems();
      setItems(data);
      setOriginalItems(data);
    } catch { console.error("Failed to load items"); }
  }

  async function loadCategories() {
    try {
      setCategories(await getAllCategories());
    } catch { console.error("Failed to load categories"); }
  }

  async function loadReviews() {
    try {
      setReviews(await getAllReviews());
    } catch { console.error("Failed to load reviews"); }
  }

  const saveAll = async () => {
    setSaving(true);
    try {
      await upsertMenuItems(items);
      setOriginalItems([...items]);
    } catch (e: any) { alert("Save failed: " + e.message); }
    setSaving(false);
  };

  const undoChanges = () => setItems([...originalItems]);

  const deleteItem = async (id: string) => {
    if (!confirm("Delete this item permanently?")) return;
    try {
      await deleteMenuItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (e: any) { alert("Delete failed: " + e.message); }
  };

  const toggleAvailability = (id: string) =>
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, is_available: !i.is_available } : i))
    );

  const openEditor = (item?: MenuItem) => {
    setEditing(item ? { ...item } : emptyItem());
    setShowEditor(true);
  };

  const handleSaveItem = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await upsertMenuItem(editing);
      setItems((prev) => {
        const ex = prev.find((i) => i.id === editing.id);
        return ex
          ? prev.map((i) => (i.id === editing.id ? editing : i))
          : [...prev, editing];
      });
      setShowEditor(false);
      setEditing(null);
    } catch (e: any) { alert("Save failed: " + e.message); }
    setSaving(false);
  };

  const updateField = (field: string, value: any) => {
    if (!editing) return;
    setEditing({ ...editing, [field]: value });
  };

  const updateTranslatedField = (
    field: "name" | "description",
    lang: Language,
    value: string
  ) => {
    if (!editing) return;
    const current = (editing[field] as any) || {};
    const updated: any = { ...current, [lang]: value };
    if (lang === "en" && value && editing.id.startsWith("item_")) {
      if (!current.am) updated.am = value;
      if (!current.or) updated.or = value;
    }
    setEditing({ ...editing, [field]: updated } as MenuItem);
  };

  const updateArrayField = (
    field: "ingredients" | "allergens",
    lang: Language,
    value: string
  ) => {
    if (!editing) return;
    setEditing({
      ...editing,
      [field]: {
        ...(editing[field] as any),
        [lang]: value
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      },
    } as MenuItem);
  };

  const uploadImage = async (file: File) => {
    if (!editing) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${editing.category}/${editing.id}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("menu-images")
        .upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage
        .from("menu-images")
        .getPublicUrl(path);
      updateField("image", publicUrl);
    } catch (e: any) {
      alert("Upload failed: " + e.message);
    }
    setUploading(false);
  };

  const openCatEditor = (cat?: CatType) => {
    setEditingCat(
      cat || { id: `cat_${Date.now()}`, name: "", slug: "", sort_order: categories.length + 1 }
    );
    setShowCatEditor(true);
  };

  const handleSaveCategory = async () => {
    if (!editingCat) return;
    try {
      if (categories.find((c) => c.id === editingCat.id)) {
        await updateCategory(editingCat.id, editingCat);
      } else {
        await createCategory(editingCat);
      }
      await loadCategories();
      setShowCatEditor(false);
      setEditingCat(null);
    } catch (e: any) {
      alert("Save category failed: " + e.message);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    try {
      await deleteCategory(id);
      await loadCategories();
    } catch (e: any) {
      alert("Delete failed: " + e.message);
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!confirm("Delete this review?")) return;
    try {
      await deleteReview(id);
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch (e: any) {
      alert("Delete failed: " + e.message);
    }
  };

  const filteredItems = useMemo(() => {
    let f = filterCat === "all" ? items : items.filter((i) => i.category === filterCat);
    if (search) {
      const q = search.toLowerCase();
      f = f.filter(
        (i) =>
          i.name.en.toLowerCase().includes(q) ||
          i.name.am.toLowerCase().includes(q) ||
          i.name.or.toLowerCase().includes(q) ||
          i.id.toLowerCase().includes(q)
      );
    }
    return f;
  }, [items, filterCat, search]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/admin");
  };

  if (!auth) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 h-14 max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <h1 className="text-base font-bold text-gray-900">Admin</h1>
          </div>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <>
                <span className="text-xs text-amber-600 hidden sm:inline">Unsaved changes</span>
                <button onClick={undoChanges} className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  Undo
                </button>
                <button
                  onClick={saveAll}
                  disabled={saving}
                  className="px-4 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                  {saving ? "Saving..." : "Save"}
                </button>
              </>
            )}
            <button
              onClick={handleLogout}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* SAVE BAR (mobile-friendly inline) */}
      {hasChanges && (
        <div className="sm:hidden bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2 text-xs">
          <span className="text-amber-700 flex-1">You have unsaved changes</span>
          <button onClick={undoChanges} className="px-2 py-1 text-gray-600 bg-white border border-gray-200 rounded">Undo</button>
          <button onClick={saveAll} disabled={saving} className="px-3 py-1 bg-amber-600 text-white rounded disabled:opacity-50">
            {saving ? "..." : "Save"}
          </button>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-5">
        {/* TABS */}
        <div className="flex gap-0.5 mb-5 bg-gray-100 rounded-xl p-0.5">
          {(["items", "categories", "messages"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setMode(tab)}
              className={cn(
                "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                mode === tab ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              {tab === "items" && `Items (${items.length})`}
              {tab === "categories" && `Categories (${categories.length})`}
              {tab === "messages" && `Reviews (${reviews.length})`}
            </button>
          ))}
        </div>

        {/* ─── ITEMS TAB ───────────────────────────────────── */}
        {mode === "items" && (
          <>
            {/* Search + Add bar */}
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or ID..."
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-all"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X size={16} />
                  </button>
                )}
              </div>
              <button
                onClick={() => openEditor()}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700 transition-colors shadow-sm shrink-0"
              >
                <Plus size={16} /> Add
              </button>
            </div>

            {/* Category filter pills */}
            <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
              {[
                { id: "all", label: "All" },
                ...categories.map((c) => ({ id: c.slug, label: c.name })),
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setFilterCat(c.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                    filterCat === c.id
                      ? "bg-gray-900 text-white"
                      : "bg-white text-gray-500 border border-gray-200 hover:border-gray-300 hover:text-gray-700"
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Item count */}
            <p className="text-xs text-gray-400 mb-3">
              {filteredItems.length} of {items.length} items
              {filterCat !== "all" && ` in ${categories.find(c => c.slug === filterCat)?.name || filterCat}`}
              {search && ` matching "${search}"`}
            </p>

            {/* Items list */}
            <div className="space-y-1.5">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "bg-white rounded-lg border border-gray-200 px-3 py-2.5 flex items-center gap-3 hover:border-gray-300 transition-colors",
                    !item.is_available && "opacity-50"
                  )}
                >
                  <div className="w-10 h-10 rounded-lg bg-gray-100 shrink-0 overflow-hidden">
                    {item.image ? (
                      <img src={item.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <Image size={16} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900 truncate">{item.name.en}</span>
                      {item.is_best_seller && <Star size={10} className="text-amber-500 fill-amber-500 shrink-0" />}
                      {AR_ITEM_IDS.has(item.id) && (
                        <span className="inline-flex items-center gap-0.5 text-[8px] font-bold text-purple-600 bg-purple-50 px-1 py-0.5 rounded-full border border-purple-200 shrink-0">
                          <Box size={8} /> 3D
                        </span>
                      )}
                      {!item.is_available && <span className="text-[10px] text-red-500 font-medium shrink-0">Hidden</span>}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                      <span>{item.price} ETB</span>
                      <span>&middot;</span>
                      <span className="capitalize">{item.category}</span>
                      <span>&middot;</span>
                      <span>{item.id}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => toggleAvailability(item.id)}
                      className={cn(
                        "w-7 h-7 flex items-center justify-center rounded-lg transition-colors",
                        item.is_available
                          ? "text-green-600 bg-green-50 hover:bg-green-100"
                          : "text-gray-400 bg-gray-100 hover:bg-gray-200"
                      )}
                      title={item.is_available ? "Hide from menu" : "Show on menu"}
                    >
                      {item.is_available ? <Eye size={13} /> : <EyeOff size={13} />}
                    </button>
                    <button
                      onClick={() => openEditor(item)}
                      className="w-7 h-7 flex items-center justify-center text-gray-400 bg-gray-100 rounded-lg hover:text-amber-600 hover:bg-amber-50 transition-colors"
                      title="Edit"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="w-7 h-7 flex items-center justify-center text-gray-400 bg-gray-100 rounded-lg hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
              {filteredItems.length === 0 && (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-400">No items found</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* ─── CATEGORIES TAB ──────────────────────────────── */}
        {mode === "categories" && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">Categories</h2>
              <button
                onClick={() => openCatEditor()}
                className="flex items-center gap-1 px-3 py-1.5 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors"
              >
                <Plus size={14} /> Add
              </button>
            </div>
            <div className="space-y-1.5">
              {categories.map((cat) => (
                <div key={cat.id} className="bg-white rounded-lg border border-gray-200 px-3 py-2.5 flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{cat.name}</p>
                    <p className="text-xs text-gray-400">/{cat.slug} &middot; order {cat.sort_order}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openCatEditor(cat)} className="w-7 h-7 flex items-center justify-center text-gray-400 bg-gray-100 rounded-lg hover:text-amber-600 hover:bg-amber-50 transition-colors">
                      <Edit3 size={13} />
                    </button>
                    <button onClick={() => handleDeleteCategory(cat.id)} className="w-7 h-7 flex items-center justify-center text-gray-400 bg-gray-100 rounded-lg hover:text-red-500 hover:bg-red-50 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
              {categories.length === 0 && (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-400">No categories</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* ─── REVIEWS TAB ────────────────────────────────── */}
        {mode === "messages" && (
          <div className="space-y-2">
            {reviews.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <MessageSquare size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">No reviews yet</p>
              </div>
            ) : (
              reviews.map((review) => {
                const item = items.find((i) => i.id === review.itemId);
                return (
                  <div key={review.id} className="bg-white rounded-lg border border-gray-200 px-4 py-3">
                    <div className="flex items-start justify-between mb-1.5">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{review.author}</p>
                        {item && <p className="text-xs text-amber-600">{item.name.en}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400">{review.date}</span>
                        <button onClick={() => handleDeleteReview(review.id)} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500 rounded hover:bg-red-50 transition-colors">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 mb-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} size={11} className={star <= review.rating ? "text-amber-500" : "text-gray-200"} fill={star <= review.rating ? "#d97706" : "transparent"} />
                      ))}
                    </div>
                    <p className="text-sm text-gray-600">{review.comment}</p>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* ─── ITEM EDITOR MODAL ──────────────────────────────── */}
      <AnimatePresence>
        {showEditor && editing && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 overflow-y-auto"
            onClick={() => setShowEditor(false)}
          >
            <div className="min-h-full flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={(e) => e.stopPropagation()}>
              <motion.div
                initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }}
                className="w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl max-h-[90dvh] overflow-y-auto shadow-xl"
              >
                <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-gray-900">
                    {editing.id.startsWith("item_") ? "New Item" : "Edit Item"}
                  </h2>
                  <button onClick={() => setShowEditor(false)} className="w-7 h-7 flex items-center justify-center text-gray-400 bg-gray-100 rounded-lg hover:bg-gray-200">
                    <X size={16} />
                  </button>
                </div>

                <div className="p-4 space-y-4">
                  {/* ID + Category row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">ID</label>
                      <input type="text" value={editing.id} onChange={(e) => updateField("id", e.target.value)}
                        className="w-full mt-1 px-2.5 py-2 bg-gray-50 rounded-lg text-sm text-gray-900 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400" />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Category</label>
                      <select value={editing.category} onChange={(e) => updateField("category", e.target.value)}
                        className="w-full mt-1 px-2.5 py-2 bg-gray-50 rounded-lg text-sm text-gray-900 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400">
                        {categories.map((cat) => (
                          <option key={cat.slug} value={cat.slug}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Translation fields */}
                  {LANGUAGES.map((lang) => (
                    <div key={lang} className="space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <p className="text-xs font-semibold text-gray-700">
                        {lang === "en" ? "English" : lang === "am" ? "አማርኛ" : "Afaan Oromoo"}
                      </p>
                      <input type="text" value={(editing.name as any)[lang] || ""}
                        onChange={(e) => updateTranslatedField("name", lang, e.target.value)}
                        placeholder="Name"
                        className="w-full px-2.5 py-2 bg-white rounded-lg text-sm text-gray-900 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400" />
                      <textarea value={(editing.description as any)[lang] || ""}
                        onChange={(e) => updateTranslatedField("description", lang, e.target.value)}
                        placeholder="Description"
                        rows={2}
                        className="w-full px-2.5 py-2 bg-white rounded-lg text-sm text-gray-900 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 resize-none" />
                      <input type="text" value={((editing.ingredients as any)[lang] || []).join(", ")}
                        onChange={(e) => updateArrayField("ingredients", lang, e.target.value)}
                        placeholder="Ingredients (comma separated)"
                        className="w-full px-2.5 py-2 bg-white rounded-lg text-sm text-gray-900 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400" />
                      <input type="text" value={((editing.allergens as any)[lang] || []).join(", ")}
                        onChange={(e) => updateArrayField("allergens", lang, e.target.value)}
                        placeholder="Allergens (comma separated)"
                        className="w-full px-2.5 py-2 bg-white rounded-lg text-sm text-gray-900 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400" />
                    </div>
                  ))}

                  {/* Price, Calories, Prep, Rating */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Price (ETB)</label>
                      <input type="number" value={editing.price} onChange={(e) => updateField("price", Number(e.target.value))}
                        className="w-full mt-1 px-2.5 py-2 bg-gray-50 rounded-lg text-sm text-gray-900 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400" />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Calories</label>
                      <input type="number" value={editing.calories} onChange={(e) => updateField("calories", Number(e.target.value))}
                        className="w-full mt-1 px-2.5 py-2 bg-gray-50 rounded-lg text-sm text-gray-900 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400" />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Prep (min)</label>
                      <input type="text" value={editing.prep_time} onChange={(e) => updateField("prep_time", e.target.value)}
                        className="w-full mt-1 px-2.5 py-2 bg-gray-50 rounded-lg text-sm text-gray-900 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400" />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Rating</label>
                      <input type="number" step="0.1" min="0" max="5" value={editing.rating} onChange={(e) => updateField("rating", Number(e.target.value))}
                        className="w-full mt-1 px-2.5 py-2 bg-gray-50 rounded-lg text-sm text-gray-900 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400" />
                    </div>
                  </div>

                  {/* Image */}
                  <div>
                    <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Image</label>
                    <div className="flex items-center gap-2 mt-1">
                      <input type="text" value={editing.image || ""} onChange={(e) => updateField("image", e.target.value)}
                        placeholder="URL or upload"
                        className="flex-1 px-2.5 py-2 bg-gray-50 rounded-lg text-sm text-gray-900 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400" />
                      <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                        className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center gap-1">
                        <Upload size={14} /> {uploading ? "..." : "Upload"}
                      </button>
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                        onChange={(e) => { if (e.target.files?.[0]) uploadImage(e.target.files[0]); }} />
                    </div>
                    {editing.image && (
                      <div className="mt-2 w-14 h-14 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                        <img src={editing.image} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>

                  {/* Toggles */}
                  <div>
                    <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-2 block">Badges</label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { key: "is_best_seller", label: "Best Seller" },
                        { key: "is_signature", label: "Signature" },
                        { key: "is_new", label: "New" },
                        { key: "is_spicy", label: "Spicy" },
                        { key: "is_available", label: "Available" },
                        { key: "isFasting", label: "Fasting" },
                      ].map((b) => (
                        <button key={b.key} onClick={() => updateField(b.key, !(editing as any)[b.key])}
                          className={cn(
                            "px-2.5 py-1 rounded-lg text-xs font-medium transition-all border",
                            (editing as any)[b.key]
                              ? "bg-amber-600 text-white border-amber-600"
                              : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                          )}>
                          {b.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
                  <button onClick={handleSaveItem} disabled={saving}
                    className="w-full py-2.5 bg-amber-600 text-white rounded-lg font-semibold text-sm hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                    {saving ? "Saving..." : editing.id.startsWith("item_") ? "Create Item" : "Save Changes"}
                  </button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── CATEGORY EDITOR MODAL ──────────────────────────── */}
      <AnimatePresence>
        {showCatEditor && editingCat && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
            onClick={() => setShowCatEditor(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-gray-900">
                  {categories.find((c) => c.id === editingCat.id) ? "Edit Category" : "New Category"}
                </h2>
                <button onClick={() => setShowCatEditor(false)} className="w-7 h-7 flex items-center justify-center text-gray-400 bg-gray-100 rounded-lg hover:bg-gray-200">
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Name</label>
                  <input type="text" value={editingCat.name}
                    onChange={(e) => setEditingCat({ ...editingCat, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                    className="w-full mt-1 px-2.5 py-2 bg-gray-50 rounded-lg text-sm text-gray-900 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400" />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Slug</label>
                  <input type="text" value={editingCat.slug}
                    onChange={(e) => setEditingCat({ ...editingCat, slug: e.target.value })}
                    className="w-full mt-1 px-2.5 py-2 bg-gray-50 rounded-lg text-sm text-gray-900 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400" />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Sort Order</label>
                  <input type="number" value={editingCat.sort_order}
                    onChange={(e) => setEditingCat({ ...editingCat, sort_order: Number(e.target.value) })}
                    className="w-full mt-1 px-2.5 py-2 bg-gray-50 rounded-lg text-sm text-gray-900 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400" />
                </div>
                <button onClick={handleSaveCategory}
                  className="w-full py-2.5 bg-gray-900 text-white rounded-lg font-semibold text-sm hover:bg-gray-800 transition-colors">
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
