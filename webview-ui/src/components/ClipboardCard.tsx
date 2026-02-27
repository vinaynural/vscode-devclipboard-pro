import React from 'react';
import { ClipboardEntry } from '../../../src/models/ClipboardEntry';

interface ClipboardCardProps {
  entry: ClipboardEntry;
  onPin: () => void;
  onDelete: () => void;
  onPaste: () => void;
}

export const ClipboardCard: React.FC<ClipboardCardProps> = ({ entry, onPin, onDelete, onPaste }) => {
  const timeStr = new Date(entry.timestamp).toLocaleTimeString();

  return (
    <article className="card" onClick={onPaste}>
      <div className="card-content">{entry.content}</div>
      <div className="card-meta">
        <span>
          {entry.language} | {entry.source}
        </span>
        <span>{timeStr}</span>
      </div>
      <div className="card-actions" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onPin}>
          {entry.pinned ? 'Unpin' : 'Pin'}
        </button>
        <button type="button" className="danger-button" onClick={onDelete}>
          Delete
        </button>
      </div>
    </article>
  );
};
