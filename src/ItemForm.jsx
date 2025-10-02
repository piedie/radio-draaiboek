import React, { useState } from 'react';

const ItemForm = ({ item, onSave, onCancel, t, formatTimeShort, parseTimeInput, isSearchingSpotify, handleSearch, localResults, showLocal, selectResult, searchQuery, setSearchQuery }) => {
  const [form, setForm] = useState(item || {
    type: 'music', title: '', artist: '', duration: 180, first_words: '', notes: '', last_words: '',
    color: '#ef4444', connection_type: '', phone_number: ''
  });

  const colorOptions = [
    { name: 'Rood', value: '#ef4444' }, { name: 'Groen', value: '#22c55e' },
    { name: 'Blauw', value: '#3b82f6' }, { name: 'Oranje', value: '#f59e0b' },
    { name: 'Paars', value: '#8b5cf6' }, { name: 'Roze', value: '#ec4899' },
    { name: 'Geel', value: '#eab308' }, { name: 'Turquoise', value: '#06b6d4' }
  ];
  const connectionTypes = ['LUCI', 'Teams', 'WZ', 'Telefoon'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={'rounded-lg w-full max-w-2xl max-h-[90vh] overflow-auto ' + t.card}>
        <div className={'p-6 border-b ' + t.border}>
          <h3 className={'text-lg font-bold ' + t.text}>{item ? 'Bewerken' : 'Nieuw item'}</h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className={'block text-sm mb-1 ' + t.text}>Type</label>
            <select value={form.type} onChange={(e) => setForm({...form, type: e.target.value})} className={'w-full px-3 py-2 rounded border ' + t.input}>
              <option value="music">Muziek</option><option value="talk">Presentatie</option>
              <option value="jingle">Jingle</option><option value="reportage">Reportage</option>
              <option value="live">Live</option><option value="game">Spel</option>
            </select>
          </div>
          <div>
            <label className={'block text-sm mb-1 ' + t.text}>Titel</label>
            <input type="text" value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} className={'w-full px-3 py-2 rounded border ' + t.input} />
          </div>
          {form.type === 'music' && (
            <>
              <div>
                <label className={'block text-sm mb-1 ' + t.text}>Artiest</label>
                <input type="text" value={form.artist || ''} onChange={(e) => setForm({...form, artist: e.target.value})} className={'w-full px-3 py-2 rounded border ' + t.input} />
              </div>
              <div>
                <label className={'block text-sm mb-1 ' + t.text}>Spotify Zoeken</label>
                <div className="flex gap-2">
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Bijv: hotel california" className={'flex-1 px-3 py-2 rounded border ' + t.input} onKeyDown={(e) => e.key === 'Enter' && handleSearch(form)} />
                  <button type="button" onClick={() => handleSearch(form)} disabled={isSearchingSpotify} className={'px-4 py-2 rounded flex items-center gap-2 disabled:opacity-50 ' + t.button}>{isSearchingSpotify ? <>Zoeken...</> : <>Zoek</>}</button>
                </div>
                {showLocal && localResults.length > 0 && (
                  <div className={'mt-2 border rounded ' + t.border}>
                    {localResults.map((result, idx) => (
                      <button key={idx} onClick={() => selectResult(result, setForm)} className={'w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900 flex items-center justify-between border-b last:border-b-0 ' + t.border}>
                        <div className="flex-1">
                          <div className={'font-medium ' + t.text}>{result.name}</div>
                          <div className={'text-sm ' + t.textSecondary}>{result.artist} • {formatTimeShort(result.duration)}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                <div className={'text-xs mt-1 ' + t.textSecondary}>💡 Tip: Type een deel van de titel (bijv. "hotel") en kies uit de resultaten</div>
              </div>
            </>
          )}
          <div>
            <label className={'block text-sm mb-1 ' + t.text}>Duur (mm:ss)</label>
            <input type="text" value={formatTimeShort(form.duration)} onChange={(e) => setForm({...form, duration: parseTimeInput(e.target.value)})} className={'w-full px-3 py-2 rounded border font-mono ' + t.input} />
          </div>
          <div>
            <label className={'block text-sm mb-1 ' + t.text}>Kleur (voor klokweergave)</label>
            <div className="flex gap-2 flex-wrap">
              {colorOptions.map(color => (
                <button key={color.value} type="button" onClick={() => setForm({...form, color: color.value})} className={'w-10 h-10 rounded border-2 ' + (form.color === color.value ? 'border-blue-600' : 'border-gray-300')} style={{ backgroundColor: color.value }} title={color.name} />
              ))}
            </div>
          </div>
          {(form.type === 'talk' || form.type === 'reportage' || form.type === 'live' || form.type === 'game') && (
            <>
              {form.type === 'live' && (
                <>
                  <div>
                    <label className={'block text-sm mb-1 ' + t.text}>Verbinding type</label>
                    <select value={form.connection_type || ''} onChange={(e) => setForm({...form, connection_type: e.target.value})} className={'w-full px-3 py-2 rounded border ' + t.input}>
                      <option value="">Selecteer verbinding...</option>
                      {connectionTypes.map(type => (<option key={type} value={type}>{type}</option>))}
                    </select>
                  </div>
                  {form.connection_type === 'Telefoon' && (
                    <div>
                      <label className={'block text-sm mb-1 ' + t.text}>Telefoonnummer</label>
                      <input type="text" value={form.phone_number || ''} onChange={(e) => setForm({...form, phone_number: e.target.value})} placeholder="06-12345678" className={'w-full px-3 py-2 rounded border ' + t.input} />
                    </div>
                  )}
                </>
              )}
              <div>
                <label className={'block text-sm mb-1 ' + t.text}>Eerste woorden</label>
                <textarea value={form.first_words || ''} onChange={(e) => setForm({...form, first_words: e.target.value})} className={'w-full px-3 py-2 rounded border h-16 ' + t.input} />
              </div>
              <div>
                <label className={'block text-sm mb-1 ' + t.text}>Hoofdtekst</label>
                <textarea value={form.notes || ''} onChange={(e) => setForm({...form, notes: e.target.value})} className={'w-full px-3 py-2 rounded border h-20 ' + t.input} />
              </div>
              <div>
                <label className={'block text-sm mb-1 ' + t.text}>Laatste woorden</label>
                <textarea value={form.last_words || ''} onChange={(e) => setForm({...form, last_words: e.target.value})} className={'w-full px-3 py-2 rounded border h-16 ' + t.input} />
              </div>
            </>
          )}
        </div>
        <div className={'p-6 border-t flex gap-3 ' + t.border}>
          <button onClick={() => form.title && onSave(form)} className={'flex-1 px-6 py-3 rounded-lg font-medium ' + t.button}>Opslaan</button>
          <button onClick={onCancel} className={'flex-1 px-6 py-3 rounded-lg font-medium ' + t.buttonSecondary}>Annuleren</button>
        </div>
      </div>
    </div>
  );
};

export default ItemForm;
