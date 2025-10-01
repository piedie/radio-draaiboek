const deleteItem = async (id) => {
    await supabase.from('items').delete().eq('id', id);
    setItems(items.filter(item => item.id !== id));
  };

  const handleDragStart = (e, item, index) => {
    setDraggedItem({ item, index });
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = async (e, dropIndex) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.index === dropIndex) {
      setDraggedItem(null);
      setDragOverIndex(null);
      return;
    }

    const newItems = [...items];
    const [movedItem] = newItems.splice(draggedItem.index, 1);
    newItems.splice(dropIndex, 0, movedItem);

    // Update positions in database
    const updates = newItems.map((item, index) => ({
      id: item.id,
      position: index
    }));

    for (const update of updates) {
      await supabase
        .from('items')
        .update({ position: update.position })
        .eq('id', update.id);
    }

    setItems(newItems);
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const quickAdd = (type) => {
    const templates = {
      music: { type: 'music', title: 'Nieuw nummer', artist: '', duration: 180, color: '#ef4444' },
      talk: { type: 'talk', title: 'Presentatie', duration: 120, color: '#22c55e' },
      reportage: { type: 'reportage', title: 'Reportage', duration: 180, color: '#f59e0b' },
      live: { type: 'live', title: 'Live', duration: 300, color: '#8b5cf6' },
      game: { type: 'game', title: 'Spel', duration: 240, color: '#f59e0b' }
    };
    if (templates[type]) addItem(templates[type]);
  };

  const addJingle = async (jingle) => {
    addItem({
      type: 'jingle',
      title: jingle.title,
      duration: jingle.duration,
      color: '#3b82f6'
    });
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

  // Utility functions
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

  // Timer
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= totalDuration) {
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
  }, [isPlaying, totalDuration]);

  // Print function
  const printRundown = () => {
    let content = 'RADIO DRAAIBOEK\n================\n\n';
    content += 'Draaiboek: ' + (rundowns.find(r => r.id === currentRundownId)?.name || 'Onbekend') + '\n';
    content += 'Datum: ' + new Date().toLocaleDateString('nl-NL') + '\n';
    content += 'Totale duur: ' + formatTime(totalDuration) + '\n\n================\n\n';
    
    items.forEach((item, index) => {
      const cumTime = getCumulativeTime(index);
      content += (index + 1) + '. [' + item.type.toUpperCase() + '] ' + item.title + '\n';
      if (item.artist) content += '   Artiest: ' + item.artist + '\n';
      content += '   Duur: ' + formatTimeShort(item.duration) + ' | Tot: ' + formatTime(cumTime) + '\n';
      
      if (item.connection_type) {
        content += '   Verbinding: ' + item.connection_type;
        if (item.phone_number && item.connection_type === 'Telefoon') {
          content += ' (' + item.phone_number + ')';
        }
        content += '\n';
      }
      
      if (printMode === 'full') {
        if (item.first_words) content += '   EERSTE WOORDEN: ' + item.first_words + '\n';
        if (item.notes) content += '   HOOFDTEKST: ' + item.notes + '\n';
        if (item.last_words) content += '   LAATSTE WOORDEN: ' + item.last_words + '\n';
      } else {
        if (item.first_words) content += '   EW: ' + item.first_words.substring(0, 60) + (item.first_words.length > 60 ? '...' : '') + '\n';
        if (item.last_words) content += '   LW: ' + item.last_words.substring(0, 60) + (item.last_words.length > 60 ? '...' : '') + '\n';
      }
      
      content += '\n';
    });
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'draaiboek-' + new Date().toISOString().split('T')[0] + '.txt';
    link.click();
    URL.revokeObjectURL(url);
    setShowPrintModal(false);
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

  // Clock Component
  const Clock = () => {
    const radius = 140;
    const center = 160;
    const hourDuration = 3600;
    
    let acc = 0;
    const segments = items.map((item) => {
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
      
      acc += item.duration;
      
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
          <line x1={center} y1={center} x2={handX} y2={handY} stroke={theme === 'light' ? '#1f2937' : '#fff'} strokeWidth={3} />
          <circle cx={center} cy={center} r={6} fill={theme === 'light' ? '#1f2937' : '#fff'} />
        </svg>
        
        <div className={'text-2xl font-mono font-bold mb-2 ' + t.text}>
          {formatTime(currentTime)} / {formatTime(3600)}
        </div>
        <div className={'text-sm mb-4 ' + t.textSecondary}>
          Totaal: {formatTime(totalDuration)}
          {totalDuration > 3600 && <span className="text-red-500 ml-2">(+{formatTime(totalDuration - 3600)} over)</span>}
        </div>
        <button onClick={() => setIsPlaying(!isPlaying)} className={t.button + ' px-4 py-2 rounded-lg flex items-center gap-2'}>
          {isPlaying ? <><Pause size={16} />Pause</> : <><Play size={16} />Start</>}
        </button>
      </div>
    );
  };

  // Item Form Component with Spotify Search
  const ItemForm = ({ item, onSave, onCancel }) => {
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
      phone_number: ''
    });

    const [localSpotifyResults, setLocalSpotifyResults] = useState([]);
    const [showLocalResults, setShowLocalResults] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

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
      const results = await searchSpotifyTrack(query);
      setLocalSpotifyResults(results);
      setShowLocalResults(results.length > 0);
      setIsSearchingSpotify(false);
    };

    const selectSpotifyResult = (result) => {
      setForm({
        ...form,
        title: result.name,
        artist: result.artist,
        duration: result.duration
      });
      setShowLocalResults(false);
      setLocalSpotifyResults([]);
    };

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
                  <label className={'block text-sm mb-1 ' + t.text}>Spotify Zoeken</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Bijv: hotel california"
                      className={'flex-1 px-3 py-2 rounded border ' + t.input}
                      onKeyPress={(e) => e.key === 'Enter' && handleSpotifySearch()}
                    />
                    <button
                      type="button"
                      onClick={handleSpotifySearch}
                      disabled={isSearchingSpotify}
                      className={'px-4 py-2 rounded flex items-center gap-2 disabled:opacity-50 ' + t.button}
                    >
                      {isSearchingSpotify ? (
                        <>Zoeken...</>
                      ) : (
                        <><Search size={16} /> Zoek</>
                      )}
                    </button>
                  </div>
                  
                  {showLocalResults && localSpotifyResults.length > 0 && (
                    <div className={'mt-2 border rounded ' + t.border}>
                      {localSpotifyResults.map((result, idx) => (
                        <button
                          key={idx}
                          onClick={() => selectSpotifyResult(result)}
                          className={'w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900 flex items-center justify-between border-b last:border-b-0 ' + t.border}
                        >
                          <div className="flex-1">
                            <div className={'font-medium ' + t.text}>{result.name}</div>
                            <div className={'text-sm ' + t.textSecondary}>
                              {result.artist} • {formatTimeShort(result.duration)}
                            </div>
                          </div>
                          <Check size={16} className="text-green-500" />
                        </button>
                      ))}
                    </div>
                  )}
                  
                  <div className={'text-xs mt-1 ' + t.textSecondary}>
                    💡 Tip: Type een deel van de titel (bijv. "hotel") en kies uit de resultaten
                  </div>
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
                        value={form.connection_type || ''}
                        onChange={(e) => setForm({...form, connection_type: e.target.value})}
                        className={'w-full px-3 py-2 rounded border ' + t.input}
                      >
                        <option value="">Selecteer verbinding...</option>
                        {connectionTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    {form.connection_type === 'Telefoon' && (
                      <div>
                        <label className={'block text-sm mb-1 ' + t.text}>Telefoonnummer</label>
                        <input
                          type="text"
                          value={form.phone_number || ''}
                          onChange={(e) => setForm({...form, phone_number: e.target.value})}
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
                    value={form.first_words || ''}
                    onChange={(e) => setForm({...form, first_words: e.target.value})}
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
                    value={form.last_words || ''}
                    onChange={(e) => setForm({...form, last_words: e.target.value})}
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

  // Login Screen
  if (showLogin) {
    return (
      <div className={t.bg + ' min-h-screen flex items-center justify-center p-4'}>
        <div className={t.card + ' rounded-lg shadow-xl p-8 w-full max-w-md border ' + t.border}>
          <h1 className={t.text + ' text-3xl font-bold mb-2 text-center'}>📻 Radio Rundown Pro</h1>
          <p className={t.textSecondary + ' text-center mb-8'}>Professioneel draaiboek beheer</p>
          
          <div className="space-y-4">
            {isRegistering && (
              <div>
                <label className={'block text-sm font-medium ' + t.text + ' mb-1'}>Naam</label>
                <input
                  type="text"
                  value={loginForm.name}
                  onChange={(e) => setLoginForm({...loginForm, name: e.target.value})}
                  className={'w-full ' + t.input + ' rounded px-3 py-2 border'}
                />
              </div>
            )}
            
            <div>
              <label className={'block text-sm font-medium ' + t.text + ' mb-1'}>Email</label>
              <input
                type="email"
                value={loginForm.email}
                onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                className={'w-full ' + t.input + ' rounded px-3 py-2 border'}
              />
            </div>
            
            <div>
              <label className={'block text-sm font-medium ' + t.text + ' mb-1'}>Wachtwoord</label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                className={'w-full ' + t.input + ' rounded px-3 py-2 border'}
                onKeyPress={(e) => e.key === 'Enter' && (isRegistering ? handleRegister() : handleLogin())}
              />
            </div>
            
            <button
              onClick={isRegistering ? handleRegister : handleLogin}
              className={'w-full ' + t.button + ' px-4 py-3 rounded-lg font-medium'}
            >
              {isRegistering ? 'Account aanmaken' : 'Inloggen'}
            </button>
            
            <button
              onClick={() => setIsRegistering(!isRegistering)}
              className={'w-full ' + t.buttonSecondary + ' px-4 py-3 rounded-lg font-medium'}
            >
              {isRegistering ? 'Al een account? Inloggen' : 'Nog geen account? Registreren'}
            </button>
          </div>
        </div>
      </div>
    );
  }

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
                {currentUser?.email}
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
              <button onClick={()// src/App.jsx - Radio Rundown Pro v1.1 met Supabase + Centrale Spotify

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Plus, Music, Mic, Volume2, Edit2, Trash2, GripVertical, Copy, LogOut, Moon, Sun, FolderOpen, Search, Check } from 'lucide-react';
import { supabase } from './supabaseClient';
import { searchSpotifyTrack } from './spotifyClient';

const RadioRundownPro = () => {
  const [theme, setTheme] = useState('light');
  const [currentUser, setCurrentUser] = useState(null);
  const [showLogin, setShowLogin] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '', name: '' });
  
  const [rundowns, setRundowns] = useState([]);
  const [currentRundownId, setCurrentRundownId] = useState(null);
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
  
  const [jingles, setJingles] = useState([]);
  const [spotifySearchResults, setSpotifySearchResults] = useState([]);
  const [isSearchingSpotify, setIsSearchingSpotify] = useState(false);
  const [showSpotifyResults, setShowSpotifyResults] = useState(false);

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

  // Check user session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setCurrentUser(session.user);
        setShowLogin(false);
        loadUserData(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setCurrentUser(session.user);
        setShowLogin(false);
        loadUserData(session.user.id);
      } else {
        setCurrentUser(null);
        setShowLogin(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (userId) => {
    // Load runbooks
    const { data: runbooksData, error: runbooksError } = await supabase
      .from('runbooks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!runbooksError && runbooksData) {
      setRundowns(runbooksData);
      if (runbooksData.length > 0) {
        setCurrentRundownId(runbooksData[0].id);
        loadRunbookItems(runbooksData[0].id);
      }
    }

    // Load jingles
    const { data: jinglesData } = await supabase
      .from('jingles')
      .select('*')
      .eq('user_id', userId);

    if (jinglesData) {
      setJingles(jinglesData);
    }
  };

  const loadRunbookItems = async (runbookId) => {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('runbook_id', runbookId)
      .order('position');

    if (!error && data) {
      setItems(data);
    }
  };

  useEffect(() => {
    if (currentRundownId) {
      loadRunbookItems(currentRundownId);
    }
  }, [currentRundownId]);

  // Auth functions
  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginForm.email,
      password: loginForm.password
    });

    if (error) {
      alert('Login mislukt: ' + error.message);
    }
  };

  const handleRegister = async () => {
    const { data, error } = await supabase.auth.signUp({
      email: loginForm.email,
      password: loginForm.password,
      options: {
        data: {
          name: loginForm.name
        }
      }
    });

    if (error) {
      alert('Registratie mislukt: ' + error.message);
    } else {
      alert('Account aangemaakt! Je kunt nu inloggen.');
      setIsRegistering(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Runbook functions
  const createNewRunbook = async () => {
    if (!currentUser) return;

    const { data, error } = await supabase
      .from('runbooks')
      .insert([{
        user_id: currentUser.id,
        name: 'Nieuw Draaiboek',
        date: new Date().toISOString().split('T')[0]
      }])
      .select();

    if (!error && data) {
      setRundowns([data[0], ...rundowns]);
      setCurrentRundownId(data[0].id);
    }
  };

  const duplicateRunbook = async (runbookId) => {
    const original = rundowns.find(r => r.id === runbookId);
    if (!original) return;

    const { data: newRunbook, error: runbookError } = await supabase
      .from('runbooks')
      .insert([{
        user_id: currentUser.id,
        name: original.name + ' (kopie)',
        date: new Date().toISOString().split('T')[0]
      }])
      .select();

    if (runbookError || !newRunbook) return;

    // Copy items
    const { data: originalItems } = await supabase
      .from('items')
      .select('*')
      .eq('runbook_id', runbookId);

    if (originalItems && originalItems.length > 0) {
      const itemsCopy = originalItems.map(item => ({
        ...item,
        id: undefined,
        runbook_id: newRunbook[0].id
      }));

      await supabase.from('items').insert(itemsCopy);
    }

    setRundowns([newRunbook[0], ...rundowns]);
  };

  const deleteRunbook = async (runbookId) => {
    await supabase.from('runbooks').delete().eq('id', runbookId);
    const updated = rundowns.filter(r => r.id !== runbookId);
    setRundowns(updated);
    if (currentRundownId === runbookId && updated.length > 0) {
      setCurrentRundownId(updated[0].id);
    }
  };

  const renameRunbook = async (runbookId, newName) => {
    await supabase
      .from('runbooks')
      .update({ name: newName })
      .eq('id', runbookId);

    setRundowns(rundowns.map(r => r.id === runbookId ? { ...r, name: newName } : r));
  };

  // Item functions
  const addItem = async (item) => {
    if (!currentRundownId) return;

    const position = items.length;
    const { data, error } = await supabase
      .from('items')
      .insert([{
        runbook_id: currentRundownId,
        ...item,
        position
      }])
      .select();

    if (!error && data) {
      setItems([...items, data[0]]);
    }
    setShowAddForm(false);
  };

  const updateItem = async (id, updated) => {
    await supabase
      .from('items')
      .update(updated)
      .eq('id', id);

    setItems(items.map(item => item.id === id ? { ...item, ...updated } : item));
    setEditingItem(null);
  };

  const deleteItem = async (id) => {
    await supabase.from('items').delete().eq('id', id);
