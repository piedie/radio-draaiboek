import React from 'react';
import { Music } from 'lucide-react';
import RundownItem from './RundownItem';

const RundownList = ({ 
  items,
  expandedItems,
  dragOverIndex,
  theme,
  formatTimeShort,
  formatTime,
  getCumulativeTime,
  toggleExpanded,
  setEditingItem,
  deleteItem,
  handleDragStart,
  handleDragOver,
  handleDrop
}) => {
  const t = theme === 'light' ? {
    card: 'bg-white',
    text: 'text-gray-900',
    textSecondary: 'text-gray-600',
    border: 'border-gray-200'
  } : {
    card: 'bg-gray-800',
    text: 'text-white',
    textSecondary: 'text-gray-400',
    border: 'border-gray-700'
  };

  if (items.length === 0) {
    return (
      <div className={`text-center py-12 ${t.textSecondary}`}>
        <Music size={48} className="mx-auto mb-4 opacity-50" />
        <p>Nog geen items</p>
        <p className="text-sm mt-2">Voeg items toe met de knoppen hierboven</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <RundownItem 
          key={item.id}
          item={item}
          index={idx}
          isExpanded={expandedItems.has(item.id)}
          isDragOver={dragOverIndex === idx}
          theme={theme}
          formatTimeShort={formatTimeShort}
          formatTime={formatTime}
          getCumulativeTime={getCumulativeTime}
          toggleExpanded={toggleExpanded}
          onEdit={setEditingItem}
          onDelete={deleteItem}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        />
      ))}
    </div>
  );
};

export default RundownList;
