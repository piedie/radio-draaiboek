// src/App.jsx - Radio Rundown Pro v2.2 - Met Custom Item Types
import React, { useState, useRef, useEffect } from 'react';
import { Plus, Copy, LogOut, Moon, Sun, FolderOpen, Trash2, Settings, MessageSquare, Download } from 'lucide-react';
import { supabase } from './supabaseClient';
import Clock from './components/Clock';
import ItemForm from './components/ItemForm';
import ItemTypeManager from './components/ItemTypeManager';
import RundownList from './components/RundownList';
import { loadUserItemTypes, getItemTypeByName } from './utils/itemTypeManager';

// Versie informatie
const APP_VERSION = '3.1';
const BUILD_DATE = '2025-10-05';
const COPYRIGHT_YEAR = new Date().getFullYear();

// Live Dashboard Component (buiten hoofdcomponent gedefinieerd)
const LiveDashboard = ({ theme, liveTime, trafficData, newsData }) => {
  const t = theme === 'light' ? {
    text: 'text-gray-900',
    textSecondary: 'text-gray-600',
    card: 'bg-white',
    border: 'border-gray-200'
  } : {
    text: 'text-white',
    textSecondary: 'text-gray-400',
    card: 'bg-gray-800',
    border: 'border-gray-700'
  };

  return (
    <div className={`${t.card} rounded-lg p-4 shadow border ${t.border}`}>
      <div className={`text-xs font-medium mb-3 text-center ${t.textSecondary}`}>
        🔴 LIVE RADIO DASHBOARD
      </div>
      
      <div className="grid grid-cols-3 gap-4 items-center">
        {/* Links: Verkeersinformatie */}
        <div className="text-center">
          <div className={`text-xs font-medium mb-1 ${t.textSecondary}`}>
            🚗 VERKEER NL
          </div>
          <div className={`text-lg font-bold ${t.text}`}>
            {trafficData.loading ? (
              <span className="animate-pulse">...</span>
            ) : (
              `${trafficData.totalKm} km`
            )}
          </div>
          <div className={`text-xs ${t.textSecondary}`}>
            file totaal
          </div>
        </div>
        
        {/* Midden: Atoomtijd */}
        <div className="text-center">
          <div className={`text-xs font-medium mb-1 ${t.textSecondary}`}>
            ⏰ ATOOMTIJD
          </div>
          <div className={`text-3xl font-mono font-bold ${t.text} tracking-wider`} style={{
            fontFamily: 'Consolas, "Courier New", monospace',
            letterSpacing: '0.1em'
          }}>
            {liveTime || '00:00:00'}
          </div>
          <div className={`text-xs ${t.textSecondary}`}>
            CET/CEST
          </div>
        </div>
        
        {/* Rechts: Nieuws headlines */}
        <div className="text-center">
          <div className={`text-xs font-medium mb-1 ${t.textSecondary}`}>
            📰 NIEUWS
          </div>
          <div className="space-y-1">
            {newsData.loading ? (
              <div className="animate-pulse">
                <div className={`text-xs ${t.textSecondary}`}>Laden...</div>
              </div>
            ) : (
              newsData.headlines.map((headline, index) => (
                <div key={index} className={`text-xs ${t.text} truncate`} title={headline.title}>
                  {headline.title.substring(0, 25)}...
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

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
  
  // State voor item types
  const [userItemTypes, setUserItemTypes] = useState([]);
  const [showItemTypeManager, setShowItemTypeManager] = useState(false);
  
  // Feedback state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState('suggestion');
  
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [showJingleEditor, setShowJingleEditor] = useState(false);
  const [jingles, setJingles] = useState([]);
  const [isSearchingSpotify, setIsSearchingSpotify] = useState(false);

  // State voor live tijd weergave
  const [showLiveTime, setShowLiveTime] = useState(false);
  const [liveTime, setLiveTime] = useState('');
  const [ntpOffset, setNtpOffset] = useState(0);

  // State voor verkeer en nieuws data
  const [trafficData, setTrafficData] = useState({ totalKm: 0, loading: true });
  const [newsData, setNewsData] = useState({ headlines: [], loading: true });

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
    console.log('🔄 Loading items for runbook:', runbookId);
    const { data, error } = await supabase
      .from('items')
      .select('id, type, title, artist, notes, first_words, last_words, duration, position, color, connection_type, phone_number, spotify_track_id, spotify_preview_url, audio_url, has_scoreboard, user_item_type_id')
      .eq('runbook_id', runbookId)
      .order('position');
    
    if (error) {
      console.error('❌ Error loading items:', error);
      return;
    }
    
    console.log('📋 Raw items from database:', data);
    
    if (data) {
      console.log('📋 Setting items state:', data.length, 'items');
      data.forEach((item, index) => {
        console.log(`📋 Item ${index + 1}:`, {
          id: item.id,
          type: item.type,
          title: item.title,
          artist: item.artist,
          notes: item.notes ? 'HAS_NOTES' : 'NO_NOTES',
          first_words: item.first_words ? 'HAS_FIRST_WORDS' : 'NO_FIRST_WORDS'
        });
      });
      setItems(data);
    } else {
      console.log('📋 No items found for runbook');
      setItems([]);
    }
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
    console.log('🔄 Duplicating runbook:', runbookId);
    const original = rundowns.find(r => r.id === runbookId);
    if (!original) {
      console.error('❌ Original runbook not found');
      return;
    }
    
    try {
      // Maak nieuwe runbook
      const { data: newRunbook, error: runbookError } = await supabase.from('runbooks').insert([{
        user_id: currentUser.id, 
        name: original.name + ' (kopie)', 
        date: new Date().toISOString().split('T')[0]
      }]).select();
      
      if (runbookError) throw runbookError;
      console.log('✅ New runbook created:', newRunbook[0].id);
      
      if (newRunbook && newRunbook.length > 0) {
        // Haal alle items op van origineel runbook
        const { data: originalItems, error: itemsError } = await supabase
          .from('items')
          .select('id, type, title, artist, notes, first_words, last_words, duration, position, color, connection_type, phone_number, spotify_track_id, spotify_preview_url, audio_url, has_scoreboard, user_item_type_id')
          .eq('runbook_id', runbookId)
          .order('position');
        
        if (itemsError) {
          console.error('❌ Error fetching original items:', itemsError);
          throw itemsError;
        }
        
        console.log('📋 Found items to copy:', originalItems?.length || 0);
        console.log('📋 Original items:', originalItems);
        
        if (originalItems && originalItems.length > 0) {
          // Kopieer items met correcte positie
          const itemsCopy = originalItems.map((item, index) => {
            const newItem = { ...item };
            delete newItem.id; // Remove original ID
            delete newItem.created_at; // Remove original timestamp
            delete newItem.updated_at; // Remove original timestamp
            newItem.runbook_id = newRunbook[0].id;
            newItem.position = index; // Ensure correct position
            console.log(`📋 Copying item ${index + 1}:`, {
              type: newItem.type,
              title: newItem.title,
              position: newItem.position,
              runbook_id: newItem.runbook_id
            });
            return newItem;
          });
          
          console.log('📋 Items to insert:', itemsCopy.length);
          const { data: insertedItems, error: insertError } = await supabase
            .from('items')
            .insert(itemsCopy)
            .select();
          
          if (insertError) {
            console.error('❌ Error inserting items:', insertError);
            throw insertError;
          }
          
          console.log('✅ Items copied successfully:', insertedItems?.length || 0);
        }
        
        // Update de rundowns lijst
        setRundowns([newRunbook[0], ...rundowns]);
        setCurrentRundownId(newRunbook[0].id); // Switch to new runbook
        
        // Laad items voor display (met kleine delay voor database consistentie)
        setTimeout(() => {
          loadRunbookItems(newRunbook[0].id);
        }, 100);
        
        console.log('🎉 Runbook duplicated successfully');
        alert(`Draaiboek "${original.name}" succesvol gekopieerd!`);
      }
    } catch (error) {
      console.error('❌ Error duplicating runbook:', error);
      alert('Fout bij kopiëren van draaiboek: ' + error.message);
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

  // Feedback functions
  const submitFeedback = async () => {
    if (!feedback.trim()) return;
    
    console.log('🔄 Submitting feedback:', {
      user_id: currentUser?.id,
      user_email: currentUser?.email,
      type: feedbackType,
      message: feedback.trim().substring(0, 50) + '...'
    });
    
    try {
      const { data, error } = await supabase.from('feedback').insert([{
        user_id: currentUser.id,
        user_email: currentUser.email,
        type: feedbackType,
        message: feedback.trim()
      }]).select();
      
      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }
      
      console.log('✅ Feedback saved:', data);
      setFeedback('');
      setShowFeedbackModal(false);
      alert('Bedankt voor je feedback! 🙏');
    } catch (error) {
      console.error('❌ Feedback error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      
      // Meer specifieke error messages
      let errorMsg = 'Er ging iets mis bij het versturen van feedback.';
      if (error.message?.includes('permission')) {
        errorMsg = 'Geen toegang om feedback te versturen. Controleer je login status.';
      } else if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        errorMsg = 'Feedback tabel bestaat niet. Database migratie nodig.';
      }
      
      alert(errorMsg + '\n\nDetails: ' + error.message);
    }
  };

  // Test feedback table (debug functie)
  const testFeedbackTable = async () => {
    try {
      console.log('🔍 Testing feedback table...');
      const { data, error } = await supabase.from('feedback').select('id').limit(1);
      
      if (error) {
        console.error('❌ Feedback table test failed:', error);
        return false;
      }
      
      console.log('✅ Feedback table exists and accessible');
      return true;
    } catch (error) {
      console.error('❌ Feedback table test error:', error);
      return false;
    }
  };

  // Test copy functionality
  const testCopyFunction = async () => {
    if (!currentRundownId) {
      alert('Geen runbook geselecteerd');
      return;
    }
    
    console.log('🧪 Testing copy function for runbook:', currentRundownId);
    
    // Check current items
    const { data: currentItems } = await supabase
      .from('items')
      .select('*')
      .eq('runbook_id', currentRundownId)
      .order('position');
    
    console.log('📋 Current items in runbook:', currentItems?.length || 0, currentItems);
    
    // Trigger copy
    await duplicateRunbook(currentRundownId);
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

  // Format date to DD-MM-YYYY
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Timer effect - Accurate timing
  useEffect(() => {
    let startTime = null;
    let animationFrameId = null;
    
    if (isPlaying) {
      startTime = performance.now() - (currentTime * 1000);
      
      const updateTimer = () => {
        const now = performance.now();
        const elapsedSeconds = Math.floor((now - startTime) / 1000);
        
        if (elapsedSeconds !== currentTime) {
          setCurrentTime(prev => {
            const newTime = elapsedSeconds >= totalDuration ? totalDuration : elapsedSeconds;
            
            // Sync naar externe klok - inclusief items!
            localStorage.setItem('radio-clock-state', JSON.stringify({
              currentTime: newTime,
              isPlaying: newTime < totalDuration,
              totalDuration,
              items: items.map(item => ({
                id: item.id,
                title: item.title,
                type: item.type,
                duration: item.duration,
                color: item.color,
                artist: item.artist
              })),
              timestamp: Date.now()
            }));
            
            if (elapsedSeconds >= totalDuration) {
              setIsPlaying(false);
              return totalDuration;
            }
            
            return newTime;
          });
        }
        
        if (elapsedSeconds < totalDuration) {
          animationFrameId = requestAnimationFrame(updateTimer);
        } else {
          setIsPlaying(false);
        }
      };
      
      animationFrameId = requestAnimationFrame(updateTimer);
    }
    
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isPlaying, totalDuration]);

  // Sync klok status naar localStorage voor externe klok
  useEffect(() => {
    localStorage.setItem('radio-clock-state', JSON.stringify({
      currentTime,
      isPlaying,
      totalDuration,
      items: items.map(item => ({
        id: item.id,
        title: item.title,
        type: item.type,
        duration: item.duration,
        color: item.color,
        artist: item.artist
      })),
      timestamp: Date.now()
    }));
  }, [currentTime, isPlaying, totalDuration, items]);

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

  // Download alle draaiboeken als TXT bestanden
  const downloadAllRundowns = async () => {
    if (rundowns.length === 0) {
      alert('Geen draaiboeken om te downloaden');
      return;
    }

    try {
      console.log('📥 Starting bulk download of', rundowns.length, 'rundowns...');
      
      for (const rundown of rundowns) {
        // Haal items op voor dit runbook
        const { data: rundownItems, error } = await supabase
          .from('items')
          .select('*')
          .eq('runbook_id', rundown.id)
          .order('position');
        
        if (error) {
          console.error('Error loading items for rundown', rundown.id, error);
          continue;
        }

        // Bereken totale duur voor dit rundown
        const rundownTotalDuration = (rundownItems || []).reduce((sum, item) => sum + item.duration, 0);

        // Genereer content voor dit rundown
        let content = 'RADIO DRAAIBOEK\n================\n\n';
        content += 'Draaiboek: ' + rundown.name + '\n';
        content += 'Datum: ' + formatDate(rundown.date) + '\n';
        content += 'Totale duur: ' + formatTime(rundownTotalDuration) + '\n';
        content += 'Geëxporteerd: ' + new Date().toLocaleString('nl-NL') + '\n\n================\n\n';
        
        if (rundownItems && rundownItems.length > 0) {
          rundownItems.forEach((item, index) => {
            // Bereken cumulatieve tijd voor dit item
            const cumTime = rundownItems.slice(0, index + 1).reduce((sum, it) => sum + it.duration, 0);
            
            content += (index + 1) + '. [' + (item.type || 'ONBEKEND').toUpperCase() + '] ' + (item.title || 'Geen titel') + '\n';
            
            if (item.artist) content += '   Artiest: ' + item.artist + '\n';
            
            content += '   Duur: ' + formatTimeShort(item.duration) + ' | Totaal: ' + formatTime(cumTime) + '\n';
            
            if (item.connection_type) {
              content += '   Verbinding: ' + item.connection_type;
              if (item.phone_number && item.connection_type === 'Telefoon') {
                content += ' (' + item.phone_number + ')';
              }
              content += '\n';
            }
            
            // Volledige export - alle details
            if (item.first_words) content += '   EERSTE WOORDEN: ' + item.first_words + '\n';
            if (item.notes) content += '   HOOFDTEKST: ' + item.notes + '\n';
            if (item.last_words) content += '   LAATSTE WOORDEN: ' + item.last_words + '\n';
            
            // Extra velden voor specifieke item types
            if (item.spotify_track_id) content += '   Spotify ID: ' + item.spotify_track_id + '\n';
            if (item.audio_url) content += '   Audio URL: ' + item.audio_url + '\n';
            if (item.has_scoreboard) content += '   Scoreboard: Ja\n';
            
            content += '\n';
          });
        } else {
          content += '(Geen items in dit draaiboek)\n\n';
        }
        
        // Download dit bestand
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        // Maak een veilige bestandsnaam
        const safeName = rundown.name.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-');
        link.download = `draaiboek-${safeName}-${rundown.date}.txt`;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        // Kleine delay tussen downloads om browser niet te overbelasten
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      console.log('✅ Bulk download completed');
      alert(`${rundowns.length} draaiboeken succesvol gedownload!`);
      
    } catch (error) {
      console.error('❌ Error during bulk download:', error);
      alert('Fout bij downloaden: ' + error.message);
    }
  };

  // NTP tijd functionaliteit
  const fetchNTPTime = async () => {
    try {
      // Gebruik WorldTimeAPI voor nauwkeurige tijd
      const response = await fetch('https://worldtimeapi.org/api/timezone/Europe/Amsterdam');
      const data = await response.json();
      const serverTime = new Date(data.datetime);
      const localTime = new Date();
      const offset = serverTime.getTime() - localTime.getTime();
      setNtpOffset(offset);
      console.log('🕐 NTP offset calculated:', offset, 'ms');
    } catch (error) {
      console.error('Failed to fetch NTP time:', error);
      // Fallback: gebruik lokale tijd
      setNtpOffset(0);
    }
  };

  const updateLiveTime = () => {
    const now = new Date(Date.now() + ntpOffset);
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    setLiveTime(`${hours}:${minutes}:${seconds}`);
  };

  // Live tijd effect
  useEffect(() => {
    let liveTimeInterval;
    let dataRefreshInterval;
    
    if (showLiveTime) {
      // Haal NTP tijd op bij het activeren
      fetchNTPTime();
      
      // Haal verkeer en nieuws data op
      fetchTrafficData();
      fetchNewsData();
      
      // Update elke seconde
      liveTimeInterval = setInterval(updateLiveTime, 1000);
      updateLiveTime(); // Eerste update direct
      
      // Refresh verkeer en nieuws elke 5 minuten
      dataRefreshInterval = setInterval(() => {
        fetchTrafficData();
        fetchNewsData();
      }, 5 * 60 * 1000);
    }
    
    return () => {
      if (liveTimeInterval) {
      if (liveTimeInterval) {eInterval);
        clearInterval(liveTimeInterval);
      }f (dataRefreshInterval) {
      if (dataRefreshInterval) {hInterval);
        clearInterval(dataRefreshInterval);
      }
    };showLiveTime, ntpOffset]);
  }, [showLiveTime, ntpOffset]);
  // Verkeer data ophalen (NDW - Nationale Databank Wegverkeergegevens)
  // Verkeer data ophalen (NDW - Nationale Databank Wegverkeergegevens)
  const fetchTrafficData = async () => {
    try {Voor nu gebruiken we realistische mock data
      // Voor nu gebruiken we realistische mock datanformatie API of OpenTraffic gebruiken
      // In productie kun je NDW API, ANWB Verkeersinformatie API of OpenTraffic gebruiken
      const baseKm = 80 + Math.sin(Date.now() / 3600000) * 50; // Cyclische variatie
      const randomVariation = Math.random() * 40 - 20; // ±20 km variatie
      const totalKm = Math.max(0, Math.round(baseKm + randomVariation));
      setTrafficData({ totalKm, loading: false });
      setTrafficData({ totalKm, loading: false });lKm, 'km');
      console.log('🚗 Traffic data updated:', totalKm, 'km');
    } catch (error) {Failed to fetch traffic data:', error);
      console.error('Failed to fetch traffic data:', error);
      setTrafficData({ totalKm: 0, loading: false });
    }
  };
  // Nieuws data ophalen via Nu.nl RSS (via RSS2JSON proxy)
  // Nieuws data ophalen via Nu.nl RSS (via RSS2JSON proxy)
  const fetchNewsData = async () => {
    try {Gebruik RSS2JSON API voor CORS-vriendelijke RSS parsing
      // Gebruik RSS2JSON API voor CORS-vriendelijke RSS parsingapi.json?rss_url=https://www.nu.nl/rss/Algemeen');
      const response = await fetch('https://api.rss2json.com/v1/api.json?rss_url=https://www.nu.nl/rss/Algemeen');
      const data = await response.json();
      if (data.status === 'ok' && data.items) {
      if (data.status === 'ok' && data.items) {).map(item => ({
        const headlines = data.items.slice(0, 3).map(item => ({
          title: item.title,
          link: item.link,bDate
          pubDate: item.pubDate
        }));ewsData({ headlines, loading: false });
        setNewsData({ headlines, loading: false });
      } else {new Error('Invalid RSS response');
        throw new Error('Invalid RSS response');
      }atch (error) {
    } catch (error) {Failed to fetch news data:', error);
      console.error('Failed to fetch news data:', error);
      // Fallback mock data
      setNewsData({ 
        headlines: [Nieuws laden...', link: '#', pubDate: new Date().toISOString() }
          { title: 'Nieuws laden...', link: '#', pubDate: new Date().toISOString() }
        ], ding: false 
        loading: false 
      });
    }
  };
  // Login screen
  // Monitor items state changes{
  useEffect(() => {
    console.log('🔄 Items state changed:', items.length, 'items');lassName={`${t.bg} min-h-screen flex items-center justify-center p-4`}>
    if (items.length > 0) {${t.border}`}>
      console.log('📋 First item sample:', {
        id: items[0].id,me="flex justify-center mb-6">
        type: items[0].type,
        title: items[0].title,="/logo.svg" 
        artist: items[0].artist,wn Pro Logo" 
        notes: items[0].notes ? 'HAS_NOTES' : 'NO_NOTES',
        first_words: items[0].first_words ? 'HAS_FIRST_WORDS' : 'NO_FIRST_WORDS'
      });v>
    }assName={`${t.text} text-3xl font-bold mb-2 text-center`}>📻 Radio Rundown Pro</h1>
  }, [items]);

  // Login screen
  if (showLogin) {
    return (bel className={`block text-sm font-medium ${t.text} mb-1`}>Naam</label>
      <div className={`${t.bg} min-h-screen flex items-center justify-center p-4`}>
        <div className={`${t.card} rounded-lg shadow-xl p-8 w-full max-w-md border ${t.border}`}>"text" 
          {/* Logo */}Form.name} 
          <div className="flex justify-center mb-6">inForm({...loginForm, name: e.target.value})} 
            <img 
              src="/logo.svg" 
              alt="Radio Rundown Pro Logo" v>
              className="w-24 h-24"
            />iv>
          </div>bel className={`block text-sm font-medium ${t.text} mb-1`}>Email</label>
          <h1 className={`${t.text} text-3xl font-bold mb-2 text-center`}>📻 Radio Rundown Pro</h1>
          <p className={`${t.textSecondary} text-center mb-8`}>Professioneel draaiboek beheer</p>"email" 
          <div className="space-y-4">orm.email} 
            {isRegistering && (nForm({...loginForm, email: e.target.value})} 
              <div>
                <label className={`block text-sm font-medium ${t.text} mb-1`}>Naam</label>
                <input v>
                  type="text" 
                  value={loginForm.name} bel className={`block text-sm font-medium ${t.text} mb-1`}>Wachtwoord</label>
                  onChange={(e) => setLoginForm({...loginForm, name: e.target.value})} 
                  className={`w-full ${t.input} rounded px-3 py-2 border`} "password" 
                />.password} 
              </div>rm({...loginForm, password: e.target.value})} 
            )}
            <div>handleRegister() : handleLogin())} 
              <label className={`block text-sm font-medium ${t.text} mb-1`}>Email</label>
              <input v>
                type="email" n 
                value={loginForm.email} k={isRegistering ? handleRegister : handleLogin} 
                onChange={(e) => setLoginForm({...loginForm, email: e.target.value})} t-medium`}
                className={`w-full ${t.input} rounded px-3 py-2 border`} 
              /> {isRegistering ? 'Account aanmaken' : 'Inloggen'}
            </div>
            <div>
              <label className={`block text-sm font-medium ${t.text} mb-1`}>Wachtwoord</label>k={() => setIsRegistering(!isRegistering)} 
              <input  rounded-lg font-medium`}
                type="password" 
                value={loginForm.password}  {isRegistering ? 'Al een account? Inloggen' : 'Nog geen account? Registreren'}
                onChange={(e) => setLoginForm({...loginForm, password: e.target.value})} 
                className={`w-full ${t.input} rounded px-3 py-2 border`} 
                onKeyPress={(e) => e.key === 'Enter' && (isRegistering ? handleRegister() : handleLogin())} 
              />{/* Login Footer */}
            </div> pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
            <button 
              onClick={isRegistering ? handleRegister : handleLogin} en voorbehouden.
              className={`w-full ${t.button} px-4 py-3 rounded-lg font-medium`}
            >lassName={`text-xs ${t.textSecondary} mt-1`}>
              {isRegistering ? 'Account aanmaken' : 'Inloggen'}DATE}
            </button>
            <button 
              onClick={() => setIsRegistering(!isRegistering)} 
              className={`w-full ${t.buttonSecondary} px-4 py-3 rounded-lg font-medium`}
            >
              {isRegistering ? 'Al een account? Inloggen' : 'Nog geen account? Registreren'}
            </button>
          </div>  const currentRunbook = rundowns.find(r => r.id === currentRundownId);
          
          {/* Login Footer */}  return (
          <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">lassName={`${t.bg} min-h-screen p-6`}>
            <div className={`text-xs ${t.textSecondary}`}>
              © {COPYRIGHT_YEAR} Landstede MBO. Alle rechten voorbehouden.
            </div>={`${t.card} rounded-lg p-6 mb-6 shadow border ${t.border}`}>
            <div className={`text-xs ${t.textSecondary} mt-1`}>
              Radio Rundown Pro v{APP_VERSION} - Build: {BUILD_DATE}
            </div>d ? (
          </div>
        </div>"text" 
      </div>ntRunbook ? currentRunbook.name : ''} 
    );.target.value)} 
  }
EditingRunbookName(null)} 
  const currentRunbook = rundowns.find(r => r.id === currentRundownId);

  return (
    <div className={`${t.bg} min-h-screen p-6`}>(
      <div className="max-w-7xl mx-auto"> 
        {/* Header */}assName={`text-2xl font-bold cursor-pointer hover:underline ${t.text}`} 
        <div className="flex justify-between items-center mb-6">
          <div>
            {editingRunbookName === currentRundownId ? ( 📻 {currentRunbook ? currentRunbook.name : 'Draaiboek'}
              <input 
                type="text" 
                value={rundowns.find(r => r.id === currentRundownId)?.name || ''} v>
                onChange={(e) => {lassName="flex gap-3">
                  const newName = e.target.value;
                  setRundowns(rundowns.map(r => r.id === currentRundownId ? {...r, name: newName} : r));k={() => setTheme(theme === 'light' ? 'dark' : 'light')} 
                }} 
                onBlur={() => {
                  const newName = rundowns.find(r => r.id === currentRundownId)?.name; {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                  if (newName) renameRunbook(currentRundownId, newName);
                  setEditingRunbookName(null);
                }} k={() => setShowFeedbackModal(true)} 
                onKeyPress={(e) => {text-white p-2 rounded-lg transition-colors"
                  if (e.key === 'Enter') {
                    const newName = rundowns.find(r => r.id === currentRundownId)?.name;
                    if (newName) renameRunbook(currentRundownId, newName); <MessageSquare size={20} />
                    setEditingRunbookName(null);
                  }
                }} k={handleLogout} 
                className={`text-2xl font-bold bg-transparent border-b-2 border-blue-500 ${t.text}`} econdary} px-4 py-2 rounded-lg flex items-center gap-2`}
                autoFocus 
              /> <LogOut size={16} />
            ) : (
              <h1 
                className={`text-2xl font-bold cursor-pointer hover:underline ${t.text}`} 
                onClick={() => setEditingRunbookName(currentRundownId)}
              >
                📻 {currentRunbook ? currentRunbook.name : 'Draaiboek'}{/* Action buttons */}
              </h1>ap-2 flex-wrap mb-3">
            )}
          </div>k={() => setShowRundownSelector(!showRundownSelector)} 
          <div className="flex gap-3">r gap-2`}
            <button 
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}  <FolderOpen size={16} />
              className={`${t.buttonSecondary} p-2 rounded-lg`}
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>k={createNewRunbook} 
            <button 4 py-2 rounded-lg flex items-center gap-2`}
              onClick={() => setShowFeedbackModal(true)} 
              className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition-colors" <Plus size={16} />
              title="Feedback & Suggesties"
            >n>
              <MessageSquare size={20} />
            </button>k={() => setShowClock(!showClock)} 
            <button -lg flex items-center gap-2 text-sm`}
              onClick={handleLogout} 
              className={`${t.buttonSecondary} px-4 py-2 rounded-lg flex items-center gap-2`} 🕐 {showClock ? 'Verberg klok' : 'Toon klok'}
            >
              <LogOut size={16} />
              {currentUser?.email}k={() => window.open('/clock.html', '_blank')} 
            </button> text-sm`}
          </div>
        </div> 📺 Externe klok

        <div className={`${t.card} rounded-lg p-6 shadow border ${t.border}`}>
          <div className="flex justify-between items-center mb-6">k={() => setShowLiveTime(!showLiveTime)} 
            <button r:bg-green-600 text-white' : t.buttonSecondary} px-3 py-2 rounded-lg text-sm transition-colors`}
              onClick={() => setShowRundownSelector(!showRundownSelector)} 
              className={`${t.buttonSecondary} px-4 py-2 rounded-lg flex items-center gap-2`}
            > 🔴 Live
              <FolderOpen size={16} />
              Mijn draaiboeken
            </button>k={() => setShowPrintModal(true)} 
            <button -2 rounded-lg text-sm`}
              onClick={createNewRunbook} 
              className={`${t.button} px-4 py-2 rounded-lg flex items-center gap-2`} 🖨️ Print
            >
              <Plus size={16} />
              Nieuwk={() => setExpandedItems(new Set(items.map(i => i.id)))} 
            </button>
            <button 
              onClick={() => setShowClock(!showClock)}  ⬇️ Alles uit
              className={`${t.button} px-4 py-2 rounded-lg flex items-center gap-2 text-sm`}
            >
              🕐 {showClock ? 'Verberg klok' : 'Toon klok'}k={() => setExpandedItems(new Set())} 
            </button>ounded-lg text-sm`}
            <button 
              onClick={() => window.open('/clock.html', '_blank')}  ⬆️ Alles in
              className={`${t.buttonSecondary} px-3 py-2 rounded-lg text-sm`}
            >
              📺 Externe klok
            </button>{/* Quick add buttons */}
            <button  pt-3 mb-2 ${t.border}`}>
              onClick={() => setShowLiveTime(!showLiveTime)} textSecondary}`}>ITEMS TOEVOEGEN:</div>
              className={`${showLiveTime ? 'bg-green-500 hover:bg-green-600 text-white' : t.buttonSecondary} px-3 py-2 rounded-lg text-sm transition-colors`}
              title="Live atoomtijd weergave"
            > for:', itemType);
              🔴 Live
            </button>n 
            <button temType.name}
              onClick={() => setShowPrintModal(true)} kAdd(itemType.name)} 
              className={`${t.buttonSecondary} px-3 py-2 rounded-lg text-sm`}-2 rounded text-sm`}
            >
              🖨️ Printeft: `3px solid ${itemType.color}`,
            </button>
            <button 
              onClick={() => setExpandedItems(new Set(items.map(i => i.id)))}  {getItemTypeIcon(itemType.name)} {itemType.display_name}
              className={`${t.buttonSecondary} px-3 py-2 rounded-lg text-sm`}
            >
              ⬇️ Alles uit
            </button>erItemTypes.length > 8 && (
            <button 
              onClick={() => setExpandedItems(new Set())} k={() => setShowAddForm(true)}
              className={`${t.buttonSecondary} px-3 py-2 rounded-lg text-sm`}3 py-2 rounded text-sm`}
            >
              ⬆️ Alles in + Meer...
            </button>
          </div>
          * Tandwieltje aan het einde van de knoppenrij */}
          {/* Quick add buttons */}
          <div className={`border-t pt-3 mb-2 ${t.border}`}>k={() => setShowItemTypeManager(true)}
            <div className={`text-sm font-semibold mb-2 ${t.textSecondary}`}>ITEMS TOEVOEGEN:</div>ounded text-sm flex items-center ml-auto`}
            <div className="flex gap-2 flex-wrap items-center">
              {userItemTypes.slice(0, 8).map(itemType => {
                console.log('🔄 Rendering quick-add button for:', itemType); <Settings size={16} />
                return (
                  <button 
                    key={itemType.name}
                    onClick={() => quickAdd(itemType.name)} 
                    className={`${t.buttonSecondary} px-3 py-2 rounded text-sm`}
                    style={{         {/* Rundown selector */}
                      borderLeft: `3px solid ${itemType.color}`,(
                    }}rd} rounded-lg p-4 mb-6 shadow border ${t.border}`}>
                  >
                    {getItemTypeIcon(itemType.name)} {itemType.display_name}</h3>
                  </button>
                );k={downloadAllRundowns}
              })}py-1 rounded-lg text-sm flex items-center gap-2`}
              {userItemTypes.length > 8 && (
                <button 
                  onClick={() => setShowAddForm(true)} <Download size={16} />
                  className={`${t.buttonSecondary} px-3 py-2 rounded text-sm`}
                >
                  + Meer...
                </button>lassName="space-y-2">
              )}
              {/* Tandwieltje aan het einde van de knoppenrij */}
              <button ={rb.id} 
                onClick={() => setShowItemTypeManager(true)}flex justify-between p-3 rounded ${rb.id === currentRundownId ? 'bg-blue-100 dark:bg-blue-900' : t.buttonSecondary}`}
                className={`${t.buttonSecondary} px-3 py-2 rounded text-sm flex items-center ml-auto`}
                title="Item types beheren" <button 
              >k={() => { setCurrentRundownId(rb.id); setShowRundownSelector(false); }} 
                <Settings size={16} />
              </button>
            </div> <div className={`font-medium ${t.text}`}>{rb.name}</div>
          </div>e(rb.date)}</div>
        </div>
sName="flex gap-2">
        {/* Rundown selector */}
        {showRundownSelector && (k={() => duplicateRunbook(rb.id)} 
          <div className={`${t.card} rounded-lg p-4 mb-6 shadow border ${t.border}`}>nded`}
            <div className="flex justify-between items-center mb-3">
              <h3 className={`font-bold ${t.text}`}>Mijn draaiboeken</h3> <Copy size={16} />
              <button 
                onClick={downloadAllRundowns}
                className={`${t.button} px-3 py-1 rounded-lg text-sm flex items-center gap-2`}k={() => deleteRunbook(rb.id)} 
                title="Download alle draaiboeken als TXT bestanden"rounded hover:bg-red-100`}
              >
                <Download size={16} /> <Trash2 size={16} />
                Download alle
              </button>
            </div>
            <div className="space-y-2">
              {rundowns.map(rb => (>
                <div 
                  key={rb.id} 
                  className={`flex justify-between p-3 rounded ${rb.id === currentRundownId ? 'bg-blue-100 dark:bg-blue-900' : t.buttonSecondary}`}
                >        {/* Main content - dynamische layout */}
                  <button ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
                    onClick={() => { setCurrentRundownId(rb.id); setShowRundownSelector(false); }} 
                    className="flex-1 text-left"
                  > de rundown kolom als klok verborgen is */}
                    <div className={`font-medium ${t.text}`}>{rb.name}</div>
                    <div className={`text-sm ${t.textSecondary}`}>{formatDate(rb.date)}</div>
                  </button>
                  <div className="flex gap-2">eTime}
                    <button cData}
                      onClick={() => duplicateRunbook(rb.id)} 
                      className={`${t.buttonSecondary} p-2 rounded`}
                    >
                      <Copy size={16} />
                    </button>{/* Rundown list */}
                    <button .card} rounded-lg p-6 shadow border ${t.border}`}>
                      onClick={() => deleteRunbook(rb.id)} 
                      className={`${t.buttonSecondary} p-2 rounded hover:bg-red-100`}
                    >s}
                      <Trash2 size={16} />={expandedItems}
                    </button>
                  </div>
                </div>rt={formatTimeShort}
              ))}
            </div>umulativeTime}
          </div>
        )}

        {/* Main content - dynamische layout */}DragStart}
        <div className={`grid gap-6 ${showClock ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
          {/* Linker kolom: Rundown met eventuele live tijd */}
          <div className="space-y-6">
            {/* Live dashboard binnen de rundown kolom als klok verborgen is */}v>
            {showLiveTime && !showClock && (
              <LiveDashboard 
                theme={theme}          {/* Rechter kolom: Klok met eventuele live tijd */}
                liveTime={liveTime}
                trafficData={trafficData}e="space-y-6">
                newsData={newsData} de klok kolom als klok zichtbaar is */}
              />
            )}
            
            {/* Rundown list */}eTime}
            <div className={`${t.card} rounded-lg p-6 shadow border ${t.border}`}>cData}
              <h2 className={`text-xl font-semibold mb-4 ${t.text}`}>Rundown</h2>
              <RundownList 
                items={items}
                expandedItems={expandedItems}
                dragOverIndex={dragOverIndex}{/* Radio klok */}
                theme={theme}{t.card} rounded-lg p-6 shadow border ${t.border}`}>
                formatTimeShort={formatTimeShort}
                formatTime={formatTime}
                getCumulativeTime={getCumulativeTime}={items}
                toggleExpanded={toggleExpanded}currentTime}
                setEditingItem={setEditingItem}
                deleteItem={deleteItem}aying}
                handleDragStart={handleDragStart}
                handleDragOver={handleDragOver}ormatTime}
                handleDrop={handleDrop}TimeShort}
              />
            </div>v>
          </div>

          {/* Rechter kolom: Klok met eventuele live tijd */}v>
          {showClock && (
            <div className="space-y-6">        {/* Jingle editor modal */}
              {/* Live dashboard binnen de klok kolom als klok zichtbaar is */}
              {showLiveTime && (d inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <LiveDashboard 
                  theme={theme}
                  liveTime={liveTime}}`}>🔔 Jingles</h3>
                  trafficData={trafficData}
                  newsData={newsData}lassName="p-6">
                />ce-y-2 mb-4">
              )}
              
              {/* Radio klok */}ingle.id} 
              <div className={`${t.card} rounded-lg p-6 shadow border ${t.border}`}> addJingle(jingle); setShowJingleEditor(false); }} 
                <h2 className={`text-xl font-semibold mb-4 ${t.text}`}>Klok</h2>ry} hover:bg-blue-100 dark:hover:bg-blue-900`}
                <Clock 
                  items={items} <div className={`font-medium ${t.text}`}>{jingle.title}</div>
                  currentTime={currentTime}meShort(jingle.duration)}</div>
                  isPlaying={isPlaying}
                  setIsPlaying={setIsPlaying}
                  theme={theme}>
                  formatTime={formatTime}
                  formatTimeShort={formatTimeShort}lassName={`p-6 border-t flex gap-3 ${t.border}`}>
                />
              </div>k={() => setShowJingleEditor(false)} 
            </div>4 py-2 rounded-lg`}
          )}
        </div> Sluiten

        {/* Jingle editor modal */}
        {showJingleEditor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`${t.card} rounded-lg w-full max-w-md shadow-2xl`}>
              <div className={`p-6 border-b ${t.border}`}>
                <h3 className={`text-lg font-bold ${t.text}`}>🔔 Jingles</h3>        {/* Print modal */}
              </div>(
              <div className="p-6">xed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="space-y-2 mb-4">
                  {jingles.map(jingle => (</h3>
                    <button 
                      key={jingle.id} 
                      onClick={() => { addJingle(jingle); setShowJingleEditor(false); }} bel className="flex items-center mb-2">
                      className={`w-full text-left px-4 py-3 rounded-lg ${t.buttonSecondary} hover:bg-blue-100 dark:hover:bg-blue-900`}
                    >"radio" 
                      <div className={`font-medium ${t.text}`}>{jingle.title}</div>tMode === 'rundown'} 
                      <div className={`text-xs ${t.textSecondary}`}>Duur: {formatTimeShort(jingle.duration)}</div>own')} 
                    </button>
                  ))}
                </div>pan className={t.text}>Rundown (kort)</span>
              </div>
              <div className={`p-6 border-t flex gap-3 ${t.border}`}>lassName="flex items-center">
                <button 
                  onClick={() => setShowJingleEditor(false)} "radio" 
                  className={`${t.buttonSecondary} flex-1 px-4 py-2 rounded-lg`}tMode === 'full'} 
                >ull')} 
                  Sluiten
                </button>
              </div>pan className={t.text}>Volledig draaiboek</span>
            </div>
          </div>
        )}lassName="flex gap-2">

        {/* Print modal */}k={printRundown} 
        {showPrintModal && ( px-4 py-2 rounded flex-1`}
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`${t.card} p-6 rounded-lg shadow-xl max-w-md w-full mx-4`}> 📄 Download TXT
              <h3 className={`text-lg font-bold mb-4 ${t.text}`}>Printen</h3>
              <div className="space-y-3 mb-6">
                <label className="flex items-center">k={() => setShowPrintModal(false)} 
                  <input 2 rounded flex-1`}
                    type="radio" 
                    name="printMode"  Annuleren
                    checked={printMode === 'rundown'} 
                    onChange={() => setPrintMode('rundown')} 
                    className="mr-2" 
                  />
                  <span className={t.text}>Rundown (kort)</span>
                </label>
                <label className="flex items-center">v>
                  <input 
                    type="radio"       {/* Forms */}
                    name="printMode" && (
                    checked={printMode === 'full'} 
                    onChange={() => setPrintMode('full')} addItem} 
                    className="mr-2" etShowAddForm(false)}
                  />
                  <span className={t.text}>Volledig draaiboek</span>rt={formatTimeShort}
                </label>
              </div>Spotify}
              <div className="flex gap-3">otify}
                <button 
                  onClick={printRundown} 
                  className={`${t.button} flex-1 px-4 py-2 rounded-lg`}
                >{editingItem && (
                  Download
                </button>itingItem} 
                <button > updateItem(editingItem.id, updated)} 
                  onClick={() => setShowPrintModal(false)} 
                  className={`${t.buttonSecondary} flex-1 px-4 py-2 rounded-lg`}
                >rt={formatTimeShort}
                  Annuleren
                </button>Spotify}
              </div>otify}
            </div>
          </div>
        )}
      </div>      {/* Item Type Manager */}

      {/* Footer */}
      <footer className={`mt-8 py-4 border-t ${t.border}`}>urrentUser}
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2">> setShowItemTypeManager(false)}
            <div className={`text-sm ${t.textSecondary}`}>
              © {COPYRIGHT_YEAR} Landstede MBO. Alle rechten voorbehouden.
            </div>
            <div className="flex items-center gap-4">
              {/* Debug knoppen - alleen in development */}      {/* Footer */}
              <button ame={`mt-8 py-4 border-t ${t.border}`}>
                onClick={debugCurrentItems}
                className={`text-xs px-2 py-1 rounded ${t.buttonSecondary} opacity-50 hover:opacity-100`}row justify-between items-center gap-2">
                title="Debug huidige items"
              >en voorbehouden.
                🔍 Debug Items
              </button>lassName="flex items-center gap-4">
              <button nt */}
                onClick={testCopyFunction}
                className={`text-xs px-2 py-1 rounded ${t.buttonSecondary} opacity-50 hover:opacity-100`}k={debugCurrentItems}
                title="Test kopiëerfunctie"-1 rounded ${t.buttonSecondary} opacity-50 hover:opacity-100`}
              >
                🧪 Test Copy
              </button> 🔍 Debug Items
              <div className={`text-sm ${t.textSecondary}`}>
                Radio Rundown Pro v{APP_VERSION}
              </div>k={testCopyFunction}
              <div className={`text-xs ${t.textSecondary}`}>y-1 rounded ${t.buttonSecondary} opacity-50 hover:opacity-100`}
                Build: {BUILD_DATE}
              </div>
            </div> 🧪 Test Copy
          </div>
        </div>sName={`text-sm ${t.textSecondary}`}>
      </footer>
      
      {/* Feedback Modal */}lassName={`text-xs ${t.textSecondary}`}>
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${t.card} p-6 rounded-lg shadow-xl max-w-md w-full mx-4`}>
            <h3 className={`text-lg font-bold mb-4 ${t.text}`}>💬 Feedback & Suggesties</h3>
            
            <div className="mb-4">>
              <label className={`block text-sm mb-2 ${t.text}`}>Type feedback:</label>
              <select {/* Feedback Modal */}
                value={feedbackType} (
                onChange={(e) => setFeedbackType(e.target.value)} inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                className={`w-full px-3 py-2 rounded border ${t.input}`}
              >/h2>
                <option value="suggestion">💡 Suggestie</option>
                <option value="bug">🐛 Bug report</option><div className="mb-4">
                <option value="feature">🚀 Feature request</option>lock text-sm mb-2 ${t.text}`}>Type feedback:</label>
                <option value="other">💬 Overig</option>
              </select>{feedbackType} 
            </div>eedbackType(e.target.value)}
            nput}`}
            <div className="mb-4">
              <label className={`block text-sm mb-2 ${t.text}`}>Je bericht:</label> <option value="suggestion">💡 Suggestie</option>
              <textarea 
                value={feedback} </option>
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Beschrijf je feedback, suggestie of probleem..."
                className={`w-full px-3 py-2 rounded border h-32 ${t.input}`}
              />
            </div><div className="mb-4">
            lock text-sm mb-2 ${t.text}`}>Je bericht:</label>
            <div className="flex gap-3 justify-end">
              <button eedback} 
                onClick={testFeedbackTable}setFeedback(e.target.value)}
                className={`${t.buttonSecondary} px-3 py-2 rounded-lg text-xs`} of probleem..."
                title="Test database verbinding"
              >
                🔍 Testv>
              </button>
              <button <div className="flex gap-3 justify-end">
                onClick={() => {
                  setShowFeedbackModal(false);k={testFeedbackTable}
                  setFeedback('');dary} px-3 py-2 rounded-lg text-xs`}
                }}
                className={`${t.buttonSecondary} px-4 py-2 rounded-lg`}
              > 🔍 Test
                Annuleren
              </button>
              <button k={() => {
                onClick={submitFeedback}kModal(false);
                disabled={!feedback.trim()}
                className={`${t.button} px-4 py-2 rounded-lg disabled:opacity-50`}
              >assName={`${t.buttonSecondary} px-4 py-2 rounded-lg`}
                Versturen
              </button> Annuleren
            </div>
          </div>
        </div>k={submitFeedback}
      )}()}
    </div>4 py-2 rounded-lg disabled:opacity-50`}
  );
}; Versturen

export default RadioRundownPro;

// Debug functie om items te inspecteren
  const debugCurrentItems = async () => {
    if (!currentRundownId) {v>
      console.log('❌ No current rundown selected');
      return;
    }
    export default RadioRundownPro;
    console.log('🔍 Debugging items for runbook:', currentRundownId);
    // Debug functie om items te inspecteren
    // Haal direct uit database{
    const { data: dbItems, error } = await supabase
      .from('items')ent rundown selected');
      .select('*')
      .eq('runbook_id', currentRundownId)
      .order('position');
    console.log('🔍 Debugging items for runbook:', currentRundownId);
    console.log('📊 Raw database items:', dbItems);
    console.log('📊 Current state items:', items);// Haal direct uit database
    r } = await supabase
    if (dbItems) {
      dbItems.forEach((item, index) => {
        console.log(`Item ${index + 1}:`, {_id', currentRundownId)
          id: item.id,
          type: item.type,
          title: item.title,console.log('📊 Raw database items:', dbItems);
          artist: item.artist,
          notes: item.notes,
          first_words: item.first_words,if (dbItems) {
          last_words: item.last_words,ach((item, index) => {
          duration: item.duration,, {
          position: item.position
        });ype,
      });e,
    }t,
    
    if (error) {first_words,
      console.error('❌ Error fetching debug items:', error);
    }
  };

  // Monitor items state changes
  useEffect(() => {
    console.log('🔄 Items state changed:', items.length, 'items');
    if (items.length > 0) {if (error) {
      console.log('📋 First item sample:', {ror('❌ Error fetching debug items:', error);
        id: items[0].id,
        type: items[0].type,
        title: items[0].title,
        artist: items[0].artist,  // Monitor items state changes
        notes: items[0].notes ? 'HAS_NOTES' : 'NO_NOTES',
        first_words: items[0].first_words ? 'HAS_FIRST_WORDS' : 'NO_FIRST_WORDS' Items state changed:', items.length, 'items');
      });
    } item sample:', {
  }, [items]);
ype,
  // Login screene,
  if (showLogin) {t,
    return ('HAS_NOTES' : 'NO_NOTES',
      <div className={`${t.bg} min-h-screen flex items-center justify-center p-4`}>RDS' : 'NO_FIRST_WORDS'
        <div className={`${t.card} rounded-lg shadow-xl p-8 w-full max-w-md border ${t.border}`}>
          {/* Logo */}
          <div className="flex justify-center mb-6">[items]);
            <img               src="/logo.svg" 
              alt="Radio Rundown Pro Logo" 
              className="w-24 h-24"
            />
          </div>
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
              Radio Rundown Pro v{APP_VERSION} - Build: {BUILD_DATE}
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
        <div className="flex justify-between items-center mb-6">
          <div>
            {editingRunbookName === currentRundownId ? (
              <input 
                type="text" 
                value={rundowns.find(r => r.id === currentRundownId)?.name || ''} 
                onChange={(e) => {
                  const newName = e.target.value;
                  setRundowns(rundowns.map(r => r.id === currentRundownId ? {...r, name: newName} : r));
                }} 
                onBlur={() => {
                  const newName = rundowns.find(r => r.id === currentRundownId)?.name;
                  if (newName) renameRunbook(currentRundownId, newName);
                  setEditingRunbookName(null);
                }} 
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const newName = rundowns.find(r => r.id === currentRundownId)?.name;
                    if (newName) renameRunbook(currentRundownId, newName);
                    setEditingRunbookName(null);
                  }
                }} 
                className={`text-2xl font-bold bg-transparent border-b-2 border-blue-500 ${t.text}`} 
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
              onClick={() => setShowFeedbackModal(true)} 
              className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition-colors"
              title="Feedback & Suggesties"
            >
              <MessageSquare size={20} />
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

        <div className={`${t.card} rounded-lg p-6 shadow border ${t.border}`}>
          <div className="flex justify-between items-center mb-6">
            <button 
              onClick={() => setShowRundownSelector(!showRundownSelector)} 
              className={`${t.buttonSecondary} px-4 py-2 rounded-lg flex items-center gap-2`}
            >
              <FolderOpen size={16} />
              Mijn draaiboeken
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
              🕐 {showClock ? 'Verberg klok' : 'Toon klok'}
            </button>
            <button 
              onClick={() => window.open('/clock.html', '_blank')} 
              className={`${t.buttonSecondary} px-3 py-2 rounded-lg text-sm`}
            >
              📺 Externe klok
            </button>
            <button 
              onClick={() => setShowLiveTime(!showLiveTime)} 
              className={`${showLiveTime ? 'bg-green-500 hover:bg-green-600 text-white' : t.buttonSecondary} px-3 py-2 rounded-lg text-sm transition-colors`}
              title="Live atoomtijd weergave"
            >
              🔴 Live
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
            <div className={`text-sm font-semibold mb-2 ${t.textSecondary}`}>ITEMS TOEVOEGEN:</div>
            <div className="flex gap-2 flex-wrap items-center">
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
              {/* Tandwieltje aan het einde van de knoppenrij */}
              <button 
                onClick={() => setShowItemTypeManager(true)}
                className={`${t.buttonSecondary} px-3 py-2 rounded text-sm flex items-center ml-auto`}
                title="Item types beheren"
              >
                <Settings size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Rundown selector */}
        {showRundownSelector && (
          <div className={`${t.card} rounded-lg p-4 mb-6 shadow border ${t.border}`}>
            <div className="flex justify-between items-center mb-3">
              <h3 className={`font-bold ${t.text}`}>Mijn draaiboeken</h3>
              <button 
                onClick={downloadAllRundowns}
                className={`${t.button} px-3 py-1 rounded-lg text-sm flex items-center gap-2`}
                title="Download alle draaiboeken als TXT bestanden"
              >
                <Download size={16} />
                Download alle
              </button>
            </div>