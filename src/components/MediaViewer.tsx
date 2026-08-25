import React from 'react';
import { MediaItem } from '../types';

export const MediaViewer = ({ media, className = '' }: { media?: MediaItem[], className?: string }) => {
  if (!media || media.length === 0) return null;
  return (
    <div className={`mt-3 flex flex-wrap gap-3 ${className}`}>
      {media.map((m, idx) => (
        m.type === 'image' ? (
          <img 
            key={idx} 
            src={m.url} 
            alt="Attached Media" 
            className="max-w-full rounded-xl border border-slate-200 shadow-sm" 
            style={{ maxHeight: '350px' }} 
          />
        ) : null
      ))}
    </div>
  );
};
