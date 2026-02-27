import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { ClipboardEntry, ClipboardEntrySchema } from '../models/ClipboardEntry';

interface PersistedStore {
  entries: ClipboardEntry[];
}

export class DatabaseService {
  private readonly dbPath: string;
  private readonly entries = new Map<string, ClipboardEntry>();

  constructor(storageUri: vscode.Uri) {
    if (!fs.existsSync(storageUri.fsPath)) {
      fs.mkdirSync(storageUri.fsPath, { recursive: true });
    }

    this.dbPath = path.join(storageUri.fsPath, 'clipboard-store.json');
    this.loadFromDisk();
  }

  public insertEntry(entry: ClipboardEntry): void {
    this.entries.set(entry.id, { ...entry });
    this.persistToDisk();
  }

  public getAllEntries(): ClipboardEntry[] {
    return [...this.entries.values()].sort((a, b) => b.timestamp - a.timestamp);
  }

  public deleteEntry(id: string): void {
    if (this.entries.delete(id)) {
      this.persistToDisk();
    }
  }

  public updatePinned(id: string, pinned: boolean): void {
    const existing = this.entries.get(id);
    if (!existing) return;

    this.entries.set(id, { ...existing, pinned });
    this.persistToDisk();
  }

  public updateTags(id: string, tags: string[]): void {
    const existing = this.entries.get(id);
    if (!existing) return;

    this.entries.set(id, { ...existing, tags: [...tags] });
    this.persistToDisk();
  }

  public clearHistory(): void {
    let changed = false;
    for (const [id, entry] of this.entries.entries()) {
      if (!entry.pinned) {
        this.entries.delete(id);
        changed = true;
      }
    }

    if (changed) {
      this.persistToDisk();
    }
  }

  public deleteExpiredEntries(now: number): number {
    let changes = 0;
    for (const [id, entry] of this.entries.entries()) {
      if (typeof entry.expiresAt === 'number' && entry.expiresAt < now) {
        this.entries.delete(id);
        changes++;
      }
    }

    if (changes > 0) {
      this.persistToDisk();
    }

    return changes;
  }

  public dispose() {
    this.persistToDisk();
  }

  private loadFromDisk() {
    if (!fs.existsSync(this.dbPath)) {
      return;
    }

    try {
      const raw = fs.readFileSync(this.dbPath, 'utf8');
      if (raw.trim() === '') return;

      const parsed = JSON.parse(raw) as PersistedStore;
      const list = Array.isArray(parsed?.entries) ? parsed.entries : [];

      for (const candidate of list) {
        const result = ClipboardEntrySchema.safeParse(candidate);
        if (result.success) {
          this.entries.set(result.data.id, result.data);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      vscode.window.showWarningMessage(
        `DevClipboard could not load persisted clipboard history. Starting with empty store. ${message}`
      );
    }
  }

  private persistToDisk() {
    const payload: PersistedStore = {
      entries: this.getAllEntries(),
    };

    const tempPath = `${this.dbPath}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(payload), 'utf8');
    fs.renameSync(tempPath, this.dbPath);
  }
}
