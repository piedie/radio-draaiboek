// src/App.jsx - Radio Rundown Pro v2.2 - Met Custom Item Types
import React, { useState, useRef, useEffect } from 'react';
import { Plus, Copy, LogOut, Moon, Sun, FolderOpen, Trash2, Settings } from 'lucide-react';
import { supabase } from './supabaseClient';
import Clock from './components/Clock';
import ItemForm from './components/ItemForm';
import ItemTypeManager from './components/ItemTypeManager';
import RundownList from './components/RundownList';
import { loadUserItemTypes, getItemTypeByName } from './utils/itemTypeManager';

// Versie informatie
const APP_VERSION = '2.3';
const BUILD_DATE = '2025-10-04';
const COPYRIGHT_YEAR = new Date().getFullYear();

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
  
  // State voor klok weergave
  const [showClock, setShowClock] = useState(true);
  const [showClockWindow, setShowClockWindow] = useState(false);
  
  // State voor item types
  const [userItemTypes, setUserItemTypes] = useState([]);
  const [showItemTypeManager, setShowItemTypeManager] = useState(false);
  
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [showJingleEditor, setShowJingleEditor] = useState(false);
  const [jingles, setJingles] = useState([]);
  const [isSearchingSpotify, setIsSearchingSpotify] = useState(false);

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

  // Debug effect voor userItemTypes
  useEffect(() => {
    console.log('🔄 userItemTypes state updated:', userItemTypes);
  }, [userItemTypes]);

  // Authentication en data loading
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
    try {
      // Laad runbooks
      const { data: runbooksData } = await supabase.from('runbooks').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      if (runbooksData) {
        setRundowns(runbooksData);
        if (runbooksData.length > 0) {
          setCurrentRundownId(runbooksData[0].id);
          loadRunbookItems(runbooksData[0].id);
        }
      }
      
      // Laad jingles
      const { data: jinglesData } = await supabase.from('jingles').select('*').eq('user_id', userId);
      if (jinglesData) setJingles(jinglesData);
      
      // Laad item types
      const itemTypes = await loadUserItemTypes(userId);
      setUserItemTypes(itemTypes);
      console.log('🔄 Loaded item types in loadUserData:', itemTypes);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadRunbookItems = async (runbookId) => {
    const { data } = await supabase.from('items').select('*').eq('runbook_id', runbookId).order('position');
    if (data) setItems(data);
  };

  useEffect(() => {
    if (currentRundownId) loadRunbookItems(currentRundownId);
  }, [currentRundownId]);

  // Authentication handlers
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

  // Runbook management
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

  // Item management
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

  // Drag and drop
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

  // Quick add templates - now using user item types
  const quickAdd = (typeName) => {
    console.log('🔄 quickAdd called with:', typeName);
    console.log('🔄 Available userItemTypes:', userItemTypes);
    
    const itemType = getItemTypeByName(userItemTypes, typeName);
    console.log('🔄 Found itemType:', itemType);
    
    if (itemType) {
      const newItem = {
        type: itemType.name,
        title: `Nieuw ${itemType.display_name.toLowerCase()}`,
        artist: itemType.name === 'music' ? '' : undefined,
        duration: itemType.default_duration,
        color: itemType.color,
        user_item_type_id: itemType.id || null
      };
      console.log('🔄 Creating new item:', newItem);
      addItem(newItem);
    } else {
      console.error('❌ Item type not found:', typeName);
    }
  };

  // Callback voor wanneer item types worden aangepast
  const handleItemTypesChanged = async () => {
    console.log('🔄 handleItemTypesChanged called');
    if (currentUser) {
      console.log('🔄 Reloading item types for user:', currentUser.id);
      const itemTypes = await loadUserItemTypes(currentUser.id);
      console.log('✅ Loaded updated item types:', itemTypes);
      setUserItemTypes(itemTypes);
    }
  };

  // Helper functie voor item type iconen
  const getItemTypeIcon = (typeName) => {
    const icons = {
      music: '🎵',
      talk: '🎙️',
      jingle: '🔔',
      reportage: '⭐',
      live: '📡',
      game: '🎮',
      sponsor: '💰',
      weerbericht: '🌤️'
    };
    return icons[typeName] || '📄';
  };

  const addJingle = async (jingle) => { 
    addItem({ type: 'jingle', title: jingle.title, duration: jingle.duration, color: '#3b82f6' }); 
  };

  // UI helpers
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

  // Timer effect
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentTime(prev => { if (prev >= totalDuration) { setIsPlaying(false); return 0; } return prev + 1; });
      }, 1000);
    } else if (intervalRef.current) clearInterval(intervalRef.current);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying, totalDuration]);

  // Keyboard shortcuts for game audio
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Only handle number keys 1-4 when no input is focused
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      const keyNumber = parseInt(e.key);
      if (keyNumber >= 1 && keyNumber <= 4) {
        // Find the first expanded game item
        const expandedGameItem = items.find(item => 
          item.type === 'game' && 
          expandedItems.has(item.id) && 
          item.audio_files && 
          item.audio_files.length >= keyNumber
        );
        
        if (expandedGameItem) {
          const audioFile = expandedGameItem.audio_files[keyNumber - 1];
          console.log(`🎮 Keyboard shortcut ${keyNumber} triggered for audio:`, audioFile.name);
          
          // Find and click the audio button
          const audioButton = document.querySelector(`[data-audio-id="${audioFile.id}"]`);
          if (audioButton) {
            audioButton.click();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [items, expandedItems]);

  // Print functionality
  const printRundown = () => {
    let content = 'RADIO DRAAIBOEK\n================\n\n';
    content += 'Draaiboek: ' + (rundowns.find(r => r.id === currentRundownId)?.name || 'Onbekend') + '\n';
    content += 'Datum: ' + new Date().toLocaleDateString('nl-NL') + '\n';
    content += 'Totale duur: ' + formatTime(totalDuration) + '\n\n================\n\n';
    items.forEach((item, index) => {
      const cumTime = getCumulativeTime(index);
      content += (index + 1) + '. [' + item.type.toUpperCase() + '] ' + item.title + '\n';
      if (item.artist) content += '   Artiest: ' + item.artist + '\n';
      content += '   Duur: ' + formatTimeShort(item.duration) + ' | Totaal: ' + formatTime(cumTime) + '\n';
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

  // Popup klok window
  const openClockWindow = () => {
    setShowClockWindow(true);
  };

  // Login screen
  if (showLogin) {
    return (
      <div className={`${t.bg} min-h-screen flex items-center justify-center p-4`}>
        <div className={`${t.card} rounded-lg shadow-xl p-8 w-full max-w-md border ${t.border}`}>
          <h1 className={`${t.text} text-3xl font-bold mb-2 text-center`}>📻 Radio Rundown Pro</h1>
          <p className={`${t.textSecondary} text-center mb-8`}>Professioneel draaiboek beheer</p>
          <div className="space-y-4">
            {isRegistering && (
              <div>
                <label className={`block text-sm font-medium ${t.text} mb-1`}>Naam</label>
                <input 
                  type="text" 
                  value={loginForm.name} 
                  onChange={(e) => setLoginForm({...loginForm, name: e.target.value})} 
                  className={`w-full ${t.input} rounded px-3 py-2 border`} 
                />
              </div>
            )}
            <div>
              <label className={`block text-sm font-medium ${t.text} mb-1`}>Email</label>
              <input 
                type="email" 
                value={loginForm.email} 
                onChange={(e) => setLoginForm({...loginForm, email: e.target.value})} 
                className={`w-full ${t.input} rounded px-3 py-2 border`} 
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${t.text} mb-1`}>Wachtwoord</label>
              <input 
                type="password" 
                value={loginForm.password} 
                onChange={(e) => setLoginForm({...loginForm, password: e.target.value})} 
                className={`w-full ${t.input} rounded px-3 py-2 border`} 
                onKeyPress={(e) => e.key === 'Enter' && (isRegistering ? handleRegister() : handleLogin())} 
              />
            </div>
            <button 
              onClick={isRegistering ? handleRegister : handleLogin} 
              className={`w-full ${t.button} px-4 py-3 rounded-lg font-medium`}
            >
              {isRegistering ? 'Account aanmaken' : 'Inloggen'}
            </button>
            <button 
              onClick={() => setIsRegistering(!isRegistering)} 
              className={`w-full ${t.buttonSecondary} px-4 py-3 rounded-lg font-medium`}
            >
              {isRegistering ? 'Al een account? Inloggen' : 'Nog geen account? Registreren'}
            </button>
          </div>
          
          {/* Login Footer */}
          <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
            <div className={`text-xs ${t.textSecondary}`}>
              © {COPYRIGHT_YEAR} Landstede MBO. Alle rechten voorbehouden.
            </div>
            <div className={`text-xs ${t.textSecondary} mt-1`}>
              Radio Rundown Pro v{APP_VERSION} • Build: {BUILD_DATE}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentRunbook = rundowns.find(r => r.id === currentRundownId);

  return (
    <div className={`${t.bg} min-h-screen p-6`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className={`${t.card} rounded-lg p-6 mb-6 shadow border ${t.border}`}>
          <div className="flex justify-between mb-4">
            <div className="flex items-center gap-4">
              {editingRunbookName === currentRundownId ? (
                <input 
                  type="text" 
                  value={currentRunbook ? currentRunbook.name : ''} 
                  onChange={(e) => renameRunbook(currentRundownId, e.target.value)} 
                  onBlur={() => setEditingRunbookName(null)} 
                  onKeyPress={(e) => e.key === 'Enter' && setEditingRunbookName(null)} 
                  className={`text-2xl font-bold px-2 py-1 rounded border ${t.input}`} 
                  autoFocus 
                />
              ) : (
                <h1 
                  className={`text-2xl font-bold cursor-pointer hover:underline ${t.text}`} 
                  onClick={() => setEditingRunbookName(currentRundownId)}
                >
                  📻 {currentRunbook ? currentRunbook.name : 'Draaiboek'}
                </h1>
              )}
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} 
                className={`${t.buttonSecondary} p-2 rounded-lg`}
              >
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              </button>
              <button 
                onClick={handleLogout} 
                className={`${t.buttonSecondary} px-4 py-2 rounded-lg flex items-center gap-2`}
              >
                <LogOut size={16} />
                {currentUser?.email}
              </button>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-2 flex-wrap mb-3">
            <button 
              onClick={() => setShowRundownSelector(!showRundownSelector)} 
              className={`${t.button} px-4 py-2 rounded-lg flex items-center gap-2`}
            >
              <FolderOpen size={16} />
              Draaiboeken
            </button>
            <button 
              onClick={createNewRunbook} 
              className={`${t.button} px-4 py-2 rounded-lg flex items-center gap-2`}
            >
              <Plus size={16} />
              Nieuw
            </button>
            <button 
              onClick={() => setShowClock(!showClock)} 
              className={`${t.button} px-4 py-2 rounded-lg flex items-center gap-2 text-sm`}
            >
              🕐 {showClock ? 'Verberg Klok' : 'Toon Klok'}
            </button>
            <button 
              onClick={openClockWindow} 
              className={`${t.buttonSecondary} px-3 py-2 rounded-lg text-sm`}
            >
              📺 Popup Klok
            </button>
            <button 
              onClick={() => setShowPrintModal(true)} 
              className={`${t.buttonSecondary} px-3 py-2 rounded-lg text-sm`}
            >
              🖨️ Print
            </button>
            <button 
              onClick={() => setExpandedItems(new Set(items.map(i => i.id)))} 
              className={`${t.buttonSecondary} px-3 py-2 rounded-lg text-sm`}
            >
              ⬇️ Alles uit
            </button>
            <button 
              onClick={() => setExpandedItems(new Set())} 
              className={`${t.buttonSecondary} px-3 py-2 rounded-lg text-sm`}
            >
              ⬆️ Alles in
            </button>
          </div>
          
          {/* Quick add buttons */}
          <div className={`border-t pt-3 mb-2 ${t.border}`}>
            <div className="flex items-center justify-between mb-2">
              <div className={`text-xs font-semibold ${t.textSecondary}`}>ITEMS TOEVOEGEN:</div>
              <button 
                onClick={() => setShowItemTypeManager(true)}
                className={`${t.buttonSecondary} px-2 py-1 rounded text-xs`}
                title="Item types beheren"
              >
                <Settings size={12} />
              </button>
            </div>
            <div className="flex gap-2 flex-wrap">
              {userItemTypes.slice(0, 8).map(itemType => {
                console.log('🔄 Rendering quick-add button for:', itemType);
                return (
                  <button 
                    key={itemType.name}
                    onClick={() => quickAdd(itemType.name)} 
                    className={`${t.buttonSecondary} px-3 py-2 rounded text-sm`}
                    style={{ 
                      borderLeft: `3px solid ${itemType.color}`,
                    }}
                  >
                    {getItemTypeIcon(itemType.name)} {itemType.display_name}
                  </button>
                );
              })}
              {userItemTypes.length > 8 && (
                <button 
                  onClick={() => setShowAddForm(true)}
                  className={`${t.buttonSecondary} px-3 py-2 rounded text-sm`}
                >
                  + Meer...
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Rundown selector */}
        {showRundownSelector && (
          <div className={`${t.card} rounded-lg p-4 mb-6 shadow border ${t.border}`}>
            <h3 className={`font-bold mb-3 ${t.text}`}>Mijn Draaiboeken</h3>
            <div className="space-y-2">
              {rundowns.map(rb => (
                <div 
                  key={rb.id} 
                  className={`flex justify-between p-3 rounded ${rb.id === currentRundownId ? 'bg-blue-100 dark:bg-blue-900' : t.buttonSecondary}`}
                >
                  <button 
                    onClick={() => { setCurrentRundownId(rb.id); setShowRundownSelector(false); }} 
                    className="flex-1 text-left"
                  >
                    <div className={`font-medium ${t.text}`}>{rb.name}</div>
                    <div className={`text-sm ${t.textSecondary}`}>{rb.date}</div>
                  </button>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => duplicateRunbook(rb.id)} 
                      className={`${t.buttonSecondary} p-2 rounded`}
                    >
                      <Copy size={16} />
                    </button>
                    <button 
                      onClick={() => deleteRunbook(rb.id)} 
                      className={`${t.buttonSecondary} p-2 rounded hover:bg-red-100`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main content - dynamische layout */}
        <div className={`grid gap-6 ${showClock ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
          {/* Rundown list - krijgt volledige breedte als klok verborgen is */}
          <div className={`${t.card} rounded-lg p-6 shadow border ${t.border} ${!showClock ? 'lg:col-span-1' : ''}`}>
            <h2 className={`text-xl font-semibold mb-4 ${t.text}`}>Rundown</h2>
            <RundownList 
              items={items}
              expandedItems={expandedItems}
              dragOverIndex={dragOverIndex}
              theme={theme}
              formatTimeShort={formatTimeShort}
              formatTime={formatTime}
              getCumulativeTime={getCumulativeTime}
              toggleExpanded={toggleExpanded}
              setEditingItem={setEditingItem}
              deleteItem={deleteItem}
              handleDragStart={handleDragStart}
              handleDragOver={handleDragOver}
              handleDrop={handleDrop}
            />
          </div>

          {/* Clock - alleen tonen als showClock true is */}
          {showClock && (
            <div className={`${t.card} rounded-lg p-6 shadow border ${t.border}`}>
              <h2 className={`text-xl font-semibold mb-4 ${t.text}`}>Klok</h2>
              <Clock 
                items={items}
                currentTime={currentTime}
                isPlaying={isPlaying}
                setIsPlaying={setIsPlaying}
                theme={theme}
                formatTime={formatTime}
                formatTimeShort={formatTimeShort}
              />
            </div>
          )}
        </div>

        {/* Popup klok window */}
        {showClockWindow && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
            <div className={`${t.card} rounded-lg p-8 shadow-2xl max-w-2xl w-full`}>
              <div className="flex justify-between items-center mb-6">
                <h2 className={`text-2xl font-bold ${t.text}`}>🕐 Uitzending Klok</h2>
                <button 
                  onClick={() => setShowClockWindow(false)} 
                  className={`${t.buttonSecondary} px-4 py-2 rounded-lg`}
                >
                  Sluiten
                </button>
              </div>
              <Clock 
                items={items}
                currentTime={currentTime}
                isPlaying={isPlaying}
                setIsPlaying={setIsPlaying}
                theme={theme}
                formatTime={formatTime}
                formatTimeShort={formatTimeShort}
              />
            </div>
          </div>
        )}

        {/* Jingle editor modal */}
        {showJingleEditor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`${t.card} rounded-lg w-full max-w-md shadow-2xl`}>
              <div className={`p-6 border-b ${t.border}`}>
                <h3 className={`text-lg font-bold ${t.text}`}>🔔 Jingles</h3>
              </div>
              <div className="p-6">
                <div className="space-y-2 mb-4">
                  {jingles.map(jingle => (
                    <button 
                      key={jingle.id} 
                      onClick={() => { addJingle(jingle); setShowJingleEditor(false); }} 
                      className={`w-full text-left px-4 py-3 rounded-lg ${t.buttonSecondary} hover:bg-blue-100 dark:hover:bg-blue-900`}
                    >
                      <div className={`font-medium ${t.text}`}>{jingle.title}</div>
                      <div className={`text-xs ${t.textSecondary}`}>Duur: {formatTimeShort(jingle.duration)}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div className={`p-6 border-t flex gap-3 ${t.border}`}>
                <button 
                  onClick={() => setShowJingleEditor(false)} 
                  className={`${t.buttonSecondary} flex-1 px-4 py-2 rounded-lg`}
                >
                  Sluiten
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Print modal */}
        {showPrintModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`${t.card} p-6 rounded-lg w-96 shadow-2xl`}>
              <h3 className={`text-lg font-bold mb-4 ${t.text}`}>Printen</h3>
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
                    className={`${t.button} px-4 py-2 rounded flex-1`}
                  >
                    📄 Download TXT
                  </button>
                  <button 
                    onClick={() => setShowPrintModal(false)} 
                    className={`${t.buttonSecondary} px-4 py-2 rounded flex-1`}
                  >
                    Annuleren
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Forms */}
      {showAddForm && (
        <ItemForm 
          onSave={addItem} 
          onCancel={() => setShowAddForm(false)}
          theme={theme}
          formatTimeShort={formatTimeShort}
          parseTimeInput={parseTimeInput}
          isSearchingSpotify={isSearchingSpotify}
          setIsSearchingSpotify={setIsSearchingSpotify}
        />
      )}
      
      {editingItem && (
        <ItemForm 
          item={editingItem} 
          onSave={(updated) => updateItem(editingItem.id, updated)} 
          onCancel={() => setEditingItem(null)}
          theme={theme}
          formatTimeShort={formatTimeShort}
          parseTimeInput={parseTimeInput}
          isSearchingSpotify={isSearchingSpotify}
          setIsSearchingSpotify={setIsSearchingSpotify}
        />
      )}

      {/* Item Type Manager */}
      {showItemTypeManager && (
        <ItemTypeManager
          currentUser={currentUser}
          theme={theme}
          onClose={() => setShowItemTypeManager(false)}
          onItemTypesChanged={handleItemTypesChanged}
        />
      )}

      {/* Footer */}
      <footer className={`mt-8 py-4 border-t ${t.border}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
            <div className={`text-sm ${t.textSecondary}`}>
              © {COPYRIGHT_YEAR} Landstede MBO. Alle rechten voorbehouden.
            </div>
            <div className="flex items-center gap-4">
              <div className={`text-sm ${t.textSecondary}`}>
                Radio Rundown Pro v{APP_VERSION}
              </div>
              <div className={`text-xs ${t.textSecondary}`}>
                Build: {BUILD_DATE}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default RadioRundownPro;
