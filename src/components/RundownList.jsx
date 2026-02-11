import React, { useMemo, useState } from 'react';
import { Music, Check, X, Play, Pause } from 'lucide-react';

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
  handleDrop,
  onInlineUpdate,
  readOnly = false,
  canCheck = true,
}) => {
  const [inlineEditId, setInlineEditId] = useState(null);
  const [inlineDraft, setInlineDraft] = useState({});
  const [playingReportageId, setPlayingReportageId] = useState(null);

  const t = theme === 'light' ? {
    card: 'bg-white',
    text: 'text-gray-900',
    textSecondary: 'text-gray-600',
    border: 'border-gray-200',
    rowHover: 'hover:bg-gray-50',
    headerBg: 'bg-gray-50',
    divider: 'divide-gray-200',
    input: 'bg-white border-gray-300 text-gray-900',
  } : {
    card: 'bg-gray-800',
    text: 'text-white',
    textSecondary: 'text-gray-400',
    border: 'border-gray-700',
    rowHover: 'hover:bg-gray-700/40',
    headerBg: 'bg-gray-800/60',
    divider: 'divide-gray-700',
    input: 'bg-gray-700 border-gray-600 text-white',
  };

  const statusOptions = useMemo(() => ([
    { value: 'draft', label: 'Concept' },
    { value: 'review', label: 'Review' },
    { value: 'montage', label: 'Montage' },
    { value: 'checked', label: 'Checked' },
    { value: 'cancelled', label: 'Geannuleerd' }
  ]), []);

  const visibleStatusOptions = useMemo(() => {
    if (canCheck) return statusOptions;
    return statusOptions.filter((opt) => opt.value !== 'checked');
  }, [statusOptions, canCheck]);

  const getStatusStripClass = (status) => {
    switch (status) {
      case 'checked':
        return 'bg-green-500';
      case 'review':
        return 'bg-yellow-400';
      case 'montage':
        return 'bg-blue-500';
      case 'cancelled':
        return 'bg-gray-400';
      case 'draft':
      default:
        return 'bg-gray-300';
    }
  };

  const getStatusPillClass = (status) => {
    switch (status) {
      case 'checked':
        return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-200 dark:border-green-800';
      case 'review':
        return 'bg-yellow-100 text-yellow-900 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-100 dark:border-yellow-800';
      case 'montage':
        return 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-900/30 dark:text-blue-100 dark:border-blue-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700';
      case 'draft':
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800/60 dark:text-gray-200 dark:border-gray-700';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'music':
        return 'Muziek';
      case 'talk':
        return 'Praat';
      case 'jingle':
        return 'Jingle';
      case 'reportage':
        return 'Reportage';
      case 'live':
        return 'Live';
      case 'game':
        return 'Game';
      default:
        return type || '-';
    }
  };

  const startInlineEdit = (item) => {
    if (readOnly) return;
    setInlineEditId(item.id);
    setInlineDraft({
      title: item.title ?? '',
      artist: item.artist ?? '',
      status: item.status ?? 'draft',
      duration: item.duration ?? 0,
      first_words: item.first_words ?? '',
      last_words: item.last_words ?? '',
      notes: item.notes ?? '',
    });
  };

  const cancelInlineEdit = () => {
    setInlineEditId(null);
    setInlineDraft({});
  };

  const saveInlineEdit = async (item) => {
    if (!onInlineUpdate) {
      console.warn('onInlineUpdate ontbreekt op RundownList');
      cancelInlineEdit();
      return;
    }

    await onInlineUpdate(item.id, {
      ...item,
      title: inlineDraft.title,
      artist: inlineDraft.artist,
      status: inlineDraft.status,
      duration: Number(inlineDraft.duration) || 0,
      first_words: inlineDraft.first_words,
      last_words: inlineDraft.last_words,
      notes: inlineDraft.notes,
    });

    cancelInlineEdit();
  };

  const nextStatus = (current) => {
    const order = canCheck
      ? ['draft', 'review', 'montage', 'checked', 'cancelled']
      : ['draft', 'review', 'montage', 'cancelled'];

    const idx = order.indexOf(current || 'draft');
    return order[(idx + 1) % order.length];
  };

  const handleStatusClick = async (item) => {
    if (readOnly) return;
    if (!onInlineUpdate) return;

    const updatedStatus = nextStatus(item.status);
    await onInlineUpdate(item.id, { ...item, status: updatedStatus });
  };

  const totalDuration = useMemo(() => (items || []).reduce((sum, it) => sum + (Number(it.duration) || 0), 0), [items]);

  const toggleReportagePlay = (itemId) => {
    setPlayingReportageId((prev) => (prev === itemId ? null : itemId));
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
    <div className={`rounded-lg border ${t.border} overflow-hidden ${t.card}`}>
      {/* Header */}
      <div className={`sticky top-0 z-10 grid grid-cols-12 gap-1 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${t.headerBg} ${t.textSecondary} border-b ${t.border}`}>
        <div className="col-span-1">#</div>
        {/* smaller time column */}
        <div className="col-span-2 md:col-span-2">Tijd</div>
        <div className="col-span-1">Type</div>
        <div className="col-span-5">Titel</div>
        <div className="col-span-1">Status</div>
        <div className="col-span-1">Duur</div>
        <div className="col-span-1 text-right">Acties</div>
      </div>

      {/* Rows */}
      <div className={`divide-y ${t.divider}`}>
        {items.map((item, idx) => {
          const isExpanded = expandedItems.has(item.id);
          const isDragOver = dragOverIndex === idx;
          const isInlineEditing = inlineEditId === item.id;
          const isReportagePlaying = playingReportageId === item.id;

          return (
            <div key={item.id}>
              {/* Hidden audio element for reportage */}
              {item.type === 'reportage' && item.audio_url && (
                <audio
                  src={item.audio_url}
                  preload="none"
                  onEnded={() => setPlayingReportageId(null)}
                  autoPlay={isReportagePlaying}
                />
              )}

              <div
                draggable={!readOnly}
                onDragStart={(e) => !readOnly && handleDragStart(e, item, idx)}
                onDragOver={(e) => !readOnly && handleDragOver(e, idx)}
                onDrop={(e) => !readOnly && handleDrop(e, idx)}
                className={`relative grid grid-cols-12 gap-1 px-2 py-1.5 items-center ${t.rowHover} ${isDragOver ? 'ring-2 ring-blue-500 ring-inset' : ''}`}
              >
                {/* Status strip */}
                <div className={`absolute left-0 top-0 h-full w-1 ${getStatusStripClass(item.status)}`} />

                {/* # smaller */}
                <div
                  className={`col-span-1 text-[11px] ${t.textSecondary} cursor-pointer`}
                  onClick={() => toggleExpanded(item.id)}
                  title="Open/sluit details"
                >
                  {idx + 1}
                </div>

                {/* time: a bit tighter font */}
                <div className="col-span-2 cursor-pointer" onClick={() => toggleExpanded(item.id)}>
                  <div className={`text-[12px] font-mono leading-4 ${t.text}`}>{formatTimeShort(getCumulativeTime(idx))}</div>
                  <div className={`text-[10px] leading-3 ${t.textSecondary}`}>{formatTime(getCumulativeTime(idx))}</div>
                </div>

                <div className={`col-span-1 text-[11px] ${t.textSecondary} cursor-pointer`} onClick={() => toggleExpanded(item.id)}>
                  {getTypeLabel(item.type)}
                </div>

                {/* Title/Artist inline */}
                <div className="col-span-5 min-w-0">
                  {isInlineEditing ? (
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <input
                          className={`w-full text-[13px] px-2 py-1 rounded border ${t.input}`}
                          value={inlineDraft.title}
                          onChange={(e) => setInlineDraft({ ...inlineDraft, title: e.target.value })}
                          placeholder="Titel"
                        />
                        <input
                          className={`w-full text-[11px] px-2 py-1 rounded border ${t.input}`}
                          value={inlineDraft.artist}
                          onChange={(e) => setInlineDraft({ ...inlineDraft, artist: e.target.value })}
                          placeholder="Artiest (optioneel)"
                        />
                      </div>

                      <div className="grid grid-cols-12 gap-2">
                        <div className="col-span-12">
                          <label className={`block text-[10px] font-semibold uppercase tracking-wide mb-1 ${t.textSecondary}`}>
                            Eerste woorden
                          </label>
                          <textarea
                            rows={2}
                            className={`w-full text-[12px] px-2 py-1 rounded border ${t.input}`}
                            value={inlineDraft.first_words}
                            onChange={(e) => setInlineDraft({ ...inlineDraft, first_words: e.target.value })}
                            placeholder="Eerste woorden / intro (optioneel)"
                          />
                        </div>
                        <div className="col-span-12">
                          <label className={`block text-[10px] font-semibold uppercase tracking-wide mb-1 ${t.textSecondary}`}>
                            Notities (presentator)
                          </label>
                          <textarea
                            rows={3}
                            className={`w-full text-[12px] px-2 py-1 rounded border ${t.input}`}
                            style={{ borderLeft: theme === 'light' ? '4px solid #f59e0b' : '4px solid #fbbf24' }}
                            value={inlineDraft.notes}
                            onChange={(e) => setInlineDraft({ ...inlineDraft, notes: e.target.value })}
                            placeholder="Opmerkingen / cues / reminders"
                          />
                        </div>
                        <div className="col-span-12">
                          <label className={`block text-[10px] font-semibold uppercase tracking-wide mb-1 ${t.textSecondary}`}>
                            Laatste woorden
                          </label>
                          <textarea
                            rows={2}
                            className={`w-full text-[12px] px-2 py-1 rounded border ${t.input}`}
                            value={inlineDraft.last_words}
                            onChange={(e) => setInlineDraft({ ...inlineDraft, last_words: e.target.value })}
                            placeholder="Laatste woorden / outro (optioneel)"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="cursor-pointer" onClick={() => toggleExpanded(item.id)}>
                      <div
                        className={`text-[13px] leading-4 font-medium truncate ${
                          item.status === 'cancelled' ? 'line-through opacity-60' : ''
                        } ${t.text}`}
                      >
                        {item.title || '(zonder titel)'}
                      </div>
                      {item.artist ? <div className={`text-[11px] leading-3 truncate ${t.textSecondary}`}>{item.artist}</div> : null}

                      {(item.first_words || item.last_words || item.notes) ? (
                        <div className={`mt-1 text-[10px] leading-3 ${t.textSecondary} line-clamp-2`}>
                          {item.first_words ? `EW: ${item.first_words}` : ''}
                          {item.first_words && item.last_words ? ' • ' : ''}
                          {item.last_words ? `LW: ${item.last_words}` : ''}
                          {(item.first_words || item.last_words) && item.notes ? ' • ' : ''}
                          {item.notes ? `Notities: ${item.notes}` : ''}
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>

                {/* Status inline */}
                <div className="col-span-1" onClick={(e) => e.stopPropagation()}>
                  {isInlineEditing ? (
                    <select
                      className={`w-full text-[12px] px-2 py-1 rounded border ${t.input}`}
                      value={inlineDraft.status}
                      onChange={(e) => setInlineDraft({ ...inlineDraft, status: e.target.value })}
                    >
                      {visibleStatusOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <button
                      type="button"
                      className={`w-full text-left text-[11px] px-2 py-1 rounded border ${getStatusPillClass(item.status)} ${readOnly ? 'cursor-default opacity-75' : 'cursor-pointer hover:opacity-90'}`}
                      title={readOnly ? 'Alleen-lezen' : 'Klik om status te wisselen'}
                      onClick={() => handleStatusClick(item)}
                      disabled={readOnly}
                    >
                      {item.status || 'draft'}
                    </button>
                  )}
                </div>

                {/* Duration inline + cumulative as small subline */}
                <div className="col-span-1">
                  {isInlineEditing ? (
                    <input
                      type="number"
                      className={`w-full text-sm font-mono px-2 py-1 rounded border ${t.input}`}
                      value={inlineDraft.duration}
                      onChange={(e) => setInlineDraft({ ...inlineDraft, duration: e.target.value })}
                      min={0}
                      step={1}
                      title="Duur in seconden"
                    />
                  ) : (
                    <div>
                      <div className={`text-[12px] font-mono leading-4 ${t.text}`}>{formatTimeShort(item.duration || 0)}</div>
                      <div className={`text-[10px] font-mono leading-3 ${t.textSecondary}`}>totaal {formatTime(getCumulativeTime(idx))}</div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="col-span-1 flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                  {!isInlineEditing && item.type === 'reportage' && item.audio_url ? (
                    <button
                      type="button"
                      className={`p-1.5 rounded border ${t.border} ${t.textSecondary} ${theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-gray-700'}`}
                      title={isReportagePlaying ? 'Pauze' : 'Afspelen'}
                      onClick={() => toggleReportagePlay(item.id)}
                    >
                      {isReportagePlaying ? <Pause size={14} /> : <Play size={14} />}
                    </button>
                  ) : null}

                  {isInlineEditing ? (
                    <>
                      <button
                        type="button"
                        className="p-1.5 rounded border border-green-600 text-green-700 hover:bg-green-50"
                        title="Opslaan"
                        onClick={() => saveInlineEdit(item)}
                      >
                        <Check size={14} />
                      </button>
                      <button
                        type="button"
                        className={`p-1.5 rounded border ${t.border} ${t.textSecondary} ${theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-gray-700'}`}
                        title="Annuleren"
                        onClick={cancelInlineEdit}
                      >
                        <X size={14} />
                      </button>
                    </>
                  ) : (
                    <>
                      {!readOnly ? (
                        <>
                          <button
                            type="button"
                            className={`text-[11px] px-2 py-1 rounded border ${t.border} ${t.textSecondary} ${theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-gray-700'}`}
                            onClick={() => startInlineEdit(item)}
                            title="Inline bewerken"
                          >
                            Inline
                          </button>
                          <button
                            type="button"
                            className={`text-[11px] px-2 py-1 rounded border ${t.border} ${t.textSecondary} ${theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-gray-700'}`}
                            onClick={() => setEditingItem(item)}
                            title="Open formulier"
                          >
                            Form
                          </button>
                          <button
                            type="button"
                            className="text-[11px] px-2 py-1 rounded border border-red-500 text-red-600 hover:bg-red-50"
                            onClick={() => deleteItem(item.id)}
                            title="Verwijderen"
                          >
                            Del
                          </button>
                        </>
                      ) : (
                        <div className={`text-[11px] ${t.textSecondary}`}>—</div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className={`px-3 py-2 border-t ${t.border} ${theme === 'light' ? 'bg-white' : 'bg-gray-800'}`}>
                  <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-12 md:col-span-6">
                      <div className={`text-xs font-semibold mb-1 ${t.textSecondary}`}>Notities</div>
                      <div className={`text-sm whitespace-pre-wrap ${t.text}`}>{item.notes || '-'}</div>
                    </div>
                    <div className="col-span-12 md:col-span-6">
                      <div className={`text-xs font-semibold mb-1 ${t.textSecondary}`}>Details</div>
                      <div className={`text-sm ${t.text}`}>
                        <div>
                          <span className={t.textSecondary}>Status:</span> {item.status || 'draft'}
                        </div>
                        {item.first_words ? (
                          <div>
                            <span className={t.textSecondary}>Eerste woorden:</span> {item.first_words}
                          </div>
                        ) : null}
                        {item.last_words ? (
                          <div>
                            <span className={t.textSecondary}>Laatste woorden:</span> {item.last_words}
                          </div>
                        ) : null}
                        {item.connection_type ? (
                          <div>
                            <span className={t.textSecondary}>Verbinding:</span> {item.connection_type}
                            {item.phone_number ? ` (${item.phone_number})` : ''}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Footer: total rundown duration */}
        <div className={`grid grid-cols-12 gap-1 px-2 py-2 items-center ${t.headerBg} border-t ${t.border}`}>
          <div className={`col-span-9 text-xs font-semibold ${t.textSecondary}`}>Totale duur</div>
          <div className="col-span-2" />
          <div className={`col-span-1 text-[12px] font-mono text-right ${t.text}`}>{formatTimeShort(totalDuration)}</div>
        </div>
      </div>
    </div>
  );
};

export default RundownList;
