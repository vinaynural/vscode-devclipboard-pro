import Fuse from 'fuse.js';
import { ClipboardEntry, SearchFilters } from '../models/ClipboardEntry';

export class SearchService {
  private fuse: Fuse<ClipboardEntry> | null = null;

  public index(entries: ClipboardEntry[]): void {
    const options = {
      keys: [
        { name: 'content', weight: 0.7 },
        { name: 'language', weight: 0.2 },
        { name: 'tags', weight: 0.1 }
      ],
      threshold: 0.4,
      ignoreLocation: true,
      useExtendedSearch: true
    };
    this.fuse = new Fuse(entries, options);
  }

  public search(query: string, filters?: SearchFilters): ClipboardEntry[] {
    if (!this.fuse) return [];

    let results = query ? this.fuse.search(query).map(r => r.item) : this.fuse.getIndex().docs;

    if (filters) {
      results = results.filter(entry => {
        if (filters.source && filters.source.length > 0 && !filters.source.includes(entry.source)) return false;
        if (filters.language && filters.language.length > 0 && !filters.language.includes(entry.language)) return false;
        if (filters.pinned !== undefined && entry.pinned !== filters.pinned) return false;
        if (filters.tags && filters.tags.length > 0 && !filters.tags.some(t => entry.tags.includes(t))) return false;
        if (filters.dateRange) {
          if (entry.timestamp < filters.dateRange.start || entry.timestamp > filters.dateRange.end) return false;
        }
        return true;
      });
    }

    return results;
  }
}
