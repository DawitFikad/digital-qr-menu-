"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { menuItems as defaultItems, MenuItem } from "@/data/menuData";
import { Language } from "@/data/translations";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
  LogOut, Edit3, Trash2, Eye, EyeOff, Plus, ChevronLeft, Star, X, Save, RefreshCw,
  MessageSquare, AlertTriangle, ShoppingBag, Check, Ban, Search, Filter,
  ArrowUpDown, Upload, Image as ImageIcon, Smartphone,
} from "lucide-react";

interface Review {
  id: string; itemId: string; author: string; rating: number; comment: string; date: string;
}

interface Order {
  id: string; tableNumber: string; customerName: string; phoneNumber: string;
  specialNotes: string; items: string; totalAmount: number; paymentMethod: string;
  paymentScreenshot: string; status: string; createdAt: string;
}

interface CartItemData {
  id: string; name: { en: string; am: string; or: string }; price: number; quantity: number;
}

type EditableItem = Partial<MenuItem> & { id: string };
type TabMode = "items" | "reviews" | "orders";

const emptyItem = (): EditableItem => ({
  id: `item_${Date.now()}`, category: "breakfast",
  name: { en: "", am: "", or: "" }, description: { en: "", am: "", or: "" },
  ingredients: { en: [], am: [], or: [] }, allergens: { en: [], am: [], or: [] },
  price: 0, calories: 0, prep_time: "10-15", image: "", rating: 4.5,
  is_best_seller: false, is_signature: false, is_new: false, is_spicy: false,
  is_available: true, isFasting: false,
});

const CATEGORIES = ["breakfast", "lunch", "drinks"] as const;
const LANGUAGES: Language[] = ["en", "am", "or"];

export default function AdminDashboard() {
  const { language, t } = useLanguage();
  const router = useRouter();
  const [originalItems, setOriginalItems] = useState<MenuItem[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [auth, setAuth] = useState(false);
  const [editing, setEditing] = useState<EditableItem | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<TabMode>("items");
  const [loadError, setLoadError] = useState(false);
  const [orderFilter, setOrderFilter] = useState<string>("all");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [showScreenshot, setShowScreenshot] = useState<string | null>(null);
  const [itemSearch, setItemSearch] = useState("");
  const [sortField, setSortField] = useState<"name" | "price" | "category">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const hasChanges = useMemo(() => {
    return JSON.stringify(originalItems) !== JSON.stringify(items);
  }, [originalItems, items]);

  useEffect(() => {
    if (localStorage.getItem("admin_auth") !== "true") {
      router.push("/admin");
      return;
    }
    setAuth(true);
    loadData();
  }, [router]);

  async function loadData() {
    setLoadError(false);
    try {
      const [itemsRes, reviewsRes, ordersRes] = await Promise.all([
        fetch("/.netlify/functions/menu-data"), fetch("/api/reviews"), fetch("/api/orders"),
      ]);
      if (itemsRes.ok) {
        const apiItems: MenuItem[] = await itemsRes.json();
        if (apiItems.length > 0) {
          const merged = mergeDefaults(apiItems);
          setOriginalItems(merged); setItems(merged);
          localStorage.setItem("menu_items", JSON.stringify(merged));
        } else { fallbackLoadItems(); }
      } else { fallbackLoadItems(); }
      if (reviewsRes.ok) {
        const apiReviews: Review[] = await reviewsRes.json();
        if (apiReviews.length > 0) {
          setReviews(apiReviews);
          localStorage.setItem("menu_reviews", JSON.stringify(apiReviews));
        }
      }
      if (ordersRes.ok) {
        const apiOrders: Order[] = await ordersRes.json();
        setOrders(apiOrders);
      }
    } catch { fallbackLoadItems(); }
  }

  const updateOrderStatus = async (id: string, status: string) => {
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
      }
    } catch {}
  };

  function mergeDefaults(apiItems: MenuItem[]): MenuItem[] {
    const merged = defaultItems.map(d => {
      const s = apiItems.find((p) => p.id === d.id);
      return s ? { ...d, ...s } : d;
    });
    const extra = apiItems.filter((p) => !defaultItems.find((d) => d.id === p.id));
    return [...merged, ...extra];
  }

  function fallbackLoadItems() {
    try {
      const stored = localStorage.getItem("menu_items");
      if (stored) {
        const parsed = JSON.parse(stored);
        const merged = mergeDefaults(parsed);
        setOriginalItems(merged); setItems(merged);
      } else {
        setOriginalItems(defaultItems); setItems(defaultItems);
        localStorage.setItem("menu_items", JSON.stringify(defaultItems));
      }
    } catch { setOriginalItems(defaultItems); setItems(defaultItems); }
  }

  const undoChanges = () => setItems([...originalItems]);

  const saveAll = async () => {
    setSaving(true);
    localStorage.setItem("menu_items", JSON.stringify(items));
    const adminSecret = localStorage.getItem("admin_secret") || "";
    try {
      const res = await fetch("/.netlify/functions/menu-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(adminSecret ? { Authorization: `Bearer ${adminSecret}` } : {}),
        },
        body: JSON.stringify(items),
      });
      if (res.ok) setOriginalItems([...items]);
    } catch {}
    setTimeout(() => setSaving(false), 400);
  };

  const handleLogout = () => { localStorage.removeItem("admin_auth"); router.push("/admin"); };
  const toggleAvailability = (id: string) => setItems((prev) => prev.map((i) => (i.id === id ? { ...i, is_available: !i.is_available } : i)));
  const deleteItem = (id: string) => { if (confirm("Delete this item permanently?")) setItems((prev) => prev.filter((i) => i.id !== id)); };
  const openEditor = (item?: MenuItem) => { setEditing(item ? { ...item } : emptyItem()); setShowEditor(true); };
  const handleSave = () => {
    if (!editing) return;
    setSaving(true);
    setItems((prev) => {
      const ex = prev.find((i) => i.id === editing.id);
      return ex ? prev.map((i) => (i.id === editing.id ? (editing as MenuItem) : i)) : [...prev, editing as MenuItem];
    });
    setTimeout(() => { setSaving(false); setShowEditor(false); setEditing(null); }, 300);
  };
  const updateField = (field: string, value: any) => { if (!editing) return; setEditing({ ...editing, [field]: value }); };
  const updateTranslatedField = (field: "name" | "description", lang: Language, value: string) => {
    if (!editing) return;
    setEditing({ ...editing, [field]: { ...(editing[field] as any), [lang]: value } } as EditableItem);
  };
  const updateArrayField = (field: "ingredients" | "allergens", lang: Language, value: string) => {
    if (!editing) return;
    setEditing({
      ...editing,
      [field]: { ...(editing[field] as any), [lang]: value.split(",").map((s) => s.trim()).filter(Boolean) },
    } as EditableItem);
  };

  const sortedFilteredItems = useMemo(() => {
    let f = filter === "all" ? items : items.filter((i) => i.category === filter);
    if (itemSearch) {
      const q = itemSearch.toLowerCase();
      f = f.filter((i) =>
        i.name.en.toLowerCase().includes(q) ||
        i.name.am.toLowerCase().includes(q) ||
        i.name.or.toLowerCase().includes(q) ||
        i.id.toLowerCase().includes(q)
      );
    }
    return [...f].sort((a, b) => {
      let cmp = 0;
      if (sortField === "name") cmp = a.name.en.localeCompare(b.name.en);
      else if (sortField === "price") cmp = a.price - b.price;
      else if (sortField === "category") cmp = a.category.localeCompare(b.category);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [items, filter, itemSearch, sortField, sortDir]);

  const filteredOrders = orderFilter === "all" ? orders : orders.filter((o) => o.status === orderFilter);
  const pendingOrderCount = orders.filter((o) => o.status === "pending").length;

  function parseOrderItems(raw: string): CartItemData[] {
    try { return JSON.parse(raw); } catch { return []; }
  }

  const toggleSort = (field: "name" | "price" | "category") => {
    if (sortField === field) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  if (!auth) return null;

  return (
    <div className="luxury-bg">
      <header className="sticky top-0 z-40 bg-white border-b border-border-warm shadow-sm">
        <div className="flex items-center justify-between px-4 h-16 max-w-[1000px] mx-auto">
          <button onClick={() => router.push("/")} className="w-10 h-10 flex items-center justify-center text-muted hover:text-black"><ChevronLeft size={22} /></button>
          <h1 className="text-lg font-bold text-black">Admin Dashboard</h1>
          <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors"><LogOut size={16} /> Logout</button>
        </div>
      </header>

      <div className="max-w-[1000px] mx-auto px-4 py-5">
        {/* Save Bar */}
        <div className={cn("sticky top-16 z-30 -mx-4 px-4 py-3 border-b transition-all duration-300 flex items-center gap-2", hasChanges ? "bg-amber-50 border-amber-200" : "bg-transparent border-transparent pointer-events-none opacity-0")}>
          <AlertTriangle size={16} className="text-amber-600 flex-shrink-0" />
          <span className="text-sm text-amber-800 flex-1">Unsaved changes</span>
          <button onClick={undoChanges} className="px-3 py-1.5 text-xs font-medium text-black/60 bg-white border border-border-warm rounded-xl hover:bg-cream-dark transition-colors">Undo</button>
          <button onClick={saveAll} disabled={saving} className="px-5 py-1.5 bg-gold text-white rounded-xl text-xs font-semibold hover:bg-brown-dark transition-colors disabled:opacity-50 flex items-center gap-1.5">
            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}{saving ? "Saving..." : "Save All"}
          </button>
        </div>

        {/* Tab toggle */}
        <div className="flex gap-1 mb-5 bg-white rounded-2xl p-1 border border-border-warm shadow-sm">
          {(["items", "reviews", "orders"] as const).map((tab) => (
            <button key={tab} onClick={() => setMode(tab)}
              className={cn("flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all relative", mode === tab ? "bg-gold text-white" : "text-muted/60 hover:text-black")}>
              {tab === "items" && `Items (${items.length})`}
              {tab === "reviews" && `Reviews (${reviews.length})`}
              {tab === "orders" && (
                <span>Orders ({orders.length}){pendingOrderCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[9px] flex items-center justify-center font-bold">{pendingOrderCount}</span>
                )}</span>
              )}
            </button>
          ))}
        </div>

        {/* ITEMS TAB */}
        {mode === "items" && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              {[
                { label: "Total Items", value: items.length, color: "text-gold" },
                { label: "Available", value: items.filter((i) => i.is_available).length, color: "text-green-600" },
                { label: "Hidden", value: items.filter((i) => !i.is_available).length, color: "text-red-500" },
                { label: "Best Seller", value: items.filter((i) => i.is_best_seller).length, color: "text-gold" },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-xl p-4 border border-border-warm text-center shadow-sm">
                  <p className={cn("text-xl md:text-2xl font-bold", s.color)}>{s.value}</p>
                  <p className="text-xs text-muted/50 mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-1">
                <div className="relative flex-1 max-w-xs">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/40" />
                  <input type="text" value={itemSearch} onChange={(e) => setItemSearch(e.target.value)}
                    placeholder="Search items..." className="w-full pl-9 pr-3 py-2 bg-white border border-border-warm rounded-xl text-sm text-black focus:outline-none focus:border-gold/50" />
                </div>
                <div className="flex gap-1">
                  {["all", ...CATEGORIES].map((c) => (
                    <button key={c} onClick={() => setFilter(c)}
                      className={cn("px-3 py-1.5 rounded-full text-xs font-medium transition-all", filter === c ? "bg-gold text-white" : "bg-white text-muted/60 border border-border-warm")}>
                      {c === "all" ? "All" : c}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={() => openEditor()} className="flex items-center gap-1 px-4 py-2 bg-gold text-white rounded-xl text-sm font-semibold hover:bg-brown-dark transition-colors shadow-sm">
                <Plus size={16} /> Add Item
              </button>
            </div>

            {/* Sort controls */}
            <div className="flex items-center gap-2 mb-3 text-xs text-muted/60">
              <span className="font-medium">Sort:</span>
              {(["name", "price", "category"] as const).map((f) => (
                <button key={f} onClick={() => toggleSort(f)}
                  className={cn("flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors", sortField === f ? "bg-gold/10 text-gold font-semibold" : "hover:text-black")}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                  {sortField === f && <ArrowUpDown size={12} />}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {sortedFilteredItems.map((item) => (
                <div key={item.id} className={cn("bg-white rounded-xl p-4 border border-border-warm flex items-center gap-4 hover:shadow-sm transition-shadow", !item.is_available && "opacity-55")}>
                  <div className="w-14 h-14 rounded-xl bg-cream-dark flex-shrink-0 overflow-hidden border border-border-warm">
                    <img src={item.image} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-base font-bold text-black truncate">{item.name.en}</h3>
                      {item.is_best_seller && <Star size={12} className="text-gold fill-gold" />}
                      {item.is_signature && <span className="text-[9px] bg-brown-dark text-white px-1.5 py-0.5 rounded font-bold">S</span>}
                      {item.is_new && <span className="text-[9px] bg-green-600 text-white px-1.5 py-0.5 rounded font-bold">NEW</span>}
                      {item.is_spicy && <span className="text-[9px] bg-red-500 text-white px-1.5 py-0.5 rounded font-bold">!</span>}
                      {item.isFasting && <span className="text-[9px] bg-olive-600 text-white px-1.5 py-0.5 rounded font-bold">F</span>}
                      {item.arModel && <span className="text-[9px] bg-gold text-white px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5"><Smartphone size={8} />AR</span>}
                    </div>
                    <p className="text-sm text-muted/60 mt-0.5">{item.price} ETB &middot; {item.category} &middot; ID: {item.id}</p>
                    {!item.is_available && <span className="text-xs text-red-500 font-medium">Hidden from menu</span>}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => toggleAvailability(item.id)}
                      className={cn("w-8 h-8 flex items-center justify-center rounded-xl transition-colors", item.is_available ? "text-green-600 bg-green-50" : "text-muted/50 bg-cream-dark")}>
                      {item.is_available ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                    <button onClick={() => openEditor(item)}
                      className="w-8 h-8 flex items-center justify-center text-muted/50 bg-cream-dark rounded-xl hover:text-gold transition-colors"><Edit3 size={14} /></button>
                    <button onClick={() => deleteItem(item.id)}
                      className="w-8 h-8 flex items-center justify-center text-muted/50 bg-cream-dark rounded-xl hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
              {sortedFilteredItems.length === 0 && (
                <div className="text-center py-16 bg-white rounded-2xl border border-border-warm">
                  <p className="text-base text-muted/50">No items found</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* REVIEWS TAB */}
        {mode === "reviews" && (
          <div className="space-y-3">
            {reviews.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-border-warm">
                <MessageSquare size={40} className="mx-auto text-muted/30 mb-3" />
                <p className="text-base text-muted/60">No reviews yet</p>
              </div>
            ) : (
              reviews.map((review) => {
                const item = items.find((i) => i.id === review.itemId);
                return (
                  <div key={review.id} className="bg-white rounded-xl p-4 border border-border-warm">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-bold text-black">{review.author}</p>
                        {item && <p className="text-xs text-gold">{item.name.en} <span className="text-muted/50">({review.itemId})</span></p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted/50">{review.date}</span>
                        <button onClick={() => {
                          if (confirm("Delete this review?")) {
                            const upd = reviews.filter((r) => r.id !== review.id);
                            setReviews(upd);
                            localStorage.setItem("menu_reviews", JSON.stringify(upd));
                            fetch("/api/reviews", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: review.id }) }).catch(() => {});
                          }
                        }} className="w-7 h-7 flex items-center justify-center text-muted/50 hover:text-red-500 rounded-xl hover:bg-red-50 transition-colors"><Trash2 size={13} /></button>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 mb-1.5">
                      {[1,2,3,4,5].map((star) => (
                        <Star key={star} size={12} className={star <= review.rating ? "text-gold" : "text-border-warm"} fill={star <= review.rating ? "#C08010" : "transparent"} />
                      ))}
                    </div>
                    <p className="text-sm text-black/60 leading-relaxed">{review.comment}</p>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ORDERS TAB */}
        {mode === "orders" && (
          <>
            <div className="flex gap-2 mb-4 overflow-x-auto hide-scrollbar">
              {["all", "pending", "verified", "rejected"].map((s) => (
                <button key={s} onClick={() => setOrderFilter(s)}
                  className={cn("px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all capitalize", orderFilter === s ? "bg-gold text-white" : "bg-white text-muted/60 border border-border-warm")}>
                  {s}{s === "pending" && orders.filter((o) => o.status === "pending").length > 0 && ` (${orders.filter((o) => o.status === "pending").length})`}
                </button>
              ))}
            </div>
            <div className="space-y-3">
              {filteredOrders.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-border-warm">
                  <ShoppingBag size={40} className="mx-auto text-muted/30 mb-3" />
                  <p className="text-base text-muted/60">No orders found</p>
                </div>
              ) : (
                filteredOrders.map((order) => {
                  const orderItems = parseOrderItems(order.items);
                  const isExpanded = expandedOrder === order.id;
                  return (
                    <div key={order.id} className={cn("bg-white rounded-xl border border-border-warm overflow-hidden shadow-sm", order.status === "verified" && "ring-1 ring-green-300", order.status === "rejected" && "ring-1 ring-red-300")}>
                      <button onClick={() => setExpandedOrder(isExpanded ? null : order.id)} className="w-full text-left p-4 flex items-center gap-3">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", order.status === "pending" ? "bg-amber-50" : order.status === "verified" ? "bg-green-50" : "bg-red-50")}>
                          <ShoppingBag size={18} className={order.status === "pending" ? "text-amber-600" : order.status === "verified" ? "text-green-600" : "text-red-600"} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-black">{order.id}</span>
                            <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize", order.status === "pending" ? "bg-amber-100 text-amber-700" : order.status === "verified" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>{order.status}</span>
                          </div>
                          <p className="text-xs text-muted/50 mt-0.5">Table {order.tableNumber} &middot; {new Date(order.createdAt).toLocaleString()} &middot; <strong>{order.totalAmount.toLocaleString()} ETB</strong></p>
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="px-4 pb-4 space-y-3 border-t border-border-warm/60 pt-3">
                          <div>
                            <p className="text-[10px] text-muted/50 uppercase tracking-wider mb-2 font-semibold">Order Items</p>
                            {orderItems.map((oi: any) => (
                              <div key={oi.id} className="flex items-center justify-between py-1">
                                <span className="text-sm text-black">{oi.name?.en || oi.id} x{oi.quantity}</span>
                                <span className="text-sm text-muted font-medium">{(oi.price * oi.quantity).toLocaleString()} ETB</span>
                              </div>
                            ))}
                            <div className="border-t border-border-warm/40 mt-1 pt-2 flex items-center justify-between">
                              <span className="text-sm font-bold text-black">TOTAL</span>
                              <span className="text-base font-bold text-gold">{order.totalAmount.toLocaleString()} ETB</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-[10px] text-muted/50 uppercase tracking-wider mb-1 font-semibold">Customer Info</p>
                              <p className="text-sm text-black">Table: {order.tableNumber}</p>
                              {order.customerName && <p className="text-sm text-black">Name: {order.customerName}</p>}
                              {order.phoneNumber && <p className="text-sm text-black">Phone: {order.phoneNumber}</p>}
                              {order.specialNotes && <p className="text-sm text-black">Notes: {order.specialNotes}</p>}
                              <p className="text-sm text-black capitalize">Payment: {order.paymentMethod}</p>
                            </div>
                            {order.paymentScreenshot && (
                              <div>
                                <p className="text-[10px] text-muted/50 uppercase tracking-wider mb-1 font-semibold">Screenshot</p>
                                <button onClick={() => setShowScreenshot(order.paymentScreenshot)} className="w-full rounded-xl overflow-hidden border border-border-warm bg-cream-dark">
                                  <img src={order.paymentScreenshot} alt="Payment" className="w-full h-32 object-contain" />
                                </button>
                              </div>
                            )}
                          </div>

                          {order.status === "pending" && (
                            <div className="flex gap-2 pt-1">
                              <button onClick={() => updateOrderStatus(order.id, "verified")} className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-1.5"><Check size={16} /> Accept</button>
                              <button onClick={() => updateOrderStatus(order.id, "rejected")} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors flex items-center justify-center gap-1.5"><Ban size={16} /> Reject</button>
                            </div>
                          )}
                          {order.status === "verified" && (
                            <div className="py-2 text-center">
                              <span className="text-sm font-semibold text-green-600 bg-green-50 px-5 py-2 rounded-full">Verified - Customer can show to waiter</span>
                            </div>
                          )}
                          {order.status === "rejected" && (
                            <div className="py-2 text-center">
                              <span className="text-sm font-semibold text-red-600 bg-red-50 px-5 py-2 rounded-full">Rejected</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>

      {/* Full-screen Screenshot viewer */}
      <AnimatePresence>
        {showScreenshot && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setShowScreenshot(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="max-w-full max-h-full relative">
              <img src={showScreenshot} alt="Payment" className="max-w-full max-h-[90vh] object-contain rounded-xl" />
              <button onClick={() => setShowScreenshot(null)} className="absolute top-4 right-4 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"><X size={22} /></button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editor Modal */}
      {showEditor && editing && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm overflow-y-auto" onClick={() => setShowEditor(false)}>
          <div className="min-h-full flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={(e) => e.stopPropagation()}>
            <div className="w-full max-w-[600px] bg-white rounded-t-3xl sm:rounded-3xl max-h-[90dvh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 z-10 bg-white pt-3 pb-2 px-5 border-b border-border-warm flex items-center justify-between">
                <h2 className="text-lg font-bold text-black">{editing.id.startsWith("item_") ? "Add New Item" : "Edit Item"}</h2>
                <button onClick={() => setShowEditor(false)} className="w-8 h-8 flex items-center justify-center text-muted/50 bg-cream-dark rounded-full"><X size={20} /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted/50 uppercase tracking-wider block mb-1">Category</label>
                    <select value={editing.category} onChange={(e) => updateField("category", e.target.value)} className="w-full px-3 py-2.5 bg-cream-dark rounded-xl text-sm text-black focus:outline-none focus:ring-2 focus:ring-gold/50">
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted/50 uppercase tracking-wider block mb-1">Item ID</label>
                    <input type="text" value={editing.id} onChange={(e) => updateField("id", e.target.value)} className="w-full px-3 py-2.5 bg-cream-dark rounded-xl text-sm text-black focus:outline-none focus:ring-2 focus:ring-gold/50" />
                  </div>
                </div>

                {LANGUAGES.map((lang) => (
                  <div key={lang} className="space-y-3 p-3 bg-cream-dark/30 rounded-xl border border-border-warm/50">
                    <p className="text-xs font-bold text-black uppercase">{lang === "en" ? "English" : lang === "am" ? "አማርኛ" : "Afaan Oromoo"}</p>
                    <div>
                      <label className="text-[10px] font-medium text-muted/50 uppercase tracking-wider block mb-1">Name</label>
                      <input type="text" value={(editing.name as any)[lang] || ""} onChange={(e) => updateTranslatedField("name", lang, e.target.value)} className="w-full px-3 py-2.5 bg-white rounded-xl text-sm text-black focus:outline-none focus:ring-2 focus:ring-gold/50" />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-muted/50 uppercase tracking-wider block mb-1">Description</label>
                      <textarea value={(editing.description as any)[lang] || ""} onChange={(e) => updateTranslatedField("description", lang, e.target.value)} className="w-full px-3 py-2.5 bg-white rounded-xl text-sm text-black focus:outline-none focus:ring-2 focus:ring-gold/50 resize-none h-16" />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-muted/50 uppercase tracking-wider block mb-1">Ingredients (comma separated)</label>
                      <input type="text" value={((editing.ingredients as any)[lang] || []).join(", ")} onChange={(e) => updateArrayField("ingredients", lang, e.target.value)} className="w-full px-3 py-2.5 bg-white rounded-xl text-sm text-black focus:outline-none focus:ring-2 focus:ring-gold/50" />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-muted/50 uppercase tracking-wider block mb-1">Allergens (comma separated)</label>
                      <input type="text" value={((editing.allergens as any)[lang] || []).join(", ")} onChange={(e) => updateArrayField("allergens", lang, e.target.value)} className="w-full px-3 py-2.5 bg-white rounded-xl text-sm text-black focus:outline-none focus:ring-2 focus:ring-gold/50" />
                    </div>
                  </div>
                ))}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted/50 uppercase tracking-wider block mb-1">Price (ETB)</label>
                    <input type="number" value={editing.price} onChange={(e) => updateField("price", Number(e.target.value))} className="w-full px-3 py-2.5 bg-cream-dark rounded-xl text-sm text-black focus:outline-none focus:ring-2 focus:ring-gold/50" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted/50 uppercase tracking-wider block mb-1">Calories</label>
                    <input type="number" value={editing.calories} onChange={(e) => updateField("calories", Number(e.target.value))} className="w-full px-3 py-2.5 bg-cream-dark rounded-xl text-sm text-black focus:outline-none focus:ring-2 focus:ring-gold/50" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted/50 uppercase tracking-wider block mb-1">Prep (min)</label>
                    <input type="text" value={editing.prep_time} onChange={(e) => updateField("prep_time", e.target.value)} className="w-full px-3 py-2.5 bg-cream-dark rounded-xl text-sm text-black focus:outline-none focus:ring-2 focus:ring-gold/50" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted/50 uppercase tracking-wider block mb-1">Rating</label>
                    <input type="number" step="0.1" min="0" max="5" value={editing.rating} onChange={(e) => updateField("rating", Number(e.target.value))} className="w-full px-3 py-2.5 bg-cream-dark rounded-xl text-sm text-black focus:outline-none focus:ring-2 focus:ring-gold/50" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted/50 uppercase tracking-wider block mb-1">Image URL</label>
                  <input type="text" value={editing.image || ""} onChange={(e) => updateField("image", e.target.value)} className="w-full px-3 py-2.5 bg-cream-dark rounded-xl text-sm text-black focus:outline-none focus:ring-2 focus:ring-gold/50" placeholder="/images/..." />
                  {editing.image && (
                    <div className="mt-2 w-20 h-20 rounded-xl overflow-hidden bg-cream-dark border border-border-warm">
                      <img src={editing.image} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-medium text-muted/50 uppercase tracking-wider block mb-1">AR 3D Models</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-muted/50">GLB (Android) path</label>
                      <input type="text" value={(editing as any).arModel?.glb || ""} onChange={(e) => updateField("arModel", { ...((editing as any).arModel || {}), glb: e.target.value, usdz: (editing as any).arModel?.usdz || "" })} className="w-full px-3 py-2.5 bg-cream-dark rounded-xl text-xs text-black focus:outline-none focus:ring-2 focus:ring-gold/50 mt-1" placeholder="/model.glb" />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted/50">USDZ (iPhone) path</label>
                      <input type="text" value={(editing as any).arModel?.usdz || ""} onChange={(e) => updateField("arModel", { ...((editing as any).arModel || {}), glb: (editing as any).arModel?.glb || "", usdz: e.target.value })} className="w-full px-3 py-2.5 bg-cream-dark rounded-xl text-xs text-black focus:outline-none focus:ring-2 focus:ring-gold/50 mt-1" placeholder="/model.usdz" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted/50 uppercase tracking-wider block mb-2">Badges & Toggles</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: "is_best_seller", label: "Best Seller" },
                      { key: "is_signature", label: "Signature" },
                      { key: "is_new", label: "New" },
                      { key: "is_spicy", label: "Spicy" },
                      { key: "is_available", label: "Available" },
                      { key: "isFasting", label: "Fasting" },
                    ].map((b) => (
                      <button key={b.key} onClick={() => updateField(b.key, !(editing as any)[b.key])}
                        className={cn("px-3 py-1.5 rounded-full text-xs font-bold transition-all border", (editing as any)[b.key] ? "bg-gold text-white border-gold" : "bg-cream-dark text-muted/50 border-border-warm")}>
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="sticky bottom-0 bg-white border-t border-border-warm p-4">
                <button onClick={handleSave} disabled={saving}
                  className="w-full py-3 bg-gold text-white rounded-xl font-semibold text-base hover:bg-brown-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}{saving ? "Saving..." : editing.id.startsWith("item_") ? "Create Item" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="h-8" />
    </div>
  );
}
