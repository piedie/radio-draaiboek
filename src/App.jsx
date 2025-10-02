// src/App.jsx - Radio Rundown Pro v1.1 met Supabase + Centrale Spotify
import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Plus, Music, Mic, Volume2, Edit2, Trash2, GripVertical, Copy, LogOut, Moon, Sun, FolderOpen, Search, Check } from 'lucide-react';
import { supabase } from './supabaseClient';
import { searchSpotifyTrack } from './spotifyClient';
import Clock from './Clock';
import ItemForm from './ItemForm';
import ItemTypesSettings from './ItemTypesSettings';

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
  const [isSearchingSpotify, setIsSearchingSpotify] = useState(false);
  const [showClock, setShowClock] = useState(true);
  const [itemTypes, setItemTypes] = useState([]);

  const t = theme === 'light' ? {
    bg: 'bg-gray-50', card: 'bg-white', text: 'text-gray-900', textSecondary: 'text-gray-600',
    border: 'border-gray-200', input: 'bg-white border-gray-300 text-gray-900',
    button: 'bg-blue-600 hover:bg-blue-700 text-white',
    buttonSecondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900'
  } : {
    bg: 'bg-gray-900', card: 'bg-gray-800', text: 'text-white', textSecondary: 'text-gray-400',
    border: 'border-gray-700', input: 'bg-gray-700 border-gray-600 text-white',
    button: 'bg-blue-600 hover:bg-blue-700 text-white',
    buttonSecondary: 'bg-gray-700 hover:bg-gray-600 text-white'
  };

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
    const { data: runbooksData } = await supabase.from('runbooks').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (runbooksData) {
      setRundowns(runbooksData);
      if (runbooksData.length > 0) {
        setCurrentRundownId(runbooksData[0].id);
        loadRunbookItems(runbooksData[0].id);
      }
    }
    const { data: jinglesData } = await supabase.from('jingles').select('*').eq('user_id', userId);
    if (jinglesData) setJingles(jinglesData);
  };

  const loadRunbookItems = async (runbookId) => {
    const { data } = await supabase.from('items').select('*').eq('runbook_id', runbookId).order('position');
    if (data) setItems(data);
  };

  useEffect(() => {
    if (currentRundownId) loadRunbookItems(currentRundownId);
  }, [currentRundownId]);

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email: loginForm.email, password: loginForm.password });
    if (error) alert('Login mislukt: ' + error.message);
  };

  const handleRegister = async () => {
    const { error } = await supabase.auth.signUp({
      email: loginForm.email, password: loginForm.password,
      options: { data: { name: loginForm.name } }
    });
    if (error) alert('Registratie mislukt: ' + error.message);
    else { alert('Account aangemaakt! Je kunt nu inloggen.'); setIsRegistering(false); }
  };

  const handleLogout = async () => { await supabase.auth.signOut(); };

  const createNewRunbook = async () => {
    if (!currentUser) return;
    const { data } = await supabase.from('runbooks').insert([{
      user_id: currentUser.id, name: 'Nieuw Draaiboek', date: new Date().toISOString().split('T')[0]
    }]).select();
    if (data) { setRundowns([data[0], ...rundowns]); setCurrentRundownId(data[0].id); }
  };

  const duplicateRunbook = async (runbookId) => {
    const original = rundowns.find(r => r.id === runbookId);
    if (!original) return;
    const { data: newRunbook } = await supabase.from('runbooks').insert([{
      user_id: currentUser.id, name: original.name + ' (kopie)', date: new Date().toISOString().split('T')[0]
    }]).select();
    if (newRunbook) {
      const { data: originalItems } = await supabase.from('items').select('*').eq('runbook_id', runbookId);
      if (originalItems && originalItems.length > 0) {
        const itemsCopy = originalItems.map(item => ({ ...item, id: undefined, runbook_id: newRunbook[0].id }));
        await supabase.from('items').insert(itemsCopy);
      }
      setRundowns([newRunbook[0], ...rundowns]);
    }
  };

  const deleteRunbook = async (runbookId) => {
    await supabase.from('runbooks').delete().eq('id', runbookId);
    const updated = rundowns.filter(r => r.id !== runbookId);
    setRundowns(updated);
    if (currentRundownId === runbookId && updated.length > 0) setCurrentRundownId(updated[0].id);
  };

  const renameRunbook = async (runbookId, newName) => {
    await supabase.from('runbooks').update({ name: newName }).eq('id', runbookId);
    setRundowns(rundowns.map(r => r.id === runbookId ? { ...r, name: newName } : r));
  };

  const addItem = async (item) => {
    if (!currentRundownId) return;
    const position = items.length;
    const { data } = await supabase.from('items').insert([{ runbook_id: currentRundownId, ...item, position }]).select();
    if (data) setItems([...items, data[0]]);
    setShowAddForm(false);
  };

  const updateItem = async (id, updated) => {
    await supabase.from('items').update(updated).eq('id', id);
    setItems(items.map(item => item.id === id ? { ...item, ...updated } : item));
    setEditingItem(null);
  };

  const deleteItem = async (id) => {
    await supabase.from('items').delete().eq('id', id);
    setItems(items.filter(item => item.id !== id));
  };

  const handleDragStart = (e, item, index) => { setDraggedItem({ item, index }); };
  const handleDragOver = (e, index) => { e.preventDefault(); setDragOverIndex(index); };
  
  const handleDrop = async (e, dropIndex) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.index === dropIndex) {
      setDraggedItem(null); setDragOverIndex(null); return;
    }
    const newItems = [...items];
    const [movedItem] = newItems.splice(draggedItem.index, 1);
    newItems.splice(dropIndex, 0, movedItem);
    for (let i = 0; i < newItems.length; i++) {
      await supabase.from('items').update({ position: i }).eq('id', newItems[i].id);
    }
    setItems(newItems);
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const quickAdd = (typeOrItem) => {
    if (typeof typeOrItem === 'object') {
      addItem(typeOrItem);
      return;
    }
    const templates = {
      music: { type: 'music', title: 'Nieuw nummer', artist: '', duration: 180, color: '#ef4444' },
      talk: { type: 'talk', title: 'Presentatie', duration: 120, color: '#22c55e' },
      reportage: { type: 'reportage', title: 'Reportage', duration: 180, color: '#f59e0b' },
      live: { type: 'live', title: 'Live', duration: 300, color: '#8b5cf6' },
      game: { type: 'game', title: 'Spel', duration: 240, color: '#f59e0b' }
    };
    if (templates[typeOrItem]) addItem(templates[typeOrItem]);
  };

  const addJingle = async (jingle) => { addItem({ type: 'jingle', title: jingle.title, duration: jingle.duration, color: '#3b82f6' }); };

  const toggleExpanded = (id) => {
    const newSet = new Set(expandedItems);
    if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
    setExpandedItems(newSet);
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600), m = Math.floor((seconds % 3600) / 60), s = seconds % 60;
    return h + ':' + (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  };

  const formatTimeShort = (seconds) => {
    const m = Math.floor(seconds / 60), s = seconds % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  };

  const parseTimeInput = (input) => {
    if (input.includes(':')) {
      const parts = input.split(':');
      return (parseInt(parts[0]) || 0) * 60 + (parseInt(parts[1]) || 0);
    }
    return parseInt(input) || 0;
  };

  const getCumulativeTime = (index) => items.slice(0, index + 1).reduce((sum, item) => sum + item.duration, 0);
  const totalDuration = items.reduce((sum, item) => sum + item.duration, 0);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentTime(prev => { if (prev >= totalDuration) { setIsPlaying(false); return 0; } return prev + 1; });
      }, 1000);
    } else if (intervalRef.current) clearInterval(intervalRef.current);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying, totalDuration]);

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
        if (item.phone_number && item.connection_type === 'Telefoon') content += ' (' + item.phone_number + ')';
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
      music: <Music size={16} />, talk: <Mic size={16} />, jingle: <Volume2 size={16} />,
      reportage: <span>⭐</span>, live: <span>📡</span>, game: <span>🎮</span>
    };
    return icons[type] || <Music size={16} />;
  };

  const Clock = () => {
    const radius = 140, center = 160, hourDuration = 3600;
    let acc = 0;
    const segments = items.map((item) => {
      const start = acc, end = acc + item.duration;
      if (start >= hourDuration) return null;
      const dur = Math.min(item.duration, hourDuration - start);
      const angle = (dur / hourDuration) * 360, startA = (start / hourDuration) * 360 - 90;
      const startRad = startA * Math.PI / 180, endRad = (startA + angle) * Math.PI / 180;
      const x1 = center + radius * Math.cos(startRad), y1 = center + radius * Math.sin(startRad);
      const x2 = center + radius * Math.cos(endRad), y2 = center + radius * Math.sin(endRad);
      const largeArc = angle > 180 ? 1 : 0;
      const path = 'M ' + center + ' ' + center + ' L ' + x1 + ' ' + y1 + ' A ' + radius + ' ' + radius + ' 0 ' + largeArc + ' 1 ' + x2 + ' ' + y2 + ' Z';
      acc += item.duration;
      return <path key={item.id} d={path} fill={end > hourDuration ? '#dc2626' : item.color} stroke={theme === 'light' ? '#e5e7eb' : '#374151'} strokeWidth={1} opacity={0.8} />;
    }).filter(Boolean);
    const currAngle = (currentTime / hourDuration) * 360 - 90, currRad = currAngle * Math.PI / 180;
    const handX = center + (radius - 10) * Math.cos(currRad), handY = center + (radius - 10) * Math.sin(currRad);
    return (
      <div className="flex flex-col items-center">
        <svg width="320" height="320" className="mb-4">
          {segments}
          {[0, 15, 30, 45].map(min => {
            const a = (min / 60) * 360 - 90, rad = a * Math.PI / 180;
            return (
              <g key={min}>
                <line x1={center + (radius - 15) * Math.cos(rad)} y1={center + (radius - 15) * Math.sin(rad)} x2={center + radius * Math.cos(rad)} y2={center + radius * Math.sin(rad)} stroke={theme === 'light' ? '#9ca3af' : '#6b7280'} strokeWidth={2} />
                <text x={center + (radius + 25) * Math.cos(rad)} y={center + (radius + 25) * Math.sin(rad)} textAnchor="middle" dominantBaseline="middle" className={'text-base font-bold ' + t.text} style={{ userSelect: 'none' }}>{min}</text>
              </g>
            );
          })}
          <line x1={center} y1={center} x2={handX} y2={handY} stroke={theme === 'light' ? '#1f2937' : '#fff'} strokeWidth={3} />
          <circle cx={center} cy={center} r={6} fill={theme === 'light' ? '#1f2937' : '#fff'} />
        </svg>
        <div className={'text-2xl font-mono font-bold mb-2 ' + t.text}>{formatTime(currentTime)} / {formatTime(3600)}</div>
        <div className={'text-sm mb-4 ' + t.textSecondary}>Totaal: {formatTime(totalDuration)}{totalDuration > 3600 && <span className="text-red-500 ml-2">(+{formatTime(totalDuration - 3600)} over)</span>}</div>
        <button onClick={() => setIsPlaying(!isPlaying)} className={t.button + ' px-4 py-2 rounded-lg flex items-center gap-2'}>{isPlaying ? <><Pause size={16} />Pause</> : <><Play size={16} />Start</>}</button>
      </div>
    );
  };

  const selectSpotifyResult = (result, setForm) => {
    setForm(form => ({ ...form, title: result.name, artist: result.artist, duration: result.duration }));
    setShowLocal(false);
    setLocalResults([]);
  };

  const currentRunbook = rundowns.find(r => r.id === currentRundownId);

  const openClockWindow = () => {
    const win = window.open('', 'Klok', 'width=400,height=400');
    if (win) {
      win.document.write('<!DOCTYPE html><html><head><title>Klok</title><meta name="viewport" content="width=400,initial-scale=1" /></head><body style="margin:0;background:#111;color:#fff;font-family:sans-serif;"><div id="clock-root"></div></body></html>');
      // Hier kun je eventueel een eenvoudige klok tonen
    }
  };

  return (
    <div className={t.bg + ' min-h-screen p-6'}>
      <div className="max-w-7xl mx-auto">
        <div className={t.card + ' rounded-lg p-6 mb-6 shadow border ' + t.border}>
          <div className="flex justify-between mb-4">
            <div className="flex items-center gap-4">
              {editingRunbookName === currentRundownId ? (
                <input type="text" value={currentRunbook ? currentRunbook.name : ''} onChange={(e) => renameRunbook(currentRundownId, e.target.value)} onBlur={() => setEditingRunbookName(null)} onKeyPress={(e) => e.key === 'Enter' && setEditingRunbookName(null)} className={'text-2xl font-bold px-2 py-1 rounded border ' + t.input} autoFocus />
              ) : (
                <h1 className={'text-2xl font-bold cursor-pointer hover:underline ' + t.text} onClick={() => setEditingRunbookName(currentRundownId)}>📻 {currentRunbook ? currentRunbook.name : 'Draaiboek'}</h1>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className={t.buttonSecondary + ' p-2 rounded-lg'}>{theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}</button>
              <button onClick={handleLogout} className={t.buttonSecondary + ' px-4 py-2 rounded-lg flex items-center gap-2'}><LogOut size={16} />{currentUser?.email}</button>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap mb-3">
            <button onClick={() => setShowRundownSelector(!showRundownSelector)} className={t.button + ' px-4 py-2 rounded-lg flex items-center gap-2'}><FolderOpen size={16} />Draaiboeken</button>
            <button onClick={createNewRunbook} className={t.button + ' px-4 py-2 rounded-lg flex items-center gap-2'}><Plus size={16} />Nieuw</button>
            <button onClick={() => setShowClock(!showClock)} className={t.button + ' px-4 py-2 rounded-lg flex items-center gap-2 text-sm'}>{showClock ? 'Verberg Klok' : 'Toon Klok'}</button>
            <button onClick={openClockWindow} className={t.button + ' px-4 py-2 rounded-lg flex items-center gap-2 text-sm'}>🕐 Klok in venster</button>
            <button onClick={() => setShowPrintModal(true)} className={t.buttonSecondary + ' px-3 py-2 rounded-lg text-sm'}>🖨️ Print</button>
            <button onClick={() => setExpandedItems(new Set(items.map(i => i.id)))} className={t.buttonSecondary + ' px-3 py-2 rounded-lg text-sm'}>⬇️ Alles uit</button>
            <button onClick={() => setExpandedItems(new Set())} className={t.buttonSecondary + ' px-3 py-2 rounded-lg text-sm'}>⬆️ Alles in</button>
            <button onClick={() => setShowSettings(!showSettings)} className={t.buttonSecondary + ' px-4 py-2 rounded-lg flex items-center gap-2'}>⚙️ Instellingen</button>
          </div>
          <div className={'border-t pt-3 mb-2 ' + t.border}>
            <div className={'text-xs font-semibold mb-2 ' + t.textSecondary}>ITEMS TOEVOEGEN:</div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => quickAdd('music')} className={t.buttonSecondary + ' px-3 py-2 rounded text-sm'}>🎵 Muziek</button>
              <button onClick={() => quickAdd('talk')} className={t.buttonSecondary + ' px-3 py-2 rounded text-sm'}>🎙️ Presentatie</button>
              <button onClick={() => quickAdd('reportage')} className={t.buttonSecondary + ' px-3 py-2 rounded text-sm'}>⭐ Reportage</button>
              <button onClick={() => quickAdd('live')} className={t.buttonSecondary + ' px-3 py-2 rounded text-sm'}>📡 Live</button>
              <button onClick={() => quickAdd('game')} className={t.buttonSecondary + ' px-3 py-2 rounded text-sm'}>🎮 Spel</button>
              {itemTypes.map((type, idx) => (
                <button key={idx} onClick={() => quickAdd(type)} className={t.buttonSecondary + ' px-3 py-2 rounded text-sm'}>{type.name}</button>
              ))}
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
                    <button onClick={() => duplicateRunbook(rb.id)} className={t.buttonSecondary + ' p-2 rounded'}><Copy size={16} /></button>
                    <button onClick={() => deleteRunbook(rb.id)} className={t.buttonSecondary + ' p-2 rounded hover:bg-red-100'}><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={(!showClock && !showClockWindow ? 'col-span-2 ' : '') + t.card + ' rounded-lg p-6 shadow border ' + t.border}>
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
                    <div key={item.id} draggable onDragStart={(e) => handleDragStart(e, item, idx)} onDragOver={(e) => handleDragOver(e, idx)} onDrop={(e) => handleDrop(e, idx)} className={'rounded-lg p-4 border cursor-move ' + t.card + ' ' + t.border + (isDragOver ? ' border-t-4 border-t-blue-500' : '')}>
                      <div className="flex justify-between">
                        <div className="flex gap-3 flex-1">
                          <GripVertical size={16} className={t.textSecondary} />
                          <div style={{ color: item.color }}>{getIcon(item.type)}</div>
                          <div className="flex-1 cursor-pointer" onClick={() => toggleExpanded(item.id)}>
                            <div className={'font-medium ' + t.text}>{item.title}</div>
                            {item.artist && <div className={'text-sm ' + t.textSecondary}>{item.artist}</div>}
                            {(item.first_words || item.last_words || item.connection_type) && (
                              <div className={'text-xs mt-1 ' + t.textSecondary}>
                                {item.first_words && <span>EW: {item.first_words.substring(0, 40)}{item.first_words.length > 40 ? '...' : ''}</span>}
                                {item.first_words && item.last_words && <span className="mx-1">|</span>}
                                {item.last_words && <span>LW: {item.last_words.substring(0, 40)}{item.last_words.length > 40 ? '...' : ''}</span>}
                                {item.connection_type && (
                                  <div className="mt-1">
                                    <span className="font-semibold">Verbinding: {item.connection_type}</span>
                                    {item.connection_type === 'Telefoon' && item.phone_number && <span> ({item.phone_number})</span>}
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
                          <button onClick={() => setEditingItem(item)} className={t.textSecondary}><Edit2 size={16} /></button>
                          <button onClick={() => deleteItem(item.id)} className={t.textSecondary + ' hover:text-red-500'}><Trash2 size={16} /></button>
                        </div>
                      </div>
                      {isExpanded && (item.first_words || item.notes || item.last_words) && (
                        <div className={'mt-3 pt-3 border-t ' + t.border}>
                          <div className={'text-sm p-3 rounded ' + (theme === 'light' ? 'bg-gray-50' : 'bg-gray-900')}>
                            {item.first_words && (
                              <div className="mb-3 p-2 bg-green-100 dark:bg-green-900 bg-opacity-30 rounded">
                                <div className="text-xs text-green-600 dark:text-green-400 mb-1 font-semibold">EERSTE WOORDEN:</div>
                                <div>{item.first_words}</div>
                              </div>
                            )}
                            {item.notes && (
                              <div className="mb-3">
                                <div className={'text-xs mb-1 font-semibold ' + t.textSecondary}>HOOFDTEKST:</div>
                                <div>{item.notes}</div>
                              </div>
                            )}
                            {item.last_words && (
                              <div className="p-2 bg-blue-100 dark:bg-blue-900 bg-opacity-30 rounded">
                                <div className="text-xs text-blue-600 dark:text-blue-400 mb-1 font-semibold">LAATSTE WOORDEN:</div>
                                <div>{item.last_words}</div>
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

          {showClock && !showClockWindow && (
            <div className={t.card + ' rounded-lg p-6 shadow border ' + t.border}>
              <h2 className={'text-xl font-semibold mb-4 ' + t.text}>Klok</h2>
              <Clock
                items={items}
                currentTime={currentTime}
                isPlaying={isPlaying}
                setIsPlaying={setIsPlaying}
                theme={theme}
                t={t}
                formatTime={formatTime}
                formatTimeShort={formatTimeShort}
                totalDuration={totalDuration}
              />
            </div>
          )}
        </div>

        {showClockWindow && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
            <div className={t.card + ' rounded-lg p-8 shadow-2xl max-w-2xl w-full'}>
              <div className="flex justify-between items-center mb-6">
                <h2 className={'text-2xl font-bold ' + t.text}>🕐 Uitzending Klok</h2>
                <button onClick={() => setShowClockWindow(false)} className={t.buttonSecondary + ' px-4 py-2 rounded-lg'}>Sluiten</button>
              </div>
              <Clock />
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
                    <button key={jingle.id} onClick={() => { addJingle(jingle); setShowJingleEditor(false); }} className={'w-full text-left px-4 py-3 rounded-lg ' + t.buttonSecondary + ' hover:bg-blue-100 dark:hover:bg-blue-900'}>
                      <div className={'font-medium ' + t.text}>{jingle.title}</div>
                      <div className={'text-xs ' + t.textSecondary}>Duur: {formatTimeShort(jingle.duration)}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div className={'p-6 border-t flex gap-3 ' + t.border}>
                <button onClick={() => setShowJingleEditor(false)} className={t.buttonSecondary + ' flex-1 px-4 py-2 rounded-lg'}>Sluiten</button>
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
                    <input type="radio" checked={printMode === 'rundown'} onChange={() => setPrintMode('rundown')} className="mr-2" />
                    <span className={t.text}>Rundown (kort)</span>
                  </label>
                  <label className="flex items-center">
                    <input type="radio" checked={printMode === 'full'} onChange={() => setPrintMode('full')} className="mr-2" />
                    <span className={t.text}>Volledig draaiboek</span>
                  </label>
                </div>
                <div className="flex gap-2">
                  <button onClick={printRundown} className={t.button + ' px-4 py-2 rounded flex-1'}>📄 Download TXT</button>
                  <button onClick={() => setShowPrintModal(false)} className={t.buttonSecondary + ' px-4 py-2 rounded flex-1'}>Annuleren</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showSettings && <ItemTypesSettings itemTypes={itemTypes} setItemTypes={setItemTypes} t={t} />}

      </div>

      {showAddForm && <ItemForm
        onSave={addItem}
        onCancel={() => setShowAddForm(false)}
        t={t}
        formatTimeShort={formatTimeShort}
        parseTimeInput={parseTimeInput}
        isSearchingSpotify={isSearchingSpotify}
        handleSearch={handleSpotifySearch}
        localResults={localResults}
        showLocal={showLocal}
        selectResult={selectSpotifyResult}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />}
      {editingItem && <ItemForm item={editingItem} onSave={(updated) => updateItem(editingItem.id, updated)} onCancel={() => setEditingItem(null)} />}
    </div>
  );
};

export default RadioRundownPro;