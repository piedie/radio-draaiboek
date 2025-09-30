import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Plus, Music, Mic, Volume2, Edit2, Trash2, GripVertical, Copy, LogOut, Moon, Sun, FolderOpen } from 'lucide-react';

const RadioRundownPro = () => {
  const [theme, setTheme] = useState('light');
  const [currentUser] = useState({ id: '1', name: 'Demo User', email: 'demo@radio.com' });
  const [showLogin] = useState(false);
  const [rundowns, setRundowns] = useState([
    {
      id: '1',
      name: 'Mijn Eerste Draaiboek',
      date: '2025-01-15',
      items: [
        { id: '1', type: 'music', title: 'Bohemian Rhapsody', artist: 'Queen', duration: 355, color: '#ef4444' },
        { id: '2', type: 'talk', title: 'Opening', duration: 120, color: '#22c55e', firstWords: 'Goedemorgen!', notes: 'Welkom', lastWords: 'Nu muziek' }
      ]
    }
  ]);
  const [currentRundownId, setCurrentRundownId] = useState('1');
  const [showRundownSelector, setShowRundownSelector] = useState(false);
  const [items, setItems] = useState([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printMode, setPrintMode] = useState('rundown');
  const [editingRunbookName, setEditingRunbookName] = useState(null);
  const [showClockWindow, setShowClockWindow] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showJingleEditor, setShowJingleEditor] = useState(false);
  const [jingles] = useState([
    { id: '1', title: 'Station ID', duration: 15 },
    { id: '2', title: 'Weer Jingle', duration: 10 }
  ]);
  const [userSettings, setUserSettings] = useState({
    name: 'Demo User',
    email: 'demo@radio.com',
    password: 'demo123'
  });
  const [spotifyClientId, setSpotifyClientId] = useState('');
  const [spotifyClientSecret, setSpotifyClientSecret] = useState('');
  const [spotifyToken, setSpotifyToken] = useState(null);
  const [spotifyStatus, setSpotifyStatus] = useState('');
  const [isSearchingSpotify, setIsSearchingSpotify] = useState(false);

  const t = theme === 'light' ? {
    bg: 'bg-gray-50',
    card: 'bg-white',
    text: 'text-gray-900',
    textSecondary: 'text-gray-600',
    border: 'border-gray-200',
    input: 'bg-white border-gray-300 text-gray-900',
    button: 'bg-blue-600 hover:bg-blue-700 text-white',
    buttonSecondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900'
  } : {
    bg: 'bg-gray-900',
    card: 'bg-gray-800',
    text: 'text-white',
    textSecondary: 'text-gray-400',
    border: 'border-gray-700',
    input: 'bg-gray-700 border-gray-600 text-white',
    button: 'bg-blue-600 hover:bg-blue-700 text-white',
    buttonSecondary: 'bg-gray-700 hover:bg-gray-600 text-white'
  };

  const handleLogout = () => {
    console.log('Logout');
  };

  useEffect(() => {
    const rundown = rundowns.find(r => r.id === currentRundownId);
    if (rundown) {
      setItems(rundown.items || []);
    }
  }, [currentRundownId, rundowns]);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentTime(prev => {
          const total = items.reduce((sum, item) => sum + item.duration, 0);
          if (prev >= total) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, items]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return hours + ':' + (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
  };

  const formatTimeShort = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins + ':' + (secs < 10 ? '0' : '') + secs;
  };

  const parseTimeInput = (input) => {
    if (input.includes(':')) {
      const parts = input.split(':');
      return (parseInt(parts[0]) || 0) * 60 + (parseInt(parts[1]) || 0);
    }
    return parseInt(input) || 0;
  };

  const getCumulativeTime = (index) => {
    return items.slice(0, index + 1).reduce((sum, item) => sum + item.duration, 0);
  };

  const totalDuration = items.reduce((sum, item) => sum + item.duration, 0);

  const createNewRunbook = () => {
    const newId = Date.now().toString();
    const newRunbook = {
      id: newId,
      name: 'Nieuw Draaiboek',
      date: new Date().toISOString().split('T')[0],
      items: []
    };
    setRundowns([...rundowns, newRunbook]);
    setCurrentRundownId(newId);
  };

  const duplicateRunbook = (id) => {
    const original = rundowns.find(r => r.id === id);
    if (original) {
      const newId = Date.now().toString();
      const duplicate = {
        ...original,
        id: newId,
        name: original.name + ' (kopie)',
        items: [...original.items]
      };
      setRundowns([...rundowns, duplicate]);
    }
  };

  const deleteRunbook = (id) => {
    if (rundowns.length > 1) {
      const filtered = rundowns.filter(r => r.id !== id);
      setRundowns(filtered);
      if (currentRundownId === id) {
        setCurrentRundownId(filtered[0].id);
      }
    }
  };

  const renameRunbook = (id, newName) => {
    setRundowns(rundowns.map(r => r.id === id ? { ...r, name: newName } : r));
  };

  const updateItems = (newItems) => {
    setRundowns(rundowns.map(r => 
      r.id === currentRundownId ? { ...r, items: newItems } : r
    ));
    setItems(newItems);
  };

  const addItem = (item) => {
    const colorMap = {
      music: '#ef4444',
      talk: '#22c55e',
      jingle: '#3b82f6',
      game: '#f59e0b',
      reportage: '#f59e0b',
      live: '#8b5cf6'
    };
    const newItem = {
      ...item,
      id: Date.now().toString(),
      color: colorMap[item.type] || '#6b7280'
    };
    updateItems([...items, newItem]);
    setShowAddForm(false);
  };

  const quickAdd = (type) => {
    const templates = {
      music: { type: 'music', title: 'Nieuw nummer', artist: '', duration: 180 },
      talk: { type: 'talk', title: 'Presentatie', duration: 120 },
      reportage: { type: 'reportage', title: 'Reportage', duration: 180 },
      live: { type: 'live', title: 'Live', duration: 300 },
      game: { type: 'game', title: 'Spel', duration: 240 }
    };
    if (templates[type]) addItem(templates[type]);
  };

  const addJingle = (jingle) => {
    addItem({
      type: 'jingle',
      title: jingle.title,
      duration: jingle.duration
    });
  };

  const updateItem = (id, updated) => {
    updateItems(items.map(item => item.id === id ? { ...item, ...updated } : item));
    setEditingItem(null);
  };

  const deleteItem = (id) => {
    updateItems(items.filter(item => item.id !== id));
  };

  const handleDragStart = (e, item, index) => {
    setDraggedItem({ item, index });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedItem && draggedItem.index !== dropIndex) {
      const newItems = [...items];
      const movedItem = newItems.splice(draggedItem.index, 1)[0];
      newItems.splice(dropIndex, 0, movedItem);
      updateItems(newItems);
    }
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const toggleExpanded = (id) => {
    const newSet = new Set(expandedItems);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedItems(newSet);
  };

  const printRundown = () => {
    let content = 'RADIO DRAAIBOEK\n';
    content = content + '================\n\n';
    content = content + 'Draaiboek: ' + (currentRunbook ? currentRunbook.name : 'Onbekend') + '\n';
    content = content + 'Datum: ' + new Date().toLocaleDateString('nl-NL') + '\n';
    content = content + 'Totale duur: ' + formatTime(totalDuration) + '\n\n';
    content = content + '================\n\n';
    
    items.forEach((item, index) => {
      const cumTime = getCumulativeTime(index);
      content = content + (index + 1) + '. [' + item.type.toUpperCase() + '] ' + item.title + '\n';
      if (item.artist) content = content + '   Artiest: ' + item.artist + '\n';
      content = content + '   Duur: ' + formatTimeShort(item.duration) + ' | Tot: ' + formatTime(cumTime) + '\n';
      
      if (item.connectionType) {
        content = content + '   Verbinding: ' + item.connectionType;
        if (item.phoneNumber && item.connectionType === 'Telefoon') {
          content = content + ' (' + item.phoneNumber + ')';
        }
        content = content + '\n';
      }
      
      if (printMode === 'full') {
        if (item.firstWords) {
          content = content + '   EERSTE WOORDEN: ' + item.firstWords + '\n';
        }
        if (item.notes) {
          content = content + '   HOOFDTEKST: ' + item.notes + '\n';
        }
        if (item.lastWords) {
          content = content + '   LAATSTE WOORDEN: ' + item.lastWords + '\n';
        }
      } else {
        if (item.firstWords) {
          content = content + '   EW: ' + item.firstWords.substring(0, 60) + (item.firstWords.length > 60 ? '...' : '') + '\n';
        }
        if (item.lastWords) {
          content = content + '   LW: ' + item.lastWords.substring(0, 60) + (item.lastWords.length > 60 ? '...' : '') + '\n';
        }
      }
      
      content = content + '\n';
    });
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'draaiboek-' + new Date().toISOString().split('T')[0] + '.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setShowPrintModal(false);
  };

  const searchSpotify = async (title, artist) => {
    if (!spotifyClientId || !spotifyClientSecret) {
      setSpotifyStatus('❌ Spotify credentials niet ingesteld');
      return null;
    }

    setIsSearchingSpotify(true);
    setSpotifyStatus('Zoeken op Spotify...');

    try {
      if (!spotifyToken) {
        const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + btoa(spotifyClientId + ':' + spotifyClientSecret)
          },
          body: 'grant_type=client_credentials'
        });

        if (!tokenResponse.ok) {
          throw new Error('Token request failed');
        }

        const tokenData = await tokenResponse.json();
        setSpotifyToken(tokenData.access_token);
        
        const query = encodeURIComponent('track:' + title + ' artist:' + artist);
        const searchResponse = await fetch('https://api.spotify.com/v1/search?q=' + query + '&type=track&limit=1', {
          headers: { 'Authorization': 'Bearer ' + tokenData.access_token }
        });

        if (!searchResponse.ok) throw new Error('Search failed');

        const searchData = await searchResponse.json();
        if (searchData.tracks.items.length > 0) {
          const track = searchData.tracks.items[0];
          setSpotifyStatus('✅ Gevonden: ' + track.name);
          setIsSearchingSpotify(false);
          return {
            name: track.name,
            artist: track.artists[0].name,
            duration: Math.round(track.duration_ms / 1000)
          };
        }
      }
    } catch (error) {
      setSpotifyStatus('⚠️ Spotify werkt alleen in productie omgeving');
    }
    
    setIsSearchingSpotify(false);
    return null;
  };

  const getIcon = (type) => {
    const icons = {
      music: <Music size={16} />,
      talk: <Mic size={16} />,
      jingle: <Volume2 size={16} />,
      reportage: <span>⭐</span>,
      live: <span>📡</span>,
      game: <span>🎮</span>
    };
    return icons[type] || <Music size={16} />;
  };

  const Clock = () => {
    const radius = 140;
    const center = 160;
    const hourDuration = 3600;
    
    let acc = 0;
    const segments = items.map((item, i) => {
      const start = acc;
      const end = acc + item.duration;
      if (start >= hourDuration) return null;
      
      const dur = Math.min(item.duration, hourDuration - start);
      const angle = (dur / hourDuration) * 360;
      const startA = (start / hourDuration) * 360 - 90;
      
      const startRad = startA * Math.PI / 180;
      const endRad = (startA + angle) * Math.PI / 180;
      
      const x1 = center + radius * Math.cos(startRad);
      const y1 = center + radius * Math.sin(startRad);
      const x2 = center + radius * Math.cos(endRad);
      const y2 = center + radius * Math.sin(endRad);
      
      const largeArc = angle > 180 ? 1 : 0;
      const path = 'M ' + center + ' ' + center + ' L ' + x1 + ' ' + y1 + ' A ' + radius + ' ' + radius + ' 0 ' + largeArc + ' 1 ' + x2 + ' ' + y2 + ' Z';
      
      acc = acc + item.duration;
      
      return (
        <path
          key={item.id}
          d={path}
          fill={end > hourDuration ? '#dc2626' : item.color}
          stroke={theme === 'light' ? '#e5e7eb' : '#374151'}
          strokeWidth={1}
          opacity={0.8}
        />
      );
    }).filter(Boolean);

    const currAngle = (currentTime / hourDuration) * 360 - 90;
    const currRad = currAngle * Math.PI / 180;
    const handX = center + (radius - 10) * Math.cos(currRad);
    const handY = center + (radius - 10) * Math.sin(currRad);

    return (
      <div className="flex flex-col items-center">
        <svg width="320" height="320" className="mb-4">
          {segments}
          {[0, 15, 30, 45].map(min => {
            const a = (min / 60) * 360 - 90;
            const rad = a * Math.PI / 180;
            return (
              <g key={min}>
                <line
                  x1={center + (radius - 15) * Math.cos(rad)}
                  y1={center + (radius - 15) * Math.sin(rad)}
                  x2={center + radius * Math.cos(rad)}
                  y2={center + radius * Math.sin(rad)}
                  stroke={theme === 'light' ? '#9ca3af' : '#6b7280'}
                  strokeWidth={2}
                />
                <text
                  x={center + (radius + 25) * Math.cos(rad)}
                  y={center + (radius + 25) * Math.sin(rad)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className={'text-base font-bold ' + t.text}
                  style={{ userSelect: 'none' }}
                >
                  {min}
                </text>
              </g>
            );
          })}
          <line
            x1={center}
            y1={center}
            x2={handX}
            y2={handY}
            stroke={theme === 'light' ? '#1f2937' : '#fff'}
            strokeWidth={3}
          />
          <circle cx={center} cy={center} r={6} fill={theme === 'light' ? '#1f2937' : '#fff'} />
        </svg>
        
        <div className={'text-2xl font-mono font-bold mb-2 ' + t.text}>
          {formatTime(currentTime)} / {formatTime(3600)}
        </div>
        <div className={'text-sm mb-4 ' + t.textSecondary}>
          Totaal: {formatTime(totalDuration)}
          {totalDuration > 3600 && <span className="text-red-500 ml-2">(+{formatTime(totalDuration - 3600)} over)</span>}
        </div>
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className={t.button + ' px-4 py-2 rounded-lg flex items-center gap-2'}
        >
          {isPlaying ? <><Pause size={16} />Pause</> : <><Play size={16} />Start</>}
        </button>
      </div>
    );
  };

  const ItemForm = ({ item, onSave, onCancel }) => {
    const [form, setForm] = useState(item || {
      type: 'music',
      title: '',
      artist: '',
      duration: 180,
      firstWords: '',
      notes: '',
      lastWords: '',
      color: '#ef4444',
      connectionType: '',
      phoneNumber: ''
    });

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

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className={'rounded-lg w-full max-w-2xl max-h-[90vh] overflow-auto ' + t.card}>
          <div className={'p-6 border-b ' + t.border}>
            <h3 className={'text-lg font-bold ' + t.text}>
              {item ? 'Bewerken' : 'Nieuw item'}
            </h3>
          </div>
          
          <div className="p-6 space-y-4">
            <div>
              <label className={'block text-sm mb-1 ' + t.text}>Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({...form, type: e.target.value})}
                className={'w-full px-3 py-2 rounded border ' + t.input}
              >
                <option value="music">Muziek</option>
                <option value="talk">Presentatie</option>
                <option value="jingle">Jingle</option>
                <option value="reportage">Reportage</option>
                <option value="live">Live</option>
                <option value="game">Spel</option>
              </select>
            </div>

            <div>
              <label className={'block text-sm mb-1 ' + t.text}>Titel</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({...form, title: e.target.value})}
                className={'w-full px-3 py-2 rounded border ' + t.input}
              />
            </div>

            {form.type === 'music' && (
              <>
                <div>
                  <label className={'block text-sm mb-1 ' + t.text}>Artiest</label>
                  <input
                    type="text"
                    value={form.artist || ''}
                    onChange={(e) => setForm({...form, artist: e.target.value})}
                    className={'w-full px-3 py-2 rounded border ' + t.input}
                  />
                </div>

                <div>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!form.title) return;
                      const track = await searchSpotify(form.title, form.artist || '');
                      if (track) {
                        setForm({
                          ...form,
                          title: track.name,
                          artist: track.artist,
                          duration: track.duration
                        });
                      }
                    }}
                    disabled={isSearchingSpotify || !form.title}
                    className={'w-full px-3 py-2 rounded flex items-center justify-center gap-2 disabled:opacity-50 ' + t.button}
                  >
                    {isSearchingSpotify ? 'Zoeken...' : '🎵 Zoek op Spotify'}
                  </button>
                  {spotifyStatus && (
                    <div className={'text-xs p-2 mt-2 rounded ' + (theme === 'light' ? 'bg-gray-100' : 'bg-gray-700')}>
                      {spotifyStatus}
                    </div>
                  )}
                </div>
              </>
            )}

            <div>
              <label className={'block text-sm mb-1 ' + t.text}>Duur (mm:ss)</label>
              <input
                type="text"
                value={formatTimeShort(form.duration)}
                onChange={(e) => setForm({...form, duration: parseTimeInput(e.target.value)})}
                className={'w-full px-3 py-2 rounded border font-mono ' + t.input}
              />
            </div>

            <div>
              <label className={'block text-sm mb-1 ' + t.text}>Kleur (voor klokweergave)</label>
              <div className="flex gap-2 flex-wrap">
                {colorOptions.map(color => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setForm({...form, color: color.value})}
                    className={'w-10 h-10 rounded border-2 ' + (form.color === color.value ? 'border-blue-600' : 'border-gray-300')}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {(form.type === 'talk' || form.type === 'reportage' || form.type === 'live' || form.type === 'game') && (
              <>
                {form.type === 'live' && (
                  <>
                    <div>
                      <label className={'block text-sm mb-1 ' + t.text}>Verbinding type</label>
                      <select
                        value={form.connectionType || ''}
                        onChange={(e) => setForm({...form, connectionType: e.target.value})}
                        className={'w-full px-3 py-2 rounded border ' + t.input}
                      >
                        <option value="">Selecteer verbinding...</option>
                        {connectionTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    {form.connectionType === 'Telefoon' && (
                      <div>
                        <label className={'block text-sm mb-1 ' + t.text}>Telefoonnummer</label>
                        <input
                          type="text"
                          value={form.phoneNumber || ''}
                          onChange={(e) => setForm({...form, phoneNumber: e.target.value})}
                          placeholder="06-12345678"
                          className={'w-full px-3 py-2 rounded border ' + t.input}
                        />
                      </div>
                    )}
                  </>
                )}

                <div>
                  <label className={'block text-sm mb-1 ' + t.text}>Eerste woorden</label>
                  <textarea
                    value={form.firstWords || ''}
                    onChange={(e) => setForm({...form, firstWords: e.target.value})}
                    className={'w-full px-3 py-2 rounded border h-16 ' + t.input}
                  />
                </div>
                <div>
                  <label className={'block text-sm mb-1 ' + t.text}>Hoofdtekst</label>
                  <textarea
                    value={form.notes || ''}
                    onChange={(e) => setForm({...form, notes: e.target.value})}
                    className={'w-full px-3 py-2 rounded border h-20 ' + t.input}
                  />
                </div>
                <div>
                  <label className={'block text-sm mb-1 ' + t.text}>Laatste woorden</label>
                  <textarea
                    value={form.lastWords || ''}
                    onChange={(e) => setForm({...form, lastWords: e.target.value})}
                    className={'w-full px-3 py-2 rounded border h-16 ' + t.input}
                  />
                </div>
              </>
            )}
          </div>

          <div className={'p-6 border-t flex gap-3 ' + t.border}>
            <button
              onClick={() => form.title && onSave(form)}
              className={'flex-1 px-6 py-3 rounded-lg font-medium ' + t.button}
            >
              Opslaan
            </button>
            <button
              onClick={onCancel}
              className={'flex-1 px-6 py-3 rounded-lg font-medium ' + t.buttonSecondary}
            >
              Annuleren
            </button>
          </div>
        </div>
      </div>
    );
  };

  const currentRunbook = rundowns.find(r => r.id === currentRundownId);

  return (
    <div className={t.bg + ' min-h-screen p-6'}>
      <div className="max-w-7xl mx-auto">
        <div className={t.card + ' rounded-lg p-6 mb-6 shadow border ' + t.border}>
          <div className="flex justify-between mb-4">
            <div className="flex items-center gap-4">
              {editingRunbookName === currentRundownId ? (
                <input
                  type="text"
                  value={currentRunbook ? currentRunbook.name : ''}
                  onChange={(e) => renameRunbook(currentRundownId, e.target.value)}
                  onBlur={() => setEditingRunbookName(null)}
                  onKeyPress={(e) => e.key === 'Enter' && setEditingRunbookName(null)}
                  className={'text-2xl font-bold px-2 py-1 rounded border ' + t.input}
                  autoFocus
                />
              ) : (
                <h1 
                  className={'text-2xl font-bold cursor-pointer hover:underline ' + t.text}
                  onClick={() => setEditingRunbookName(currentRundownId)}
                >
                  📻 {currentRunbook ? currentRunbook.name : 'Draaiboek'}
                </h1>
              )}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className={t.buttonSecondary + ' p-2 rounded-lg'}
              >
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              </button>
              <button
                onClick={handleLogout}
                className={t.buttonSecondary + ' px-4 py-2 rounded-lg flex items-center gap-2'}
              >
                <LogOut size={16} />
                {currentUser.name}
              </button>
            </div>
          </div>
          
          <div className="flex gap-2 flex-wrap mb-3">
            <button
              onClick={() => setShowRundownSelector(!showRundownSelector)}
              className={t.button + ' px-4 py-2 rounded-lg flex items-center gap-2'}
            >
              <FolderOpen size={16} />
              Draaiboeken
            </button>
            <button
              onClick={createNewRunbook}
              className={t.button + ' px-4 py-2 rounded-lg flex items-center gap-2'}
            >
              <Plus size={16} />
              Nieuw
            </button>
            <button
              onClick={() => setShowClockWindow(!showClockWindow)}
              className={t.button + ' px-4 py-2 rounded-lg flex items-center gap-2 text-sm'}
            >
              🕐 {showClockWindow ? 'Verberg Klok' : 'Toon Klok'}
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className={t.button + ' px-4 py-2 rounded-lg flex items-center gap-2'}
            >
              ⚙️ Instellingen
            </button>
            <button
              onClick={() => setShowPrintModal(true)}
              className={t.buttonSecondary + ' px-3 py-2 rounded-lg text-sm'}
            >
              🖨️ Print
            </button>
            <button
              onClick={() => setExpandedItems(new Set(items.map(i => i.id)))}
              className={t.buttonSecondary + ' px-3 py-2 rounded-lg text-sm'}
            >
              ⬇️ Alles uit
            </button>
            <button
              onClick={() => setExpandedItems(new Set())}
              className={t.buttonSecondary + ' px-3 py-2 rounded-lg text-sm'}
            >
              ⬆️ Alles in
            </button>
          </div>

          <div className={'border-t pt-3 mb-2 ' + t.border}>
            <div className={'text-xs font-semibold mb-2 ' + t.textSecondary}>ITEMS TOEVOEGEN:</div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => quickAdd('music')} className={t.buttonSecondary + ' px-3 py-2 rounded text-sm'}>🎵 Muziek</button>
              <button onClick={() => quickAdd('talk')} className={t.buttonSecondary + ' px-3 py-2 rounded text-sm'}>🎙️ Presentatie</button>
              <button onClick={() => quickAdd('reportage')} className={t.buttonSecondary + ' px-3 py-2 rounded text-sm'}>⭐ Reportage</button>
              <button onClick={() => quickAdd('live')} className={t.buttonSecondary + ' px-3 py-2 rounded text-sm'}>📡 Live</button>
              <button onClick={() => quickAdd('game')} className={t.buttonSecondary + ' px-3 py-2 rounded text-sm'}>🎮 Spel</button>
              <button onClick={() => setShowJingleEditor(true)} className={t.buttonSecondary + ' px-3 py-2 rounded text-sm'}>🔔 Jingles ▼</button>
            </div>
          </div>
        </div>

        {showRundownSelector && (
          <div className={t.card + ' rounded-lg p-4 mb-6 shadow border ' + t.border}>
            <h3 className={'font-bold mb-3 ' + t.text}>Mijn Draaiboeken</h3>
            <div className="space-y-2">
              {rundowns.map(rb => (
                <div key={rb.id} className={'flex justify-between p-3 rounded ' + (rb.id === currentRundownId ? 'bg-blue-100 dark:bg-blue-900' : t.buttonSecondary)}>
                  <button onClick={() => { setCurrentRundownId(rb.id); setShowRundownSelector(false); }} className="flex-1 text-left">
                    <div className={'font-medium ' + t.text}>{rb.name}</div>
                    <div className={'text-sm ' + t.textSecondary}>{rb.date}</div>
                  </button>
                  <div className="flex gap-2">
                    <button onClick={() => duplicateRunbook(rb.id)} className={t.buttonSecondary + ' p-2 rounded'}>
                      <Copy size={16} />
                    </button>
                    <button onClick={() => deleteRunbook(rb.id)} className={t.buttonSecondary + ' p-2 rounded hover:bg-red-100'}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={t.card + ' rounded-lg p-6 shadow border ' + t.border}>
            <h2 className={'text-xl font-semibold mb-4 ' + t.text}>Rundown</h2>
            <div className="space-y-2">
              {items.length === 0 ? (
                <div className={'text-center py-12 ' + t.textSecondary}>
                  <Music size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Nog geen items</p>
                </div>
              ) : (
                items.map((item, idx) => {
                  const isExpanded = expandedItems.has(item.id);
                  const isDragOver = dragOverIndex === idx;
                  return (
                    <div 
                      key={item.id} 
                      draggable
                      onDragStart={(e) => handleDragStart(e, item, idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDrop={(e) => handleDrop(e, idx)}
                      className={'rounded-lg p-4 border cursor-move ' + t.card + ' ' + t.border + (isDragOver ? ' border-t-4 border-t-blue-500' : '')}
                    >
                      <div className="flex justify-between">
                        <div className="flex gap-3 flex-1">
                          <GripVertical size={16} className={t.textSecondary} />
                          <div style={{ color: item.color }}>{getIcon(item.type)}</div>
                          <div 
                            className="flex-1 cursor-pointer"
                            onClick={() => toggleExpanded(item.id)}
                          >
                            <div className={'font-medium ' + t.text}>{item.title}</div>
                            {item.artist && <div className={'text-sm ' + t.textSecondary}>{item.artist}</div>}
                            
                            {(item.firstWords || item.lastWords || item.connectionType) && (
                              <div className={'text-xs mt-1 ' + t.textSecondary}>
                                {item.firstWords && (
                                  <span>EW: {item.firstWords.substring(0, 40)}{item.firstWords.length > 40 ? '...' : ''}</span>
                                )}
                                {item.firstWords && item.lastWords && <span className="mx-1">|</span>}
                                {item.lastWords && (
                                  <span>LW: {item.lastWords.substring(0, 40)}{item.lastWords.length > 40 ? '...' : ''}</span>
                                )}
                                {item.connectionType && (
                                  <div className="mt-1">
                                    <span className="font-semibold">Verbinding: {item.connectionType}</span>
                                    {item.connectionType === 'Telefoon' && item.phoneNumber && (
                                      <span> ({item.phoneNumber})</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <div className="text-right">
                            <div className={'text-sm font-mono ' + t.text}>{formatTimeShort(item.duration)}</div>
                            <div className={'text-xs font-mono ' + t.textSecondary}>tot {formatTime(getCumulativeTime(idx))}</div>
                          </div>
                          <button onClick={() => setEditingItem(item)} className={t.textSecondary}>
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => deleteItem(item.id)} className={t.textSecondary + ' hover:text-red-500'}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {isExpanded && (item.firstWords || item.notes || item.lastWords) && (
                        <div className={'mt-3 pt-3 border-t ' + t.border}>
                          <div className={'text-sm p-3 rounded ' + (theme === 'light' ? 'bg-gray-50' : 'bg-gray-900')}>
                            {item.firstWords && (
                              <div className="mb-3 p-2 bg-green-100 dark:bg-green-900 bg-opacity-30 rounded">
                                <div className="text-xs text-green-600 dark:text-green-400 mb-1 font-semibold">EERSTE WOORDEN:</div>
                                <div>{item.firstWords}</div>
                              </div>
                            )}
                            {item.notes && (
                              <div className="mb-3">
                                <div className={'text-xs mb-1 font-semibold ' + t.textSecondary}>HOOFDTEKST:</div>
                                <div>{item.notes}</div>
                              </div>
                            )}
                            {item.lastWords && (
                              <div className="p-2 bg-blue-100 dark:bg-blue-900 bg-opacity-30 rounded">
                                <div className="text-xs text-blue-600 dark:text-blue-400 mb-1 font-semibold">LAATSTE WOORDEN:</div>
                                <div>{item.lastWords}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {!showClockWindow && (
            <div className={t.card + ' rounded-lg p-6 shadow border ' + t.border}>
              <h2 className={'text-xl font-semibold mb-4 ' + t.text}>Klok</h2>
              <Clock />
            </div>
          )}
        </div>

        {showClockWindow && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
            <div className={t.card + ' rounded-lg p-8 shadow-2xl max-w-2xl w-full'}>
              <div className="flex justify-between items-center mb-6">
                <h2 className={'text-2xl font-bold ' + t.text}>🕐 Uitzending Klok</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const url = window.location.href.split('?')[0] + '?clock=true';
                      window.open(url, '_blank', 'width=800,height=800');
                    }}
                    className={t.button + ' px-4 py-2 rounded-lg text-sm'}
                  >
                    Open in nieuw venster
                  </button>
                  <button
                    onClick={() => setShowClockWindow(false)}
                    className={t.buttonSecondary + ' px-4 py-2 rounded-lg'}
                  >
                    Sluiten
                  </button>
                </div>
              </div>
              <Clock />
              <div className={'text-xs mt-4 ' + t.textSecondary + ' text-center'}>
                💡 Tip: Klik "Open in nieuw venster" om de klok naar een ander scherm te verplaatsen
              </div>
            </div>
          </div>
        )}

        {showSettings && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={t.card + ' rounded-lg w-full max-w-md shadow-2xl'}>
              <div className={'p-6 border-b ' + t.border}>
                <h3 className={'text-lg font-bold ' + t.text}>⚙️ Instellingen</h3>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className={'block text-sm mb-1 ' + t.text}>Naam</label>
                  <input
                    type="text"
                    value={userSettings.name}
                    onChange={(e) => setUserSettings({...userSettings, name: e.target.value})}
                    className={'w-full px-3 py-2 rounded border ' + t.input}
                  />
                </div>

                <div>
                  <label className={'block text-sm mb-1 ' + t.text}>Email</label>
                  <input
                    type="email"
                    value={userSettings.email}
                    onChange={(e) => setUserSettings({...userSettings, email: e.target.value})}
                    className={'w-full px-3 py-2 rounded border ' + t.input}
                  />
                </div>

                <div>
                  <label className={'block text-sm mb-1 ' + t.text}>Nieuw wachtwoord</label>
                  <input
                    type="password"
                    placeholder="Laat leeg om hetzelfde te houden"
                    onChange={(e) => e.target.value && setUserSettings({...userSettings, password: e.target.value})}
                    className={'w-full px-3 py-2 rounded border ' + t.input}
                  />
                </div>

                <div className={'border-t pt-4 ' + t.border}>
                  <h4 className={'text-sm font-semibold mb-2 ' + t.text}>Spotify API Credentials</h4>
                  <div className="space-y-3">
                    <div>
                      <label className={'block text-xs mb-1 ' + t.textSecondary}>Client ID</label>
                      <input
                        type="text"
                        value={spotifyClientId}
                        onChange={(e) => setSpotifyClientId(e.target.value)}
                        placeholder="Je Spotify Client ID"
                        className={'w-full px-3 py-2 rounded border text-sm ' + t.input}
                      />
                    </div>
                    <div>
                      <label className={'block text-xs mb-1 ' + t.textSecondary}>Client Secret</label>
                      <input
                        type="password"
                        value={spotifyClientSecret}
                        onChange={(e) => setSpotifyClientSecret(e.target.value)}
                        placeholder="Je Spotify Client Secret"
                        className={'w-full px-3 py-2 rounded border text-sm ' + t.input}
                      />
                    </div>
                    <div className={'text-xs p-2 rounded ' + (theme === 'light' ? 'bg-green-50' : 'bg-green-900 bg-opacity-20')}>
                      💡 Verkrijg credentials op <a href="https://developer.spotify.com/dashboard" target="_blank" className="text-blue-500 underline">developer.spotify.com</a>
                    </div>
                  </div>
                </div>

                <div className={'text-xs p-3 rounded ' + (theme === 'light' ? 'bg-blue-50' : 'bg-blue-900 bg-opacity-30')}>
                  💡 Let op: In de demo versie worden wijzigingen niet permanent opgeslagen
                </div>
              </div>

              <div className={'p-6 border-t flex gap-3 ' + t.border}>
                <button
                  onClick={() => setShowSettings(false)}
                  className={t.button + ' flex-1 px-4 py-2 rounded-lg'}
                >
                  Sluiten
                </button>
              </div>
            </div>
          </div>
        )}

        {showJingleEditor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={t.card + ' rounded-lg w-full max-w-md shadow-2xl'}>
              <div className={'p-6 border-b ' + t.border}>
                <h3 className={'text-lg font-bold ' + t.text}>🔔 Jingles</h3>
              </div>
              
              <div className="p-6">
                <div className="space-y-2 mb-4">
                  {jingles.map(jingle => (
                    <button
                      key={jingle.id}
                      onClick={() => {
                        addJingle(jingle);
                        setShowJingleEditor(false);
                      }}
                      className={'w-full text-left px-4 py-3 rounded-lg ' + t.buttonSecondary + ' hover:bg-blue-100 dark:hover:bg-blue-900'}
                    >
                      <div className={'font-medium ' + t.text}>{jingle.title}</div>
                      <div className={'text-xs ' + t.textSecondary}>Duur: {formatTimeShort(jingle.duration)}</div>
                    </button>
                  ))}
                </div>

                <div className={'text-xs p-3 rounded ' + (theme === 'light' ? 'bg-gray-100' : 'bg-gray-700')}>
                  💡 Later kun je hier jingles toevoegen en aanpassen
                </div>
              </div>

              <div className={'p-6 border-t flex gap-3 ' + t.border}>
                <button
                  onClick={() => setShowJingleEditor(false)}
                  className={t.buttonSecondary + ' flex-1 px-4 py-2 rounded-lg'}
                >
                  Sluiten
                </button>
              </div>
            </div>
          </div>
        )}

        {showPrintModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={t.card + ' p-6 rounded-lg w-96 shadow-2xl'}>
              <h3 className={'text-lg font-bold mb-4 ' + t.text}>Printen</h3>
              <div className="space-y-4">
                <div>
                  <label className="flex items-center mb-2">
                    <input
                      type="radio"
                      checked={printMode === 'rundown'}
                      onChange={() => setPrintMode('rundown')}
                      className="mr-2"
                    />
                    <span className={t.text}>Rundown (kort)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={printMode === 'full'}
                      onChange={() => setPrintMode('full')}
                      className="mr-2"
                    />
                    <span className={t.text}>Volledig draaiboek</span>
                  </label>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={printRundown}
                    className={t.button + ' px-4 py-2 rounded flex-1'}
                  >
                    📄 Download TXT
                  </button>
                  <button
                    onClick={() => setShowPrintModal(false)}
                    className={t.buttonSecondary + ' px-4 py-2 rounded flex-1'}
                  >
                    Annuleren
                  </button>
                </div>
                
                <div className={'text-xs mt-3 p-3 rounded ' + (theme === 'light' ? 'bg-gray-100' : 'bg-gray-700')}>
                  💡 Het bestand wordt gedownload als .txt. Open het in Word om te converteren naar PDF of DOCX.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showAddForm && (
        <ItemForm
          onSave={addItem}
          onCancel={() => setShowAddForm(false)}
        />
      )}
      
      {editingItem && (
        <ItemForm
          item={editingItem}
          onSave={(updated) => updateItem(editingItem.id, updated)}
          onCancel={() => setEditingItem(null)}
        />
      )}
    </div>
  );
};

export default RadioRundownPro;
