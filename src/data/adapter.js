// dataAdapter — the single seam between the UI and where data lives.
// Today: localStorage. Later: swap `activeAdapter` to supabaseAdapter with the
// SAME method signatures and NOTHING in the UI changes.
import { SEED_VERSION, seedProjects, seedTechnicians, seedCandidates } from './seed';

const KEY = 'genda-ops::v1';

function freshSeed() {
  return {
    version: SEED_VERSION,
    projects: structuredClone(seedProjects),
    technicians: structuredClone(seedTechnicians),
    candidates: structuredClone(seedCandidates),
  };
}

export const localStorageAdapter = {
  name: 'localStorage',
  load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) { const s = freshSeed(); localStorage.setItem(KEY, JSON.stringify(s)); return s; }
      const parsed = JSON.parse(raw);
      if (parsed.version !== SEED_VERSION) { const s = freshSeed(); localStorage.setItem(KEY, JSON.stringify(s)); return s; }
      return parsed;
    } catch {
      return freshSeed();
    }
  },
  save(state) {
    localStorage.setItem(KEY, JSON.stringify({ version: SEED_VERSION, ...state }));
  },
  reset() {
    const s = freshSeed();
    localStorage.setItem(KEY, JSON.stringify(s));
    return s;
  },
};

// Supabase drop-in stub — same interface. Wire this up (and set the env keys)
// to move off localStorage with zero UI changes.
export const supabaseAdapter = {
  name: 'supabase',
  async load() { throw new Error('supabaseAdapter not configured — using localStorage.'); },
  async save() { throw new Error('supabaseAdapter not configured.'); },
  async reset() { throw new Error('supabaseAdapter not configured.'); },
};

export const activeAdapter = localStorageAdapter;
