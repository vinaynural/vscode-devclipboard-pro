import React from 'react';
import { ClipboardEntry } from '../../../src/models/ClipboardEntry';
import { ClipboardCard } from './ClipboardCard';

interface ClipboardListProps {
  entries: ClipboardEntry[];
  onPin: (id: string) => void;
  onDelete: (id: string) => void;
  onPaste: (id: string) => void;
}

export const ClipboardList: React.FC<ClipboardListProps> = ({ entries, onPin, onDelete, onPaste }) => {
  if (entries.length === 0) {
    return (
      <div className="list-wrapper">
        <div className="empty-state">No clipboard entries match your search.</div>
      </div>
    );
  }

  return (
    <div className="list-wrapper">
      {entries.map((entry) => (
        <ClipboardCard
          key={entry.id}
          entry={entry}
          onPin={() => onPin(entry.id)}
          onDelete={() => onDelete(entry.id)}
          onPaste={() => onPaste(entry.id)}
        />
      ))}
    </div>
  );
};
