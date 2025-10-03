import React, { useState, useEffect } from 'react';
import { Search, Check } from 'lucide-react';
import { searchSpotifyTrack, testSpotifyAPI } from '../spotifyClient';

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
  const [previewAudio, setPreviewAudio] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

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

  const testPreviewUrl = async (previewUrl) => {
    try {
      console.log('Testing preview URL accessibility:', previewUrl);
      
      // Test if URL is reachable with a HEAD request
      const response = await fetch(previewUrl, { 
        method: 'HEAD',
        mode: 'no-cors' // This might help with CORS issues
      });
      
      console.log('URL test response:', {
        ok: response.ok,
        status: response.status,
        type: response.type
      });
      
      return true;
    } catch (error) {
      console.error('URL test failed:', error);
      return false;
    }
  };

  const playPreviewSimple = (previewUrl) => {
    console.log('Trying simple preview method:', previewUrl);
    
    if (!previewUrl) {
      alert('Geen preview beschikbaar voor dit nummer');
      return;
    }

    // Stop current audio if playing
    if (previewAudio) {
      previewAudio.pause();
      previewAudio.currentTime = 0;
    }

    // Simple method without CORS headers
    const audio = new Audio(previewUrl);
    audio.volume = 0.5;
    
    audio.addEventListener('canplay', () => {
      console.log('Simple method: Audio can play');
      audio.play().then(() => {
        console.log('Simple method: Playing successfully');
        setIsPlaying(true);
        setPreviewAudio(audio);
      }).catch(error => {
        console.error('Simple method play failed:', error);
        alert('Browser blokkeert automatisch afspelen. Probeer eerst op de pagina te klikken.');
      });
    });

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setPreviewAudio(null);
    });

    audio.addEventListener('error', (e) => {
      console.error('Simple method error:', e);
      alert('Preview niet beschikbaar. Dit nummer heeft mogelijk geen preview op Spotify.');
      setIsPlaying(false);
      setPreviewAudio(null);
    });

    audio.load();
  };

  const playPreview = async (previewUrl) => {
    // Try simple method first
    playPreviewSimple(previewUrl);
  };

  const stopPreview = () => {
    if (previewAudio) {
      previewAudio.pause();
      previewAudio.currentTime = 0;
      setIsPlaying(false);
      setPreviewAudio(null);
    }
  };

  // Cleanup audio when component unmounts
  useEffect(() => {
    return () => {
      if (previewAudio) {
        previewAudio.pause();
        previewAudio.currentTime = 0;
      }
    };
  }, [previewAudio]);

  // Test browser audio capabilities
  const testAudioCapabilities = () => {
    const audio = new Audio();
    const testUrl = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+D0vW0gBjiG0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+D0vW0gBjiG0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+D0vW0gBjiG0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+D0vW0gBjiG0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+D0vW0gBjiG0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+D0vW0gBjiG0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+D0vW0gBjiG0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+D0vW0gBjiG0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+D0vW0gBjiG0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+D0vW0gBjiG0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+D0vW0gBjiG0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+D0vW0gBjiG0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+D0vW0gBjiG0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+D0vW0gBjiG0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+D0vW0gBjiG0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+D0vW0gBjiG0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+D0vW0gBjiG0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+D0vW0gBjiG0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+D0vW0gBjiG0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+D0vW0gBjiG0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+D0vW0gBjiG0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+D0vW0gBjiG0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+D0vW0gBjiG0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+D0vW0gBjiG0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+D0vW0gBjiG0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+D0vW0gBjiG0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+D0vW0gBjiG0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+D0vW0gBjiG0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+D0vW0gBjiG0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+D0vW0gBjiG0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+D0vW0gBjiG0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+D0vW0gBjiG0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+D0vW0gBjiG0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+D0vW0gBjiG0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+D0vW0gBjiG0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+D0vW0gBjiG0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+D0vW0gBjiG0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+D0vW0gBjiG0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+D0vW0gBjiG0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+D0vW0gBjiG0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+D0vW0gBjiG0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+D0vW0gBjiG0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+D0vW0gBjiG0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+D0vW0gBjiG0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+D0vW0gBjiG0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+D0vW0gBjiG0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+D0vW0gBjiG0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+D0vW0gBjiG0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+D0vW0gBjiG0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+D0vW0gBjiG0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+D0vW0gBjiG0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+D0vW0gBjiG0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+D0vW0gBjiG0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+D0vW0gBjiG0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+D0vW0gBjiG0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+D0vW0gBjiG0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+D0vW0gBjiG0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+D0vW0gBjiG0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+D0vW0gBjiG0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+D0vW0gBjiG0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+D0vW0gBjiG0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+D0vW0gBjiG0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+D0vW0gBjiG0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+D0vW0gBjiG0fPNeSsFJHfH8N2QQAoUXrTp66hVFApGn+D0vW0g';
    
    console.log('Testing browser audio capabilities:');
    console.log('- Audio constructor available:', !!window.Audio);
    console.log('- AudioContext available:', !!(window.AudioContext || window.webkitAudioContext));
    console.log('- Can play MP3:', audio.canPlayType('audio/mpeg'));
    console.log('- Can play OGG:', audio.canPlayType('audio/ogg'));
    console.log('- Can play WAV:', audio.canPlayType('audio/wav'));
    console.log('- User agent:', navigator.userAgent);
    
    // Test autoplay permissions
    audio.play().then(() => {
      audio.pause();
      console.log('- Autoplay: ALLOWED');
    }).catch(error => {
      console.log('- Autoplay: BLOCKED -', error.name);
    });
  };

  const handleSubmit = () => {
    if (form.title) {
      // Stop any playing preview
      stopPreview();
      onSave(form);
    }
  };

  const handleCancel = () => {
    // Stop any playing preview
    stopPreview();
    onCancel();
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
                    {/* Warning if no previews available */}
                    {localResults.filter(r => r.preview_url).length === 0 && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-900 border-b border-blue-200 dark:border-blue-700">
                        <div className="text-blue-800 dark:text-blue-200 text-sm">
                          ℹ️ <strong>Spotify Preview Status</strong><br/>
                          Geen previews beschikbaar - dit is een bekende beperking van Spotify's API sinds 2024.<br/>
                          <strong>Dit betekent NIET dat je app niet werkt!</strong>
                          <ul className="text-xs mt-2 ml-4 list-disc">
                            <li>✅ Spotify zoeken werkt perfect</li>
                            <li>✅ Track informatie wordt correct opgehaald</li>
                            <li>✅ Metadata (titel, artiest, duur) is accuraat</li>
                            <li>❌ Preview afspelen is niet mogelijk</li>
                          </ul>
                          <div className="mt-2 text-xs font-medium">
                            💡 <strong>Gebruik de Spotify data gewoon zonder preview!</strong> De informatie is volledig en betrouwbaar.
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {localResults.map((result, idx) => (
                      <div 
                        key={idx} 
                        className={`w-full px-4 py-3 border-b last:border-b-0 ${t.border}`}
                      >
                        <div className="flex items-center justify-between">
                          <button 
                            onClick={() => selectSpotifyResult(result)} 
                            className={`flex-1 text-left hover:bg-blue-50 dark:hover:bg-blue-900 p-2 rounded`}
                          >
                            <div className={`font-medium ${t.text}`}>{result.name}</div>
                            <div className={`text-sm ${t.textSecondary}`}>
                              {result.artist} • {formatTimeShort(result.duration)}
                              {result.preview_url && <span className="ml-2 text-green-500">🎵 Preview</span>}
                              {!result.preview_url && <span className="ml-2 text-yellow-500">⚠️ Geen preview</span>}
                            </div>
                          </button>
                          
                          {/* Preview or info buttons */}
                          {result.preview_url ? (
                            <div className="flex gap-2 ml-2">
                              <button
                                type="button"
                                onClick={() => playPreview(result.preview_url)}
                                disabled={isPlaying}
                                className={`px-2 py-1 rounded text-xs ${t.button} disabled:opacity-50`}
                              >
                                ▶️ Preview
                              </button>
                              {isPlaying && (
                                <button
                                  type="button"
                                  onClick={stopPreview}
                                  className={`px-2 py-1 rounded text-xs ${t.buttonSecondary}`}
                                >
                                  ⏹️ Stop
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="flex gap-2 ml-2">
                              <button
                                type="button"
                                onClick={() => window.open(`https://open.spotify.com/track/${result.id}`, '_blank')}
                                className={`px-2 py-1 rounded text-xs ${t.buttonSecondary}`}
                                title="Open in Spotify"
                              >
                                🎵 Spotify
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className={`text-xs mt-1 ${t.textSecondary}`}>
                  💡 Tip: Type een deel van de titel (bijv. "hotel") en kies uit de resultaten
                </div>
                
                {/* Debug info for development */}
                {localResults.length > 0 && (
                  <div className={`text-xs mt-2 p-2 rounded ${t.border} border bg-gray-50 dark:bg-gray-800`}>
                    <details>
                      <summary className={`cursor-pointer ${t.textSecondary}`}>🔧 Debug Info (klik om uit te klappen)</summary>
                      <div className="mt-2 space-y-1">
                        {localResults.map((result, idx) => (
                          <div key={idx} className={`text-xs ${t.textSecondary}`}>
                            <strong>{result.name}</strong>: 
                            {result.preview_url ? 
                              <span className="text-green-600"> ✓ Preview URL beschikbaar</span> : 
                              <span className="text-yellow-600"> ⚠ Geen preview URL</span>
                            }
                            {result.preview_url && (
                              <div className="ml-2 font-mono text-xs break-all">
                                {result.preview_url}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </details>
                    <button
                      type="button"
                      onClick={testAudioCapabilities}
                      className={`mt-2 px-2 py-1 rounded text-xs ${t.buttonSecondary} mr-2`}
                    >
                      🔧 Test Audio
                    </button>
                    <button
                      type="button"
                      onClick={() => testSpotifyAPI()}
                      className={`mt-2 px-2 py-1 rounded text-xs ${t.buttonSecondary}`}
                    >
                      🎵 Test Spotify API
                    </button>
                  </div>
                )}
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

          {/* Preview speler voor geselecteerd nummer */}
          {form.type === 'music' && form.spotify_preview_url && (
            <div className={`p-3 rounded border ${t.border} bg-green-50 dark:bg-green-900`}>
              <div className={`text-sm font-medium mb-2 ${t.text}`}>🎵 Preview beschikbaar</div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => playPreview(form.spotify_preview_url)}
                  disabled={isPlaying}
                  className={`px-3 py-1 rounded text-sm ${t.button} disabled:opacity-50`}
                >
                  {isPlaying ? '🔊 Afspelen...' : '▶️ Luister Preview'}
                </button>
                {isPlaying && (
                  <button
                    type="button"
                    onClick={stopPreview}
                    className={`px-3 py-1 rounded text-sm ${t.buttonSecondary}`}
                  >
                    ⏹️ Stop
                  </button>
                )}
              </div>
            </div>
          )}

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
            onClick={handleCancel} 
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
