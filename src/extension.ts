import * as vscode from 'vscode';
import { DatabaseService } from './services/DatabaseService';
import { ClipboardService } from './services/ClipboardService';
import { ClassifierService } from './services/ClassifierService';
import { EncryptionService } from './services/EncryptionService';
import { SearchService } from './services/SearchService';
import { registerCommands } from './commands';
import { SidebarProvider } from './providers/SidebarProvider';
import { Logger } from './utils/logger';

export function activate(context: vscode.ExtensionContext) {
  Logger.info('DevClipboard Pro is activating...');

  const db = new DatabaseService(context.globalStorageUri);
  const classifier = new ClassifierService();
  const encryption = new EncryptionService(context);
  const clipboard = new ClipboardService(context, db, classifier, encryption);
  const search = new SearchService();

  const sidebarProvider = new SidebarProvider(
    context.extensionUri,
    db,
    search,
    clipboard,
    encryption
  );

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      SidebarProvider.viewType,
      sidebarProvider
    )
  );

  registerCommands(context, { db, clipboard });

  Logger.info('DevClipboard Pro is now active!');
}

export function deactivate() {
  // Cleanup logic handled by context.subscriptions
}
