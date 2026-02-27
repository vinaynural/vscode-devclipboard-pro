import * as vscode from 'vscode';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { ClipboardEntry, ClipboardSource } from '../models/ClipboardEntry';
import { DatabaseService } from './DatabaseService';
import { ClassifierService } from './ClassifierService';
import { EncryptionService } from './EncryptionService';
import { Logger } from '../utils/logger';

export class ClipboardService {
  private lastCapturedHash: string | null = null;
  private pollInterval: NodeJS.Timeout | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private _onDidCapture = new vscode.EventEmitter<ClipboardEntry>();
  public readonly onDidCapture = this._onDidCapture.event;

  constructor(
    private context: vscode.ExtensionContext,
    private db: DatabaseService,
    private classifier: ClassifierService,
    private encryption: EncryptionService
  ) {
    this.init();
  }

  private init() {
    this.startPolling();
    this.startCleanupTask();
    this.overrideCopyCommand();
  }

  private startPolling() {
    const interval = vscode.workspace.getConfiguration('devClipboard').get<number>('pollingIntervalMs', 800);
    this.pollInterval = setInterval(async () => {
      await this.captureFromSystem();
    }, interval);
  }

  private startCleanupTask() {
    // Initial cleanup
    this.cleanup();
    // Every 10 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 10 * 60 * 1000);
  }

  private async cleanup() {
    try {
      const deletedCount = this.db.deleteExpiredEntries(Date.now());
      if (deletedCount > 0) {
        Logger.info(`Cleaned up ${deletedCount} expired entries.`);
      }
    } catch (err) {
      Logger.error('Auto-cleanup failed', err);
    }
  }

  private overrideCopyCommand() {
    // Note: Overriding internal commands should be done carefully.
    // We register a command that wraps the original copy.
    const disposable = vscode.commands.registerCommand('editor.action.clipboardCopyAction', async () => {
      await vscode.commands.executeCommand('default:editor.action.clipboardCopyAction');
      await this.captureFromSystem('editor');
    });
    this.context.subscriptions.push(disposable);
  }

  private async captureFromSystem(preferredSource?: ClipboardSource) {
    try {
      const text = await vscode.env.clipboard.readText();
      if (!text || text.trim() === '') return;

      const hash = crypto.createHash('sha256').update(text).digest('hex');
      if (hash === this.lastCapturedHash) return;

      this.lastCapturedHash = hash;
      await this.processAndInsert(text, hash, preferredSource);
    } catch (err) {
      Logger.error('Failed to capture from clipboard', err);
    }
  }

  private async processAndInsert(content: string, hash: string, preferredSource?: ClipboardSource) {
    const config = vscode.workspace.getConfiguration('devClipboard');
    const source = preferredSource || this.detectSource();
    
    let language = 'plaintext';
    if (config.get('enableClassification')) {
      language = this.classifier.classify(content).language;
    }

    const editor = vscode.window.activeTextEditor;
    const entry: ClipboardEntry = {
      id: uuidv4(),
      content: content,
      contentHash: hash,
      timestamp: Date.now(),
      source: source,
      filePath: editor?.document.uri.fsPath,
      workspaceName: vscode.workspace.name,
      language: language,
      tags: [],
      pinned: false,
      encrypted: config.get('enableEncryption', false),
    };

    if (entry.encrypted) {
      const originalContent = entry.content;
      entry.content = await this.encryption.encrypt(originalContent);
    }

    const autoDeleteDays = config.get<number>('autoDeleteAfterDays', 30);
    if (autoDeleteDays > 0) {
      entry.expiresAt = Date.now() + autoDeleteDays * 24 * 60 * 60 * 1000;
    }

    try {
      this.db.insertEntry(entry);
      this._onDidCapture.fire(entry);
      Logger.info(`Captured new entry (${language}) from ${source}`);
    } catch (err) {
      Logger.error('Failed to insert clipboard entry', err);
    }
  }

  private detectSource(): ClipboardSource {
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) return 'editor';
    
    // Check terminal focus (heuristically check active terminal)
    if (vscode.window.activeTerminal) return 'terminal';
    
    return 'output'; // Fallback
  }

  public dispose() {
    if (this.pollInterval) clearInterval(this.pollInterval);
    if (this.cleanupInterval) clearInterval(this.cleanupInterval);
  }
}
