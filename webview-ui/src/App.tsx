import React, { useEffect } from 'react';
import { useVSCodeBridge } from './hooks/useVSCodeBridge';
import { useClipboardStore } from './store/useClipboardStore';
import { SearchBar } from './components/SearchBar';
import { ClipboardList } from './components/ClipboardList';
import { ExtensionMessage } from './types/messages';

const App: React.FC = () => {
  const store = useClipboardStore();
  const { postMessage } = useVSCodeBridge((message: ExtensionMessage) => {
    switch (message.type) {
      case 'INIT_STATE':
        store.setEntries(message.entries);
        break;
      case 'ENTRY_ADDED':
        store.addEntry(message.entry);
        break;
      case 'ENTRY_DELETED':
        store.deleteEntry(message.id);
        break;
      case 'ENTRY_UPDATED':
        store.updateEntry(message.entry);
        break;
    }
  });

  useEffect(() => {
    postMessage({ type: 'READY' });
  }, [postMessage]);

  return (
    <div className="app-container">
      <header>
        <SearchBar 
          value={store.searchQuery} 
          onChange={(v) => store.setSearchQuery(v)}
          onFilterChange={(f) => store.setFilters(f)}
        />
      </header>
      <main>
        <ClipboardList 
          entries={store.filteredEntries} 
          onPin={(id) => postMessage({ type: 'PIN_ITEM', id })}
          onDelete={(id) => postMessage({ type: 'DELETE_ITEM', id })}
          onPaste={(id) => postMessage({ type: 'PASTE_ITEM', id, mode: 'plain' })}
        />
      </main>
    </div>
  );
};

export default App;
