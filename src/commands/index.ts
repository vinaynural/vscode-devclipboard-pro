import * as vscode from 'vscode';
import { DatabaseService } from '../services/DatabaseService';
import { ClipboardService } from '../services/ClipboardService';

export interface CommandContext {
  db: DatabaseService;
  clipboard: ClipboardService;
}

export function registerCommands(context: vscode.ExtensionContext, cmdCtx: CommandContext) {
  const { db, clipboard } = cmdCtx;

  context.subscriptions.push(
    vscode.commands.registerCommand('devClipboard.openPanel', () => {
      vscode.commands.executeCommand('workbench.view.extension.dev-clipboard-explorer');
    }),

    vscode.commands.registerCommand('devClipboard.pinItem', async (id: string) => {
      if (typeof id !== 'string') return;
      db.updatePinned(id, true);
    }),

    vscode.commands.registerCommand('devClipboard.deleteItem', async (id: string) => {
      if (typeof id !== 'string') return;
      db.deleteEntry(id);
    }),

    vscode.commands.registerCommand('devClipboard.clearHistory', async () => {
      const answer = await vscode.window.showWarningMessage(
        'Are you sure you want to clear all unpinned items?',
        'Yes', 'No'
      );
      if (answer === 'Yes') {
        db.clearHistory();
      }
    }),

    vscode.commands.registerCommand('devClipboard.pasteStructured', async (entry: any) => {
       // Logic for "structured" paste - e.g. paste as JSON or specific format
       if (!entry || !entry.content) return;
       const activeEditor = vscode.window.activeTextEditor;
       if (activeEditor) {
         activeEditor.edit(editBuilder => {
           editBuilder.insert(activeEditor.selection.active, entry.content);
         });
       }
    }),

    vscode.commands.registerCommand('devClipboard.exportHistory', async () => {
      const entries = db.getAllEntries();
      const doc = await vscode.workspace.openTextDocument({
        content: JSON.stringify(entries, null, 2),
        language: 'json'
      });
      await vscode.window.showTextDocument(doc);
    })
  );
}
