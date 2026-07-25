import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";

const DATA_DIR = join(process.env.HOME || process.env.USERPROFILE || ".", "harvest-hero-data");
const DB_FILE = join(DATA_DIR, "db.json");

interface Collections {
  users: any[];
  farms: any[];
  harvests: any[];
  rewards: any[];
  redemptions: any[];
  learning_progress: any[];
}

let db: Collections = { users: [], farms: [], rewards: [], harvests: [], redemptions: [], learning_progress: [] };

export function loadDB(): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (existsSync(DB_FILE)) {
    try {
      db = JSON.parse(readFileSync(DB_FILE, "utf-8"));
    } catch {
      db = { users: [], farms: [], rewards: [], harvests: [], redemptions: [], learning_progress: [] };
    }
  }
}

function saveDB(): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function genId(): string {
  return randomUUID();
}

function matchFilter(doc: any, filter: any): boolean {
  if (!filter || Object.keys(filter).length === 0) return true;
  for (const [key, value] of Object.entries(filter)) {
    if (key === "$and") {
      if (!(value as any[]).every((f) => matchFilter(doc, f))) return false;
      continue;
    }
    if (key === "$or") {
      if (!(value as any[]).some((f) => matchFilter(doc, f))) return false;
      continue;
    }
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      if ("$in" in value) {
        if (!(value.$in as any[]).includes(doc[key])) return false;
        continue;
      }
      if ("$gte" in value) {
        if (doc[key] === undefined || doc[key] < (value as any).$gte) return false;
        continue;
      }
      if ("$lte" in value) {
        if (doc[key] === undefined || doc[key] > (value as any).$lte) return false;
        continue;
      }
      if ("$exists" in value) {
        if (value.$exists ? doc[key] === undefined : doc[key] !== undefined) return false;
        continue;
      }
    }
    if (doc[key] !== value) return false;
  }
  return true;
}

function populateRow(row: any, populates: PopulateConfig[]): any {
  for (const pop of populates) {
    const refId = row[pop.field];
    if (!refId) continue;
    for (const collName of Object.keys(db) as (keyof Collections)[]) {
      const refDoc = db[collName].find((d: any) => String(d._id) === String(refId));
      if (refDoc) {
        if (pop.select.length > 0) {
          const picked: any = { _id: refDoc._id };
          for (const f of pop.select) picked[f] = refDoc[f];
          row[pop.field] = picked;
        } else {
          const { pin, ...safe } = refDoc;
          row[pop.field] = safe;
        }
        break;
      }
    }
  }
  return row;
}

function applySelect(row: any, selectStr: string): any {
  if (!selectStr || selectStr.trim() === "") return row;
  if (selectStr.startsWith("-")) {
    const exclude = selectStr.split(" ").map((s) => s.trim()).filter(Boolean);
    const result: any = {};
    for (const k of Object.keys(row)) {
      if (!exclude.includes(k)) result[k] = row[k];
    }
    return result;
  }
  const include = selectStr.split(" ").map((s) => s.trim()).filter(Boolean);
  const result: any = {};
  for (const f of include) result[f] = row[f];
  result._id = row._id;
  return result;
}

interface PopulateConfig {
  field: string;
  select: string[];
}

class SingleQuery {
  private doc: any;
  private populates: PopulateConfig[] = [];
  private selectStr = "";

  constructor(doc: any) {
    this.doc = doc;
  }

  populate(field: string, selectStr?: string): this {
    const select = selectStr ? selectStr.split(" ").map((s) => s.trim()).filter(Boolean) : [];
    this.populates.push({ field, select });
    return this;
  }

  select(fields: string): this {
    this.selectStr = fields;
    return this;
  }

  async then(resolve: (val: any) => void, reject?: (err: any) => void): Promise<void> {
    try {
      let result = this.doc ? { ...this.doc } : null;
      if (result) {
        populateRow(result, this.populates);
        result = applySelect(result, this.selectStr);
      }
      resolve(result);
    } catch (e) {
      if (reject) reject(e);
    }
  }
}

class QueryBuilder<T = any> {
  private rows: T[];
  private populates: PopulateConfig[] = [];
  private selectStr = "";

  constructor(rows: T[]) {
    this.rows = rows;
  }

  sort(spec: Record<string, 1 | -1>): this {
    const key = Object.keys(spec)[0];
    const dir = spec[key];
    this.rows.sort((a: any, b: any) => {
      const aVal = a[key], bVal = b[key];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      return dir === 1 ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });
    return this;
  }

  skip(n: number): this {
    this.rows = this.rows.slice(n);
    return this;
  }

  limit(n: number): this {
    this.rows = this.rows.slice(0, n);
    return this;
  }

  populate(field: string, selectStr?: string): this {
    const select = selectStr ? selectStr.split(" ").map((s) => s.trim()).filter(Boolean) : [];
    this.populates.push({ field, select });
    return this;
  }

  select(fields: string): this {
    this.selectStr = fields;
    return this;
  }

  async then(resolve: (result: T[]) => void): Promise<void> {
    let rows = this.rows.map((r) => ({ ...r }));
    for (const row of rows) populateRow(row, this.populates);
    if (this.selectStr) rows = rows.map((r) => applySelect(r, this.selectStr));
    resolve(rows);
  }
}

function getCollection(name: keyof Collections): any[] {
  return (db as any)[name];
}

export function createCollectionModel(name: keyof Collections) {
  const collection = getCollection(name);

  const model: any = {
    _name: name,

    async findOne(filter: Record<string, any> = {}): Promise<any> {
      const doc = collection.find((d: any) => matchFilter(d, filter));
      return new SingleQuery(doc || null);
    },

    find(filter: Record<string, any> = {}): any {
      const rows = collection.filter((d: any) => matchFilter(d, filter));
      return new QueryBuilder([...rows]);
    },

    async create(data: any | any[]): Promise<any> {
      const items = Array.isArray(data) ? data : [data];
      const created = [];
      for (const item of items) {
        const doc = {
          _id: genId(),
          ...item,
          createdAt: item.createdAt || new Date(),
          updatedAt: item.updatedAt || new Date(),
        };
        collection.push(doc);
        created.push(doc);
      }
      saveDB();
      return created.length === 1 ? created[0] : created;
    },

    findById(id: string): any {
      const doc = collection.find((d: any) => d._id === id);
      if (!doc) return new SingleQuery(null);
      const docObj = { ...doc };
      docObj.save = async () => {
        const idx = collection.findIndex((d: any) => d._id === id);
        if (idx !== -1) {
          docObj.updatedAt = new Date();
          collection[idx] = { ...docObj };
          saveDB();
        }
      };
      return new SingleQuery(docObj);
    },

    findByIdAndUpdate(id: string, updates: any, opts?: { new?: boolean }): any {
      const idx = collection.findIndex((d: any) => d._id === id);
      if (idx === -1) return new SingleQuery(null);
      Object.assign(collection[idx], updates, { updatedAt: new Date() });
      saveDB();
      return new SingleQuery(opts?.new ? collection[idx] : collection[idx]);
    },

    async countDocuments(filter: Record<string, any> = {}): Promise<number> {
      return collection.filter((d: any) => matchFilter(d, filter)).length;
    },

    async deleteMany(filter: Record<string, any> = {}): Promise<any> {
      const before = collection.length;
      const remaining = collection.filter((d: any) => !matchFilter(d, filter));
      (db as any)[name] = remaining;
      // Update reference
      collection.length = 0;
      collection.push(...remaining);
      saveDB();
      return { deletedCount: before - remaining.length };
    },
  };

  return model;
}
