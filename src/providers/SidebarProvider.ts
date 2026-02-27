import * as vscode from 'vscode';
import { DatabaseService } from '../services/DatabaseService';
import { SearchService } from '../services/SearchService';
import { ClipboardService } from '../services/ClipboardService';
import { EncryptionService } from '../services/EncryptionService';
import { ClipboardEntry } from '../models/ClipboardEntry';

export class SidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'devclipboard.sidebar';
  private _view?: vscode.WebviewView;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _db: DatabaseService,
    private readonly _search: SearchService,
    private readonly _clipboard: ClipboardService,
    private readonly _encryption: EncryptionService
  ) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case 'READY': {
          const entries = this._db.getAllEntries();
          // Decrypt if necessary before sending to UI
          for (const entry of entries) {
            if (entry.encrypted) {
              entry.content = await this._encryption.decrypt(entry.content);
            }
          }
          webviewView.webview.postMessage({ type: 'INIT_STATE', entries });
          break;
        }
        case 'PIN_ITEM': {
          const existing = this._db.getAllEntries().find((entry) => entry.id === data.id);
          if (!existing) {
            break;
          }

          const pinned = !existing.pinned;
          this._db.updatePinned(data.id, pinned);
          const updatedEntry: ClipboardEntry = { ...existing, pinned };
          if (updatedEntry.encrypted) {
            updatedEntry.content = await this._encryption.decrypt(updatedEntry.content);
          }

          webviewView.webview.postMessage({
            type: 'ENTRY_UPDATED',
            entry: updatedEntry,
          });
          break;
        }
        case 'DELETE_ITEM': {
          this._db.deleteEntry(data.id);
          webviewView.webview.postMessage({ type: 'ENTRY_DELETED', id: data.id });
          break;
        }
        case 'PASTE_ITEM': {
          const entry = this._db.getAllEntries().find(e => e.id === data.id);
          if (entry) {
            let content = entry.content;
            if (entry.encrypted) {
              content = await this._encryption.decrypt(content);
            }
            const activeEditor = vscode.window.activeTextEditor;
            if (activeEditor) {
              activeEditor.edit(editBuilder => {
                editBuilder.insert(activeEditor.selection.active, content);
              });
            }
          }
          break;
        }
      }
    });

    this._clipboard.onDidCapture(async (entry) => {
      const clonedEntry = { ...entry };
      if (clonedEntry.encrypted) {
        clonedEntry.content = await this._encryption.decrypt(clonedEntry.content);
      }
      webviewView.webview.postMessage({ type: 'ENTRY_ADDED', entry: clonedEntry });
    });
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview', 'index.js'));
    const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview', 'index.css'));
    const nonce = getNonce();

    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
        <link href="${styleUri}" rel="stylesheet">
        <title>DevClipboard Pro</title>
      </head>
      <body>
        <div id="root"></div>
        <script nonce="${nonce}" src="${scriptUri}"></script>
      </body>
      </html>`;
  }
}

function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
