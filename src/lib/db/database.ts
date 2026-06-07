import fs from "fs";
import path from "path";
import initSqlJs, { Database as SqlJsDatabase } from "sql.js";
import { menuItems as defaultMenuItems, MenuItem } from "@/data/menuData";

const DB_PATH = path.join(process.cwd(), "data", "database.sqlite");

let sqlModule: Awaited<ReturnType<typeof initSqlJs>> | null = null;
let dbInstance: SqlJsDatabase | null = null;

export async function getDb(): Promise<SqlJsDatabase> {
  if (dbInstance) return dbInstance;

  sqlModule = await initSqlJs({
    locateFile: (file: string) => path.join(process.cwd(), "node_modules/sql.js/dist/", file),
  });

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    dbInstance = new sqlModule.Database(buffer);
  } else {
    dbInstance = new sqlModule.Database();
    createTables(dbInstance);
    seedData(dbInstance);
    saveDb();
  }

  return dbInstance;
}

export function saveDb() {
  if (!dbInstance) return;
  const data = dbInstance.export();
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function createTables(db: SqlJsDatabase) {
  db.run(`
    CREATE TABLE IF NOT EXISTS menu_items (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      subcategory TEXT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      ingredients TEXT NOT NULL,
      price REAL NOT NULL,
      calories INTEGER NOT NULL,
      prep_time TEXT NOT NULL,
      image TEXT NOT NULL,
      rating REAL NOT NULL,
      is_best_seller INTEGER NOT NULL DEFAULT 0,
      is_signature INTEGER NOT NULL DEFAULT 0,
      is_new INTEGER NOT NULL DEFAULT 0,
      is_spicy INTEGER NOT NULL DEFAULT 0,
      is_available INTEGER NOT NULL DEFAULT 1,
      allergens TEXT NOT NULL,
      isFasting INTEGER DEFAULT 0
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      itemId TEXT NOT NULL,
      author TEXT NOT NULL,
      rating INTEGER NOT NULL,
      comment TEXT NOT NULL,
      date TEXT NOT NULL
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      tableNumber TEXT NOT NULL,
      customerName TEXT DEFAULT '',
      phoneNumber TEXT DEFAULT '',
      specialNotes TEXT DEFAULT '',
      items TEXT NOT NULL,
      totalAmount REAL NOT NULL,
      paymentMethod TEXT NOT NULL,
      paymentScreenshot TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending',
      createdAt TEXT NOT NULL
    )
  `);
}

function seedData(db: SqlJsDatabase) {
  const insert = db.prepare(`
    INSERT INTO menu_items (id, category, subcategory, name, description, ingredients, price, calories, prep_time, image, rating, is_best_seller, is_signature, is_new, is_spicy, is_available, allergens, isFasting)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const item of defaultMenuItems) {
    insert.run([
      item.id,
      item.category,
      item.subcategory || null,
      JSON.stringify(item.name),
      JSON.stringify(item.description),
      JSON.stringify(item.ingredients),
      item.price,
      item.calories,
      item.prep_time,
      item.image,
      item.rating,
      item.is_best_seller ? 1 : 0,
      item.is_signature ? 1 : 0,
      item.is_new ? 1 : 0,
      item.is_spicy ? 1 : 0,
      item.is_available ? 1 : 0,
      JSON.stringify(item.allergens),
      item.isFasting ? 1 : 0,
    ]);
  }
  insert.free();
}

function rowToMenuItem(row: any): MenuItem {
  return {
    id: row.id,
    category: row.category,
    subcategory: row.subcategory || undefined,
    name: JSON.parse(row.name),
    description: JSON.parse(row.description),
    ingredients: JSON.parse(row.ingredients),
    price: row.price,
    calories: row.calories,
    prep_time: row.prep_time,
    image: row.image,
    rating: row.rating,
    is_best_seller: row.is_best_seller === 1,
    is_signature: row.is_signature === 1,
    is_new: row.is_new === 1,
    is_spicy: row.is_spicy === 1,
    is_available: row.is_available === 1,
    allergens: JSON.parse(row.allergens),
    isFasting: row.isFasting === 1,
  };
}

export async function getAllMenuItems(): Promise<MenuItem[]> {
  const db = await getDb();
  const result = db.exec("SELECT * FROM menu_items ORDER BY id");
  if (result.length === 0) return [];
  const cols = result[0].columns;
  return result[0].values.map((row) => {
    const obj: any = {};
    cols.forEach((col, i) => { obj[col] = row[i]; });
    return rowToMenuItem(obj);
  });
}

export async function replaceAllMenuItems(items: MenuItem[]) {
  const db = await getDb();
  db.run("DELETE FROM menu_items");
  const insert = db.prepare(`
    INSERT INTO menu_items (id, category, subcategory, name, description, ingredients, price, calories, prep_time, image, rating, is_best_seller, is_signature, is_new, is_spicy, is_available, allergens, isFasting)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const item of items) {
    insert.run([
      item.id,
      item.category,
      item.subcategory || null,
      JSON.stringify(item.name),
      JSON.stringify(item.description),
      JSON.stringify(item.ingredients),
      item.price,
      item.calories,
      item.prep_time,
      item.image,
      item.rating,
      item.is_best_seller ? 1 : 0,
      item.is_signature ? 1 : 0,
      item.is_new ? 1 : 0,
      item.is_spicy ? 1 : 0,
      item.is_available ? 1 : 0,
      JSON.stringify(item.allergens),
      item.isFasting ? 1 : 0,
    ]);
  }
  insert.free();
  saveDb();
}

export interface Review {
  id: string;
  itemId: string;
  author: string;
  rating: number;
  comment: string;
  date: string;
}

export async function getAllReviews(): Promise<Review[]> {
  const db = await getDb();
  const result = db.exec("SELECT * FROM reviews ORDER BY date DESC");
  if (result.length === 0) return [];
  const cols = result[0].columns;
  return result[0].values.map((row) => {
    const obj: any = {};
    cols.forEach((col, i) => { obj[col] = row[i]; });
    return obj as Review;
  });
}

export async function addReview(review: Review) {
  const db = await getDb();
  db.run("INSERT INTO reviews (id, itemId, author, rating, comment, date) VALUES (?, ?, ?, ?, ?, ?)", [
    review.id, review.itemId, review.author, review.rating, review.comment, review.date,
  ]);
  saveDb();
}

export async function deleteReview(id: string) {
  const db = await getDb();
  db.run("DELETE FROM reviews WHERE id = ?", [id]);
  saveDb();
}

export interface Order {
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

export async function createOrder(order: Order) {
  const db = await getDb();
  db.run(
    "INSERT INTO orders (id, tableNumber, customerName, phoneNumber, specialNotes, items, totalAmount, paymentMethod, paymentScreenshot, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [order.id, order.tableNumber, order.customerName, order.phoneNumber, order.specialNotes, order.items, order.totalAmount, order.paymentMethod, order.paymentScreenshot, order.status, order.createdAt]
  );
  saveDb();
}

export async function getNextOrderNumber(): Promise<number> {
  const db = await getDb();
  const result = db.exec("SELECT COUNT(*) as cnt FROM orders");
  if (result.length === 0) return 1;
  return (result[0].values[0][0] as number) + 1;
}

export async function getAllOrders(): Promise<Order[]> {
  const db = await getDb();
  const result = db.exec("SELECT * FROM orders ORDER BY createdAt DESC");
  if (result.length === 0) return [];
  const cols = result[0].columns;
  return result[0].values.map((row) => {
    const obj: any = {};
    cols.forEach((col, i) => { obj[col] = row[i]; });
    return obj as Order;
  });
}

export async function getOrderById(id: string): Promise<Order | null> {
  const db = await getDb();
  const result = db.exec("SELECT * FROM orders WHERE id = ?", [id]);
  if (result.length === 0 || result[0].values.length === 0) return null;
  const cols = result[0].columns;
  const obj: any = {};
  cols.forEach((col, i) => { obj[col] = result[0].values[0][i]; });
  return obj as Order;
}

export async function updateOrderStatus(id: string, status: string) {
  const db = await getDb();
  db.run("UPDATE orders SET status = ? WHERE id = ?", [status, id]);
  saveDb();
}
