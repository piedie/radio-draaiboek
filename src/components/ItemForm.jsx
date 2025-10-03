import React, { useState } from 'react';
import { Search, Check } from 'lucide-react';
import { searchSpotifyTrack } from '../spotifyClient';

const ItemForm = ({ 
  item, 
  onSave, 
  onCancel, 
  theme,
  formatTimeShort,
  parseTimeInput,
  isSearchingSpotify,
  setIsSearchingSpotify
}) => {
  const [form, setForm] = useState(item || {
    type: 'music',
    title: '',
    artist: '',
    duration: 180,
    first_words: '',
    notes: '',
    last_words: '',
    color: '#ef4444',
    connection_type: '',
    phone_number: '',
    spotify_preview_url: null
  });

  const [localResults, setLocalResults] = useState([]);
  const [showLocal, setShowLocal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const t = theme === 'light' ? {
    card: 'bg-white',
    text: 'text-gray-900',
    textSecondary: 'text-gray-600',
    border: 'border-gray-200',
    input: 'bg-white border-gray-300 text-gray-900',
    button: 'bg-blue-600 hover:bg-blue-700 text-white',
    buttonSecondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900'
  } : {
    card: 'bg-gray-800',
    text: 'text-white',
    textSecondary: 'text-gray-400',
    border: 'border-gray-700',
    input: 'bg-gray-700 border-gray-600 text-white',
    button: 'bg-blue-600 hover:bg-blue-700 text-white',
    buttonSecondary: 'bg-gray-700 hover:bg-gray-600 text-white'
  };

  const colorOptions = [
    { name: 'Rood', value: '#ef4444' },
    { name: 'Groen', value: '#22c55e' },
    { name: 'Blauw', value: '#3b82f6' },
    { name: 'Oranje', value: '#f59e0b' },
    { name: 'Paars', value: '#8b5cf6' },
    { name: 'Roze', value: '#ec4899' },
    { name: 'Geel', value: '#eab308' },
    { name: 'Turquoise', value: '#06b6d4' }
  ];

  const connectionTypes = ['LUCI', 'Teams', 'WZ', 'Telefoon'];

  const handleSpotifySearch = async () => {
    const query = searchQuery || form.title + (form.artist ? ' ' + form.artist : '');
    if (!query) return;
    
    setIsSearchingSpotify(true);
    try {
      const results = await searchSpotifyTrack(query);
      setLocalResults(results);
      setShowLocal(results.length > 0);
    } catch (error) {
      console.error('Spotify search failed:', error);
    } finally {
      setIsSearchingSpotify(false);
    }
  };

  const selectSpotifyResult = (result) => {
    console.log('Selected Spotify result:', result);
    setForm({ 
      ...form, 
      title: result.name, 
      artist: result.artist, 
      duration: result.duration,
      spotify_preview_url: result.preview_url 
    });
    setShowLocal(false);
    setLocalResults([]);
    setSearchQuery('');
    
    // Show user feedback
    if (result.preview_url) {
      console.log('Preview URL saved:', result.preview_url);
    } else {
      console.warn('No preview URL available for this track');
    }
  };

  const handleSubmit = () => {
    if (form.title) {
      onSave(form);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`rounded-lg w-full max-w-2xl max-h-[90vh] overflow-auto ${t.card}`}>
        <div className={`p-6 border-b ${t.border}`}>
          <h3 className={`text-lg font-bold ${t.text}`}>
            {item ? 'Bewerken' : 'Nieuw item'}
          </h3>
        </div>
        
        <div className="p-6 space-y-4">
          {/* Type selectie */}
          <div>
            <label className={`block text-sm mb-1 ${t.text}`}>Type</label>
            <select 
              value={form.type} 
              onChange={(e) => setForm({...form, type: e.target.value})} 
              className={`w-full px-3 py-2 rounded border ${t.input}`}
            >
              <option value="music">Muziek</option>
              <option value="talk">Presentatie</option>
              <option value="jingle">Jingle</option>
              <option value="reportage">Reportage</option>
              <option value="live">Live</option>
              <option value="game">Spel</option>
            </select>
          </div>

          {/* Titel */}
          <div>
            <label className={`block text-sm mb-1 ${t.text}`}>Titel</label>
            <input 
              type="text" 
              value={form.title} 
              onChange={(e) => setForm({...form, title: e.target.value})} 
              className={`w-full px-3 py-2 rounded border ${t.input}`} 
            />
          </div>

          {/* Muziek-specifieke velden */}
          {form.type === 'music' && (
            <>
              <div>
                <label className={`block text-sm mb-1 ${t.text}`}>Artiest</label>
                <input 
                  type="text" 
                  value={form.artist || ''} 
                  onChange={(e) => setForm({...form, artist: e.target.value})} 
                  className={`w-full px-3 py-2 rounded border ${t.input}`} 
                />
              </div>

              {/* Spotify zoeken */}
              <div>
                <label className={`block text-sm mb-1 ${t.text}`}>Spotify Zoeken</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                    placeholder="Bijv: hotel california" 
                    className={`flex-1 px-3 py-2 rounded border ${t.input}`} 
                    onKeyPress={(e) => e.key === 'Enter' && handleSpotifySearch()} 
                  />
                  <button 
                    type="button" 
                    onClick={handleSpotifySearch} 
                    disabled={isSearchingSpotify} 
                    className={`px-4 py-2 rounded flex items-center gap-2 disabled:opacity-50 ${t.button}`}
                  >
                    {isSearchingSpotify ? (
                      <>Zoeken...</>
                    ) : (
                      <>
                        <Search size={16} /> 
                        Zoek
                      </>
                    )}
                  </button>
                </div>

                {/* Spotify resultaten */}
                {showLocal && localResults.length > 0 && (
                  <div className={`mt-2 border rounded ${t.border}`}>
                    {localResults.map((result, idx) => (
                      <button 
                        key={idx} 
                        onClick={() => selectSpotifyResult(result)} 
                        className={`w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900 flex items-center justify-between border-b last:border-b-0 ${t.border}`}
                      >
                        <div className="flex-1">
                          <div className={`font-medium ${t.text}`}>{result.name}</div>
                          <div className={`text-sm ${t.textSecondary}`}>
                            {result.artist} • {formatTimeShort(result.duration)}
                            {result.preview_url && <span className="ml-2 text-green-500">🎵 Preview</span>}
                            {!result.preview_url && <span className="ml-2 text-gray-400">⚠️ Geen preview</span>}
                          </div>
                        </div>
                        <Check size={16} className="text-green-500" />
                      </button>
                    ))}
                  </div>
                )}
                
                <div className={`text-xs mt-1 ${t.textSecondary}`}>
                  💡 Tip: Type een deel van de titel (bijv. "hotel") en kies uit de resultaten
                </div>
              </div>
            </>
          )}

          {/* Duur */}
          <div>
            <label className={`block text-sm mb-1 ${t.text}`}>Duur (mm:ss)</label>
            <input 
              type="text" 
              value={formatTimeShort(form.duration)} 
              onChange={(e) => setForm({...form, duration: parseTimeInput(e.target.value)})} 
              className={`w-full px-3 py-2 rounded border font-mono ${t.input}`} 
            />
          </div>

          {/* Kleur */}
          <div>
            <label className={`block text-sm mb-1 ${t.text}`}>Kleur (voor klokweergave)</label>
            <div className="flex gap-2 flex-wrap">
              {colorOptions.map(color => (
                <button 
                  key={color.value} 
                  type="button" 
                  onClick={() => setForm({...form, color: color.value})} 
                  className={`w-10 h-10 rounded border-2 ${form.color === color.value ? 'border-blue-600' : 'border-gray-300'}`} 
                  style={{ backgroundColor: color.value }} 
                  title={color.name} 
                />
              ))}
            </div>
          </div>

          {/* Extra velden voor presentatie/reportage/live/spel */}
          {(['talk', 'reportage', 'live', 'game'].includes(form.type)) && (
            <>
              {/* Verbindingstype voor live */}
              {form.type === 'live' && (
                <>
                  <div>
                    <label className={`block text-sm mb-1 ${t.text}`}>Verbinding type</label>
                    <select 
                      value={form.connection_type || ''} 
                      onChange={(e) => setForm({...form, connection_type: e.target.value})} 
                      className={`w-full px-3 py-2 rounded border ${t.input}`}
                    >
                      <option value="">Selecteer verbinding...</option>
                      {connectionTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  {form.connection_type === 'Telefoon' && (
                    <div>
                      <label className={`block text-sm mb-1 ${t.text}`}>Telefoonnummer</label>
                      <input 
                        type="text" 
                        value={form.phone_number || ''} 
                        onChange={(e) => setForm({...form, phone_number: e.target.value})} 
                        placeholder="06-12345678" 
                        className={`w-full px-3 py-2 rounded border ${t.input}`} 
                      />
                    </div>
                  )}
                </>
              )}

              {/* Script velden */}
              <div>
                <label className={`block text-sm mb-1 ${t.text}`}>Eerste woorden</label>
                <textarea 
                  value={form.first_words || ''} 
                  onChange={(e) => setForm({...form, first_words: e.target.value})} 
                  className={`w-full px-3 py-2 rounded border h-16 ${t.input}`} 
                />
              </div>

              <div>
                <label className={`block text-sm mb-1 ${t.text}`}>Hoofdtekst</label>
                <textarea 
                  value={form.notes || ''} 
                  onChange={(e) => setForm({...form, notes: e.target.value})} 
                  className={`w-full px-3 py-2 rounded border h-20 ${t.input}`} 
                />
              </div>

              <div>
                <label className={`block text-sm mb-1 ${t.text}`}>Laatste woorden</label>
                <textarea 
                  value={form.last_words || ''} 
                  onChange={(e) => setForm({...form, last_words: e.target.value})} 
                  className={`w-full px-3 py-2 rounded border h-16 ${t.input}`} 
                />
              </div>
            </>
          )}
        </div>

        {/* Actieknoppen */}
        <div className={`p-6 border-t flex gap-3 ${t.border}`}>
          <button 
            onClick={handleSubmit} 
            className={`flex-1 px-6 py-3 rounded-lg font-medium ${t.button}`}
          >
            Opslaan
          </button>
          <button 
            onClick={onCancel} 
            className={`flex-1 px-6 py-3 rounded-lg font-medium ${t.buttonSecondary}`}
          >
            Annuleren
          </button>
        </div>
      </div>
    </div>
  );
};

export default ItemForm;
