import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

export const PORTFOLIO_STATUSES = [
  "estimation",
  "rdv",
  "mandat_simple",
  "mandat_exclusif",
  "offre",
  "vendu",
  "perdu",
] as const;

export type PortfolioStatus = (typeof PORTFOLIO_STATUSES)[number];

export interface PortfolioItem {
  id: string;
  agencyId: string;
  createdAt: string;
  updatedAt: string;
  adresse: string;
  prixEstime: number;
  confiance: number;
  status: PortfolioStatus;
}

interface PortfolioStore {
  items: PortfolioItem[];
}

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "portfolio.json");

async function ensureStore(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify({ items: [] } satisfies PortfolioStore, null, 2));
  }
}

async function readStore(): Promise<PortfolioStore> {
  await ensureStore();
  const raw = await fs.readFile(DATA_FILE, "utf-8");
  const parsed = JSON.parse(raw) as PortfolioStore;
  return {
    items: Array.isArray(parsed.items) ? parsed.items : [],
  };
}

async function writeStore(store: PortfolioStore): Promise<void> {
  await ensureStore();
  await fs.writeFile(DATA_FILE, JSON.stringify(store, null, 2));
}

export async function listPortfolio(agencyId: string): Promise<PortfolioItem[]> {
  const store = await readStore();
  return store.items
    .filter((item) => item.agencyId === agencyId)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export async function createPortfolioItem(
  agencyId: string,
  payload: Pick<PortfolioItem, "adresse" | "prixEstime" | "confiance"> & { status?: PortfolioStatus }
): Promise<PortfolioItem> {
  const store = await readStore();
  const now = new Date().toISOString();

  const item: PortfolioItem = {
    id: randomUUID(),
    agencyId,
    createdAt: now,
    updatedAt: now,
    adresse: payload.adresse,
    prixEstime: payload.prixEstime,
    confiance: payload.confiance,
    status: payload.status ?? "estimation",
  };

  store.items.push(item);
  await writeStore(store);

  return item;
}

export async function updatePortfolioStatus(
  agencyId: string,
  id: string,
  status: PortfolioStatus
): Promise<PortfolioItem | null> {
  const store = await readStore();
  const index = store.items.findIndex((item) => item.agencyId === agencyId && item.id === id);

  if (index < 0) return null;

  const updated: PortfolioItem = {
    ...store.items[index],
    status,
    updatedAt: new Date().toISOString(),
  };

  store.items[index] = updated;
  await writeStore(store);

  return updated;
}
