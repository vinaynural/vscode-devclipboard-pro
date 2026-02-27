import { create } from 'zustand';
import { ClipboardEntry, SearchFilters } from '../../../src/models/ClipboardEntry';

interface ClipboardState {
  entries: ClipboardEntry[];
  filteredEntries: ClipboardEntry[];
  searchQuery: string;
  filters: SearchFilters;
  setEntries: (entries: ClipboardEntry[]) => void;
  addEntry: (entry: ClipboardEntry) => void;
  deleteEntry: (id: string) => void;
  updateEntry: (entry: ClipboardEntry) => void;
  setSearchQuery: (query: string) => void;
  setFilters: (filters: SearchFilters) => void;
}

const matchesFilters = (entry: ClipboardEntry, filters: SearchFilters): boolean => {
  if (filters.source?.length && !filters.source.includes(entry.source)) {
    return false;
  }

  if (filters.language?.length && !filters.language.includes(entry.language)) {
    return false;
  }

  if (typeof filters.pinned === 'boolean' && entry.pinned !== filters.pinned) {
    return false;
  }

  if (filters.tags?.length && !filters.tags.some((tag) => entry.tags.includes(tag))) {
    return false;
  }

  if (filters.dateRange) {
    if (entry.timestamp < filters.dateRange.start || entry.timestamp > filters.dateRange.end) {
      return false;
    }
  }

  return true;
};

const applySearchAndFilters = (
  entries: ClipboardEntry[],
  searchQuery: string,
  filters: SearchFilters
): ClipboardEntry[] => {
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const hasQuery = normalizedQuery.length > 0;

  return entries.filter((entry) => {
    if (!matchesFilters(entry, filters)) {
      return false;
    }

    if (!hasQuery) {
      return true;
    }

    const haystacks = [entry.content, entry.language, entry.source, ...entry.tags]
      .filter(Boolean)
      .map((value) => value.toLowerCase());

    return haystacks.some((value) => value.includes(normalizedQuery));
  });
};

export const useClipboardStore = create<ClipboardState>((set) => ({
  entries: [],
  filteredEntries: [],
  searchQuery: '',
  filters: {},
  setEntries: (entries) =>
    set((state) => ({
      entries,
      filteredEntries: applySearchAndFilters(entries, state.searchQuery, state.filters),
    })),
  addEntry: (entry) => set((state) => {
    const newEntries = [entry, ...state.entries];
    return {
      entries: newEntries,
      filteredEntries: applySearchAndFilters(newEntries, state.searchQuery, state.filters),
    };
  }),
  deleteEntry: (id) => set((state) => {
    const newEntries = state.entries.filter((e) => e.id !== id);
    return {
      entries: newEntries,
      filteredEntries: applySearchAndFilters(newEntries, state.searchQuery, state.filters),
    };
  }),
  updateEntry: (entry) => set((state) => {
    const newEntries = state.entries.map((e) => (e.id === entry.id ? entry : e));
    return {
      entries: newEntries,
      filteredEntries: applySearchAndFilters(newEntries, state.searchQuery, state.filters),
    };
  }),
  setSearchQuery: (searchQuery) =>
    set((state) => ({
      searchQuery,
      filteredEntries: applySearchAndFilters(state.entries, searchQuery, state.filters),
    })),
  setFilters: (filters) =>
    set((state) => ({
      filters,
      filteredEntries: applySearchAndFilters(state.entries, state.searchQuery, filters),
    })),
}));
