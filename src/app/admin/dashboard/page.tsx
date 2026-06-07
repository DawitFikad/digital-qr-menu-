"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { menuItems as defaultItems, MenuItem } from "@/data/menuData";
import { Language } from "@/data/translations";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
  LogOut,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Plus,
  ChevronLeft,
  Star,
  X,
  Save,
  RefreshCw,
  MessageSquare,
  AlertTriangle,
  ShoppingBag,
  Check,
  Ban,
  ImageIcon,
} from "lucide-react";

interface Review {
  id: string;
  itemId: string;
  author: string;
  rating: number;
  comment: string;
  date: string;
}

interface Order {
  id: string;
  tableNumber: string;
  customerName: string;
  phoneNumber: string;
  specialNotes: string;
  items: string;
  totalAmount: number;
  paymentMethod: string;
  paymentScreenshot: string;
  status: string;
  createdAt: string;
}

interface CartItemData {
  id: string;
  name: { en: string; am: string; or: string };
  price: number;
  quantity: number;
}

type EditableItem = Partial<MenuItem> & { id: string };

const emptyItem = (): EditableItem => ({
  id: `item_${Date.now()}`,
  category: "breakfast",
  name: { en: "", am: "", or: "" },
  description: { en: "", am: "", or: "" },
  ingredients: { en: [], am: [], or: [] },
  allergens: { en: [], am: [], or: [] },
  price: 0,
  calories: 0,
  prep_time: "10-15",
  image: "",
  rating: 4.5,
  is_best_seller: false,
  is_signature: false,
  is_new: false,
  is_spicy: false,
  is_available: true,
  isFasting: false,
});

const CATEGORIES = ["breakfast", "lunch", "drinks"] as const;
type TabMode = "items" | "reviews" | "orders";

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
        fetch("/api/menu-items"),
        fetch("/api/reviews"),
        fetch("/api/orders"),
      ]);
      if (itemsRes.ok) {
        const apiItems: MenuItem[] = await itemsRes.json();
        if (apiItems.length > 0) {
          setOriginalItems(apiItems);
          setItems(apiItems);
          localStorage.setItem("menu_items", JSON.stringify(apiItems));
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

  function fallbackLoadItems() {
    try {
      const stored = localStorage.getItem("menu_items");
      if (stored) {
        const parsed = JSON.parse(stored);
        setOriginalItems(parsed); setItems(parsed);
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
    try {
      const res = await fetch("/api/menu-items", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(items) });
      if (res.ok) setOriginalItems([...items]);
    } catch {}
    setTimeout(() => setSaving(false), 400);
  };

  const handleLogout = () => { localStorage.removeItem("admin_auth"); router.push("/admin"); };
  const toggleAvailability = (id: string) => setItems((prev) => prev.map((i) => (i.id === id ? { ...i, is_available: !i.is_available } : i)));
  const deleteItem = (id: string) => { if (confirm("Delete this item?")) setItems((prev) => prev.filter((i) => i.id !== id)); };
  const openEditor = (item?: MenuItem) => { setEditing(item ? { ...item } : emptyItem()); setShowEditor(true); };
  const handleSave = () => {
    if (!editing) return;
    setSaving(true);
    setItems((prev) => { const ex = prev.find((i) => i.id === editing.id); return ex ? prev.map((i) => (i.id === editing.id ? (editing as MenuItem) : i)) : [...prev, editing as MenuItem]; });
    setTimeout(() => { setSaving(false); setShowEditor(false); setEditing(null); }, 300);
  };
  const updateField = (field: string, value: any) => { if (!editing) return; setEditing({ ...editing, [field]: value }); };
  const updateTranslatedField = (field: "name" | "description", lang: Language, value: string) => { if (!editing) return; setEditing({ ...editing, [field]: { ...editing[field], [lang]: value } } as EditableItem); };
  const updateArrayField = (field: "ingredients" | "allergens", lang: Language, value: string) => { if (!editing) return; setEditing({ ...editing, [field]: { ...editing[field], [lang]: value.split(",").map((s) => s.trim()).filter(Boolean) } } as EditableItem); };
  const filteredItems = filter === "all" ? items : items.filter((i) => i.category === filter);
  const filteredOrders = orderFilter === "all" ? orders : orders.filter((o) => o.status === orderFilter);

  const pendingOrderCount = orders.filter((o) => o.status === "pending").length;

  function parseOrderItems(raw: string): CartItemData[] {
    try { return JSON.parse(raw); } catch { return []; }
  }

  if (!auth) return null;

  return (
    <div className="luxury-bg">
      <header className="sticky top-0 z-40 bg-white border-b border-border-warm">
        <div className="flex items-center justify-between px-4 h-14">
          <button onClick={() => router.push("/")} className="w-10 h-10 flex items-center justify-center text-coffee-muted/50"><ChevronLeft size={20} /></button>
          <h1 className="text-base font-semibold text-coffee">Dashboard</h1>
          <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors"><LogOut size={15} /> Logout</button>
        </div>
      </header>

      <div className="max-w-[480px] mx-auto px-4 py-4">
        {/* Save Bar */}
        <div className={cn("sticky top-14 z-30 -mx-4 px-4 py-2.5 border-b transition-all duration-300 flex items-center gap-2", hasChanges ? "bg-amber-50 border-amber-200" : "bg-transparent border-transparent pointer-events-none opacity-0")}>
          <AlertTriangle size={14} className="text-amber-600 flex-shrink-0" />
          <span className="text-[11px] text-amber-800 flex-1">Unsaved changes</span>
          <button onClick={undoChanges} className="px-2.5 py-1 text-[10px] font-medium text-coffee-muted bg-white border border-border-warm rounded-lg hover:bg-cream-dark transition-colors">Undo</button>
          <button onClick={saveAll} disabled={saving} className="px-4 py-1.5 bg-gold text-white rounded-lg text-[11px] font-semibold hover:bg-coffee-muted transition-colors disabled:opacity-50 flex items-center gap-1.5">
            {saving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}{saving ? "Saving..." : "Save"}
          </button>
        </div>

        {/* Tab toggle */}
        <div className="flex gap-1 mb-4 bg-white rounded-2xl p-1 card-accent">
          {(["items", "reviews", "orders"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setMode(tab)}
              className={cn("flex-1 py-2 rounded-xl text-xs font-semibold transition-all relative", mode === tab ? "bg-gold text-white" : "text-coffee-muted/60")}
            >
              {tab === "items" && `Items (${items.length})`}
              {tab === "reviews" && `Reviews (${reviews.length})`}
              {tab === "orders" && (
                <span>
                  Orders ({orders.length})
                  {pendingOrderCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[8px] flex items-center justify-center font-bold">{pendingOrderCount}</span>
                  )}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ITEMS TAB */}
        {mode === "items" && (
          <>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[
                { label: "Total", value: items.length, color: "text-gold" },
                { label: "Available", value: items.filter((i) => i.is_available).length, color: "text-[#4CAF50]" },
                { label: "Hidden", value: items.filter((i) => !i.is_available).length, color: "text-[#C0392B]" },
                { label: "Best", value: items.filter((i) => i.is_best_seller).length, color: "text-gold" },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-xl p-2.5 card-accent text-center">
                  <p className={cn("text-lg font-bold", s.color)}>{s.value}</p>
                  <p className="text-[9px] text-coffee-muted/50">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-1 overflow-x-auto hide-scrollbar">
                {["all", ...CATEGORIES].map((c) => (
                  <button key={c} onClick={() => setFilter(c)} className={cn("px-3 py-1.5 rounded-full text-[10px] font-medium whitespace-nowrap transition-all", filter === c ? "bg-gold text-white" : "bg-white text-coffee-muted/60")}>
                    {c === "all" ? "All" : c}
                  </button>
                ))}
              </div>
              <button onClick={() => openEditor()} className="flex items-center gap-1 px-3 py-1.5 bg-gold text-white rounded-full text-[11px] font-semibold"><Plus size={14} /> Add</button>
            </div>
            <div className="space-y-2">
              {filteredItems.map((item) => (
                <div key={item.id} className={cn("bg-white rounded-2xl p-3 card-accent flex items-center gap-3", !item.is_available && "opacity-55")}>
                  <div className="w-12 h-12 rounded-xl bg-cream-dark flex-shrink-0 overflow-hidden"><img src={item.image} alt="" className="w-full h-full object-contain" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-bold text-coffee truncate">{item.name[language]}</h3>
                      {item.is_best_seller && <Star size={10} className="text-gold fill-gold" />}
                      {item.is_signature && <span className="text-[8px] text-coffee-muted font-bold">S</span>}
                      {item.is_new && <span className="text-[8px] text-[#4CAF50] font-bold">N</span>}
                      {item.is_spicy && <span className="text-[8px] text-[#C0392B] font-bold">!</span>}
                    </div>
                    <p className="text-[10px] text-coffee-muted/50">{item.price} ETB &middot; {item.category}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => toggleAvailability(item.id)} className={cn("w-7 h-7 flex items-center justify-center rounded-lg transition-colors", item.is_available ? "text-[#4CAF50] bg-green-50" : "text-coffee-muted/50 bg-cream-dark")}>
                      {item.is_available ? <Eye size={12} /> : <EyeOff size={12} />}
                    </button>
                    <button onClick={() => openEditor(item)} className="w-7 h-7 flex items-center justify-center text-coffee-muted/50 bg-cream-dark rounded-lg hover:text-gold transition-colors"><Edit3 size={12} /></button>
                    <button onClick={() => deleteItem(item.id)} className="w-7 h-7 flex items-center justify-center text-coffee-muted/50 bg-cream-dark rounded-lg hover:text-[#C0392B] transition-colors"><Trash2 size={12} /></button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* REVIEWS TAB */}
        {mode === "reviews" && (
          <div className="space-y-2">
            {reviews.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl card-accent">
                <MessageSquare size={32} className="mx-auto text-coffee-muted/30 mb-3" />
                <p className="text-sm text-coffee-muted/60">No reviews yet</p>
              </div>
            ) : (
              reviews.map((review) => {
                const item = items.find((i) => i.id === review.itemId);
                return (
                  <div key={review.id} className="bg-white rounded-2xl p-3.5 card-accent">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-xs font-bold text-coffee">{review.author}</p>
                        {item && <p className="text-[9px] text-gold">{item.name[language]}</p>}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] text-coffee-muted/50">{review.date}</span>
                        <button onClick={() => { if (confirm("Delete this review?")) { const upd = reviews.filter((r) => r.id !== review.id); setReviews(upd); localStorage.setItem("menu_reviews", JSON.stringify(upd)); fetch("/api/reviews", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: review.id }) }).catch(() => {}); } }} className="w-6 h-6 flex items-center justify-center text-coffee-muted/50 hover:text-[#C0392B] rounded-lg hover:bg-red-50 transition-colors"><Trash2 size={11} /></button>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 mb-1.5">
                      {[1,2,3,4,5].map((star) => (<Star key={star} size={10} className={star <= review.rating ? "text-gold" : "text-border-warm"} fill={star <= review.rating ? "#D4A35F" : "transparent"} />))}
                    </div>
                    <p className="text-[11px] text-coffee-muted/60 leading-relaxed">{review.comment}</p>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ORDERS TAB */}
        {mode === "orders" && (
          <>
            <div className="flex gap-1 mb-4 overflow-x-auto hide-scrollbar">
              {["all", "pending", "verified", "rejected"].map((s) => (
                <button key={s} onClick={() => setOrderFilter(s)} className={cn("px-3 py-1.5 rounded-full text-[10px] font-medium whitespace-nowrap transition-all capitalize", orderFilter === s ? "bg-gold text-white" : "bg-white text-coffee-muted/60")}>
                  {s}{s === "pending" && orders.filter((o) => o.status === "pending").length > 0 && ` (${orders.filter((o) => o.status === "pending").length})`}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              {filteredOrders.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl card-accent">
                  <ShoppingBag size={32} className="mx-auto text-coffee-muted/30 mb-3" />
                  <p className="text-sm text-coffee-muted/60">No orders found</p>
                </div>
              ) : (
                filteredOrders.map((order) => {
                  const orderItems = parseOrderItems(order.items);
                  const isExpanded = expandedOrder === order.id;
                  return (
                    <div key={order.id} className={cn("bg-white rounded-2xl card-accent overflow-hidden", order.status === "verified" && "ring-1 ring-green-300", order.status === "rejected" && "ring-1 ring-red-300")}>
                      <button onClick={() => setExpandedOrder(isExpanded ? null : order.id)} className="w-full text-left p-3.5 flex items-center gap-3">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", order.status === "pending" ? "bg-amber-50" : order.status === "verified" ? "bg-green-50" : "bg-red-50")}>
                          <ShoppingBag size={16} className={order.status === "pending" ? "text-amber-600" : order.status === "verified" ? "text-green-600" : "text-red-600"} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-coffee">{order.id}</span>
                            <span className={cn("text-[9px] px-2 py-0.5 rounded-full font-semibold capitalize", order.status === "pending" ? "bg-amber-100 text-amber-700" : order.status === "verified" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>{order.status}</span>
                          </div>
                          <p className="text-[10px] text-coffee-muted/50 mt-0.5">Table {order.tableNumber} &middot; {new Date(order.createdAt).toLocaleString()} &middot; {order.totalAmount.toLocaleString()} ETB</p>
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="px-3.5 pb-3.5 space-y-3 border-t border-border-warm/60 pt-3">
                          {/* Order items */}
                          <div>
                            <p className="text-[9px] text-coffee-muted/50 uppercase tracking-wider mb-1.5 font-semibold">Items</p>
                            {orderItems.map((oi: any) => (
                              <div key={oi.id} className="flex items-center justify-between py-1">
                                <span className="text-xs text-coffee">{oi.name?.en || oi.id} x{oi.quantity}</span>
                                <span className="text-xs text-coffee-muted font-medium">{(oi.price * oi.quantity).toLocaleString()} ETB</span>
                              </div>
                            ))}
                            <div className="border-t border-border-warm/40 mt-1 pt-1.5 flex items-center justify-between">
                              <span className="text-xs font-bold text-coffee">Total</span>
                              <span className="text-sm font-bold text-gold">{order.totalAmount.toLocaleString()} ETB</span>
                            </div>
                          </div>

                          {/* Customer info */}
                          <div>
                            <p className="text-[9px] text-coffee-muted/50 uppercase tracking-wider mb-1 font-semibold">Customer</p>
                            <p className="text-xs text-coffee-muted">Table: {order.tableNumber}</p>
                            {order.customerName && <p className="text-xs text-coffee-muted">Name: {order.customerName}</p>}
                            {order.phoneNumber && <p className="text-xs text-coffee-muted">Phone: {order.phoneNumber}</p>}
                            {order.specialNotes && <p className="text-xs text-coffee-muted">Notes: {order.specialNotes}</p>}
                            <p className="text-xs text-coffee-muted capitalize">Payment: {order.paymentMethod}</p>
                          </div>

                          {/* Screenshot */}
                          {order.paymentScreenshot && (
                            <div>
                              <p className="text-[9px] text-coffee-muted/50 uppercase tracking-wider mb-1 font-semibold">Payment Screenshot</p>
                              <button onClick={() => setShowScreenshot(order.paymentScreenshot)} className="w-full rounded-xl overflow-hidden border border-border-warm bg-cream-dark">
                                <img src={order.paymentScreenshot} alt="Payment screenshot" className="w-full h-40 object-contain" />
                              </button>
                            </div>
                          )}

                          {/* Actions */}
                          {order.status === "pending" && (
                            <div className="flex gap-2 pt-1">
                              <button onClick={() => updateOrderStatus(order.id, "verified")} className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-xs font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-1.5">
                                <Check size={14} /> Accept
                              </button>
                              <button onClick={() => updateOrderStatus(order.id, "rejected")} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-xs font-semibold hover:bg-red-600 transition-colors flex items-center justify-center gap-1.5">
                                <Ban size={14} /> Reject
                              </button>
                            </div>
                          )}
                          {order.status === "verified" && (
                            <div className="py-2 text-center">
                              <span className="text-xs font-semibold text-green-600 bg-green-50 px-4 py-1.5 rounded-full">Verified — Customer can show to waiter</span>
                            </div>
                          )}
                          {order.status === "rejected" && (
                            <div className="py-2 text-center">
                              <span className="text-xs font-semibold text-red-600 bg-red-50 px-4 py-1.5 rounded-full">Rejected</span>
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
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="max-w-full max-h-full">
              <img src={showScreenshot} alt="Payment screenshot" className="max-w-full max-h-[90vh] object-contain rounded-xl" />
              <button onClick={() => setShowScreenshot(null)} className="absolute top-4 right-4 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"><X size={20} /></button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editor Modal */}
      {showEditor && editing && (
        <div className="fixed inset-0 z-50 bg-coffee/40 backdrop-blur-sm overflow-y-auto" onClick={() => setShowEditor(false)}>
          <div className="min-h-full flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={(e) => e.stopPropagation()}>
            <div className="w-full max-w-[480px] bg-white rounded-t-3xl sm:rounded-3xl max-h-[90dvh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 z-10 bg-white pt-3 pb-2 px-5 border-b border-border-warm flex items-center justify-between">
                <h2 className="text-base font-bold text-coffee">{editing.id.startsWith("item_") ? "Add Item" : "Edit Item"}</h2>
                <button onClick={() => setShowEditor(false)} className="w-8 h-8 flex items-center justify-center text-coffee-muted/50 bg-cream-dark rounded-full"><X size={18} /></button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-[10px] font-medium text-coffee-muted/50 uppercase tracking-wider block mb-1">Category</label>
                  <select value={editing.category} onChange={(e) => updateField("category", e.target.value)} className="w-full px-3 py-2.5 bg-cream-dark rounded-xl text-sm text-coffee focus:outline-none focus:ring-2 focus:ring-gold/50">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                {(["en", "am", "or"] as Language[]).map((lang) => (
                  <React.Fragment key={lang}>
                    <div>
                      <label className="text-[10px] font-medium text-coffee-muted/50 uppercase tracking-wider block mb-1">Name ({lang})</label>
                      <input type="text" value={(editing.name as any)[lang] || ""} onChange={(e) => updateTranslatedField("name", lang, e.target.value)} className="w-full px-3 py-2.5 bg-cream-dark rounded-xl text-sm text-coffee focus:outline-none focus:ring-2 focus:ring-gold/50" placeholder={`Item name in ${lang}`} />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-coffee-muted/50 uppercase tracking-wider block mb-1">Description ({lang})</label>
                      <textarea value={(editing.description as any)[lang] || ""} onChange={(e) => updateTranslatedField("description", lang, e.target.value)} className="w-full px-3 py-2.5 bg-cream-dark rounded-xl text-sm text-coffee focus:outline-none focus:ring-2 focus:ring-gold/50 resize-none h-16" placeholder={`Description in ${lang}`} />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-coffee-muted/50 uppercase tracking-wider block mb-1">Ingredients ({lang})</label>
                      <input type="text" value={((editing.ingredients as any)[lang] || []).join(", ")} onChange={(e) => updateArrayField("ingredients", lang, e.target.value)} className="w-full px-3 py-2.5 bg-cream-dark rounded-xl text-sm text-coffee focus:outline-none focus:ring-2 focus:ring-gold/50" placeholder="Comma separated" />
                    </div>
                  </React.Fragment>
                ))}
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="text-[10px] font-medium text-coffee-muted/50 uppercase tracking-wider block mb-1">Price</label><input type="number" value={editing.price} onChange={(e) => updateField("price", Number(e.target.value))} className="w-full px-3 py-2.5 bg-cream-dark rounded-xl text-sm text-coffee focus:outline-none focus:ring-2 focus:ring-gold/50" /></div>
                  <div><label className="text-[10px] font-medium text-coffee-muted/50 uppercase tracking-wider block mb-1">Calories</label><input type="number" value={editing.calories} onChange={(e) => updateField("calories", Number(e.target.value))} className="w-full px-3 py-2.5 bg-cream-dark rounded-xl text-sm text-coffee focus:outline-none focus:ring-2 focus:ring-gold/50" /></div>
                  <div><label className="text-[10px] font-medium text-coffee-muted/50 uppercase tracking-wider block mb-1">Prep (min)</label><input type="text" value={editing.prep_time} onChange={(e) => updateField("prep_time", e.target.value)} className="w-full px-3 py-2.5 bg-cream-dark rounded-xl text-sm text-coffee focus:outline-none focus:ring-2 focus:ring-gold/50" /></div>
                </div>
                <div><label className="text-[10px] font-medium text-coffee-muted/50 uppercase tracking-wider block mb-1">Image URL</label><input type="text" value={editing.image || ""} onChange={(e) => updateField("image", e.target.value)} className="w-full px-3 py-2.5 bg-cream-dark rounded-xl text-sm text-coffee focus:outline-none focus:ring-2 focus:ring-gold/50" placeholder="https://..." /></div>
                <div>
                  <label className="text-[10px] font-medium text-coffee-muted/50 uppercase tracking-wider block mb-2">Badges</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: "is_best_seller", label: "Best Seller", color: "bg-gold" },
                      { key: "is_signature", label: "Signature", color: "bg-coffee-muted" },
                      { key: "is_new", label: "New", color: "bg-warm-brown" },
                      { key: "is_spicy", label: "Spicy", color: "bg-[#C0392B]" },
                      { key: "is_available", label: "Available", color: "bg-[#4CAF50]" },
                      { key: "isFasting", label: "Fasting", color: "bg-[#6B8E23]" },
                    ].map((b) => (
                      <button key={b.key} onClick={() => updateField(b.key, !(editing as any)[b.key])} className={cn("px-3 py-1.5 rounded-full text-[10px] font-bold transition-all", (editing as any)[b.key] ? `${b.color} text-white` : "bg-cream-dark text-coffee-muted/50")}>
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>
                {(["en", "am", "or"] as Language[]).map((lang) => (
                  <div key={`allergens-${lang}`}>
                    <label className="text-[10px] font-medium text-coffee-muted/50 uppercase tracking-wider block mb-1">Allergens ({lang})</label>
                    <input type="text" value={((editing.allergens as any)[lang] || []).join(", ")} onChange={(e) => updateArrayField("allergens", lang, e.target.value)} className="w-full px-3 py-2.5 bg-cream-dark rounded-xl text-sm text-coffee focus:outline-none focus:ring-2 focus:ring-gold/50" placeholder="Comma separated" />
                  </div>
                ))}
              </div>
              <div className="sticky bottom-0 bg-white border-t border-border-warm p-4">
                <button onClick={handleSave} disabled={saving} className="w-full py-3 bg-gold text-white rounded-xl font-semibold text-sm hover:bg-coffee-muted transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}{saving ? "Saving..." : "Save Item"}
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
