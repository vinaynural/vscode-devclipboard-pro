export type ExtensionMessage =
  | { type: 'INIT_STATE'; entries: any[] }
  | { type: 'ENTRY_ADDED'; entry: any }
  | { type: 'ENTRY_UPDATED'; entry: any }
  | { type: 'ENTRY_DELETED'; id: string }
  | { type: 'HISTORY_CLEARED' }
  | { type: 'SETTINGS_UPDATED'; settings: any };

export type WebviewMessage =
  | { type: 'READY' }
  | { type: 'PIN_ITEM'; id: string }
  | { type: 'DELETE_ITEM'; id: string }
  | { type: 'TAG_ITEM'; id: string; tags: string[] }
  | { type: 'PASTE_ITEM'; id: string; mode: 'plain' | 'structured' }
  | { type: 'SEARCH'; query: string; filters: any }
  | { type: 'EXPORT_HISTORY'; format: 'json' | 'csv' }
  | { type: 'CLEAR_HISTORY' };
