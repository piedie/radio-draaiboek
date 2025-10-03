// src/components/ItemFormNew.jsx
// Nieuwe versie van ItemForm die werkt met custom item types

import React, { useState, useEffect } from 'react';
import { Search, Check, Play, Pause, Upload, X } from 'lucide-react';
import { searchSpotifyTrack } from '../spotifyClient';
import { getItemTypeByName } from '../utils/itemTypeManager';

const ItemFormNew = ({ 
  item, 
  onSave, 
  onCancel, 
  theme,
  formatTimeShort,
  parseTimeInput,
  isSearchingSpotify,
  setIsSearchingSpotify,
  availableItemTypes = [] // Array van beschikbare item types voor deze gebruiker
}) => {
  const [form, setForm] = useState(() => {
    // Als we een item hebben, gebruik die data
    if (item) {
      return {
        type: item.type || 'music',
        title: item.title || '',
        artist: item.artist || '',
        duration: item.duration || 180,
        first_words: item.first_words || '',
        notes: item.notes || '',
        last_words: item.last_words || '',
        color: item.color || '#ef4444',
        connection_type: item.connection_type || '',
        phone_number: item.phone_number || '',
        spotify_preview_url: item.spotify_preview_url || null,
        audio_files: item.audio_files || [],
        user_item_type_id: item.user_item_type_id || null
      };
    }
    
    // Voor nieuwe items, gebruik het eerste beschikbare type
    const defaultType = availableItemTypes[0] || { name: 'music', color: '#ef4444', default_duration: 180 };
    return {
      type: defaultType.name,
      title: '',
      artist: '',
      duration: defaultType.default_duration,
      first_words: '',
      notes: '',
      last_words: '',
      color: defaultType.color,
      connection_type: '',
      phone_number: '',
      spotify_preview_url: null,
      audio_files: [],
      user_item_type_id: defaultType.id || null
    };
  });

  const [localResults, setLocalResults] = useState([]);
  const [showLocal, setShowLocal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewAudio, setPreviewAudio] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);

  const t = theme === 'light' ? {
    bg: 'bg-gray-50', card: 'bg-white', text: 'text-gray-900', textSecondary: 'text-gray-600',
    border: 'border-gray-200', input: 'bg-white border-gray-300 text-gray-900',
    button: 'bg-blue-600 hover:bg-blue-700 text-white',
    buttonSecondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900'
  } : {
    bg: 'bg-gray-900', card: 'bg-gray-800', text: 'text-white', textSecondary: 'text-gray-400',
    border: 'border-gray-700', input: 'bg-gray-700 border-gray-600 text-white',
    button: 'bg-blue-600 hover:bg-blue-700 text-white',
    buttonSecondary: 'bg-gray-600 hover:bg-gray-500 text-white'
  };

  // Get current selected item type info
  const currentItemType = getItemTypeByName(availableItemTypes, form.type);

  // Update form when item type changes
  useEffect(() => {
    if (currentItemType) {
      setForm(prev => ({
        ...prev,
        color: currentItemType.color,
        duration: prev.duration === 0 ? currentItemType.default_duration : prev.duration,
        user_item_type_id: currentItemType.id || null
      }));
    }
  }, [form.type, currentItemType]);

  const connectionTypes = ['Telefoon', 'Skype', 'Teams', 'Zoom', 'Studio'];

  // Spotify search functionality
  const searchSpotify = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearchingSpotify(true);
    try {
      const results = await searchSpotifyTrack(searchQuery);
      setLocalResults(results);
      setShowLocal(true);
    } catch (error) {
      console.error('Spotify search error:', error);
      alert('Fout bij zoeken op Spotify: ' + error.message);
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
  };

  // Audio playback
  const playPreview = (previewUrl) => {
    if (!previewUrl) {
      alert('Geen preview beschikbaar voor dit nummer');
      return;
    }

    if (previewAudio) {
      previewAudio.pause();
      previewAudio.currentTime = 0;
    }

    const audio = new Audio(previewUrl);
    audio.volume = 0.5;
    
    audio.addEventListener('canplay', () => {
      audio.play().then(() => {
        setIsPlaying(true);
        setPreviewAudio(audio);
      }).catch(error => {
        console.error('Play failed:', error);
        alert('Browser blokkeert automatisch afspelen. Probeer eerst op de pagina te klikken.');
      });
    });

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setPreviewAudio(null);
    });

    audio.addEventListener('error', (e) => {
      console.error('Audio error:', e);
      alert('Preview niet beschikbaar.');
      setIsPlaying(false);
      setPreviewAudio(null);
    });

    audio.load();
  };

  const stopPreview = () => {
    if (previewAudio) {
      previewAudio.pause();
      previewAudio.currentTime = 0;
      setIsPlaying(false);
      setPreviewAudio(null);
    }
  };

  // Audio file handling for custom fields
  const handleAudioUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;
    
    const currentFiles = form.audio_files || [];
    if (currentFiles.length + files.length > 4) {
      alert('Maximaal 4 audiobestanden toegestaan');
      return;
    }
    
    setUploadingAudio(true);
    
    try {
      const newAudioFiles = [];
      
      for (const file of files) {
        if (!file.type.startsWith('audio/')) {
          alert(`${file.name} is geen geldig audiobestand`);
          continue;
        }
        
        if (file.size > 5 * 1024 * 1024) {
          alert(`${file.name} is te groot (max 5MB per bestand)`);
          continue;
        }
        
        const base64 = await convertToBase64(file);
        
        newAudioFiles.push({
          id: Date.now() + Math.random(),
          name: file.name,
          type: file.type,
          size: file.size,
          data: base64
        });
      }
      
      setForm({
        ...form,
        audio_files: [...currentFiles, ...newAudioFiles]
      });
      
    } catch (error) {
      console.error('Audio upload error:', error);
      alert('Fout bij uploaden van audiobestanden');
    } finally {
      setUploadingAudio(false);
    }
  };
  
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };
  
  const removeAudioFile = (fileId) => {
    setForm({
      ...form,
      audio_files: (form.audio_files || []).filter(file => file.id !== fileId)
    });
  };

  const playAudioFile = (audioFile) => {
    if (previewAudio) {
      previewAudio.pause();
      previewAudio.currentTime = 0;
    }
    
    const audio = new Audio(audioFile.data);
    audio.volume = 0.7;
    
    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setPreviewAudio(null);
    });
    
    audio.play().then(() => {
      setIsPlaying(true);
      setPreviewAudio(audio);
    }).catch(error => {
      console.error('Audio play error:', error);
      alert('Kan audiobestand niet afspelen');
    });
  };

  // Form submission
  const handleSubmit = () => {
    if (form.title) {
      stopPreview();
      onSave(form);
    }
  };

  const handleCancel = () => {
    stopPreview();
    onCancel();
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (previewAudio) {
        previewAudio.pause();
        previewAudio.currentTime = 0;
      }
    };
  }, [previewAudio]);

  // Render custom fields based on item type configuration
  const renderCustomFields = () => {
    if (!currentItemType || !currentItemType.custom_fields) return null;

    return currentItemType.custom_fields.map((field, index) => {
      switch (field.type) {
        case 'text':
          return (
            <div key={index}>
              <label className={`block text-sm mb-1 ${t.text}`}>
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <input 
                type="text" 
                value={form[field.name] || ''} 
                onChange={(e) => setForm({...form, [field.name]: e.target.value})} 
                className={`w-full px-3 py-2 rounded border ${t.input}`}
                required={field.required}
              />
            </div>
          );

        case 'textarea':
          return (
            <div key={index}>
              <label className={`block text-sm mb-1 ${t.text}`}>
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <textarea 
                value={form[field.name] || ''} 
                onChange={(e) => setForm({...form, [field.name]: e.target.value})} 
                rows={3}
                className={`w-full px-3 py-2 rounded border ${t.input}`}
                required={field.required}
              />
            </div>
          );

        case 'select':
          return (
            <div key={index}>
              <label className={`block text-sm mb-1 ${t.text}`}>
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <select 
                value={form[field.name] || ''} 
                onChange={(e) => setForm({...form, [field.name]: e.target.value})} 
                className={`w-full px-3 py-2 rounded border ${t.input}`}
                required={field.required}
              >
                <option value="">Selecteer...</option>
                {(field.options || []).map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          );

        case 'file_array':
          return (
            <div key={index}>
              <label className={`block text-sm mb-1 ${t.text}`}>
                {field.label} (max {field.max_files || 4} bestanden)
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              
              <div className="mb-3">
                <input
                  type="file"
                  id={`${field.name}-upload`}
                  multiple
                  accept={field.accept || 'audio/*'}
                  onChange={handleAudioUpload}
                  className="hidden"
                  disabled={uploadingAudio}
                />
                <label
                  htmlFor={`${field.name}-upload`}
                  className={`flex items-center gap-2 px-4 py-2 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${t.border} ${uploadingAudio ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Upload size={20} />
                  {uploadingAudio ? 'Uploaden...' : 'Bestanden selecteren'}
                </label>
              </div>

              {form.audio_files && form.audio_files.length > 0 && (
                <div className="space-y-2">
                  {form.audio_files.map(file => (
                    <div key={file.id} className={`flex items-center justify-between p-3 rounded border ${t.border}`}>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => playAudioFile(file)}
                          className={`p-1 rounded ${t.buttonSecondary}`}
                          disabled={isPlaying}
                        >
                          <Play size={16} />
                        </button>
                        <span className={`text-sm ${t.text}`}>{file.name}</span>
                        <span className={`text-xs ${t.textSecondary}`}>
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAudioFile(file.id)}
                        className={`p-1 rounded text-red-600 hover:bg-red-100`}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );

        default:
          return null;
      }
    });
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
              {availableItemTypes.map(itemType => (
                <option key={itemType.name} value={itemType.name}>
                  {itemType.display_name}
                </option>
              ))}
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

          {/* Spotify zoeken voor muziek */}
          {form.type === 'music' && (
            <div>
              <label className={`block text-sm mb-1 ${t.text}`}>Spotify zoeken</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Zoek artiest en nummer..."
                  className={`flex-1 px-3 py-2 rounded border ${t.input}`}
                  onKeyPress={(e) => e.key === 'Enter' && searchSpotify()}
                />
                <button 
                  type="button"
                  onClick={searchSpotify}
                  disabled={isSearchingSpotify || !searchQuery.trim()}
                  className={`px-4 py-2 rounded ${t.button} disabled:opacity-50`}
                >
                  {isSearchingSpotify ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <Search size={20} />
                  )}
                </button>
              </div>

              {/* Spotify resultaten */}
              {showLocal && localResults.length > 0 && (
                <div className={`mt-2 border rounded-lg ${t.border} max-h-60 overflow-y-auto`}>
                  {localResults.map((result, index) => (
                    <div 
                      key={index} 
                      className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b last:border-b-0 ${t.border}`}
                      onClick={() => selectSpotifyResult(result)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`font-medium ${t.text}`}>{result.name}</p>
                          <p className={`text-sm ${t.textSecondary}`}>{result.artist}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm ${t.textSecondary}`}>
                            {formatTimeShort(result.duration)}
                          </span>
                          <Check size={16} className="text-green-600" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Duur */}
          <div>
            <label className={`block text-sm mb-1 ${t.text}`}>Duur</label>
            <input 
              type="text" 
              value={formatTimeShort(form.duration)} 
              onChange={(e) => setForm({...form, duration: parseTimeInput(e.target.value)})} 
              placeholder="3:30" 
              className={`w-full px-3 py-2 rounded border ${t.input}`} 
            />
          </div>

          {/* Notities */}
          <div>
            <label className={`block text-sm mb-1 ${t.text}`}>Notities</label>
            <textarea 
              value={form.notes} 
              onChange={(e) => setForm({...form, notes: e.target.value})} 
              rows={3} 
              className={`w-full px-3 py-2 rounded border ${t.input}`} 
            />
          </div>

          {/* Custom velden op basis van item type */}
          {renderCustomFields()}

          {/* Preview speler voor Spotify */}
          {form.spotify_preview_url && (
            <div className={`p-4 border rounded-lg ${t.border}`}>
              <div className="flex items-center justify-between">
                <span className={`text-sm ${t.text}`}>Spotify Preview</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => playPreview(form.spotify_preview_url)}
                    disabled={isPlaying}
                    className={`p-2 rounded ${t.button} disabled:opacity-50`}
                  >
                    <Play size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={stopPreview}
                    disabled={!isPlaying}
                    className={`p-2 rounded ${t.buttonSecondary} disabled:opacity-50`}
                  >
                    <Pause size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex justify-end gap-3 p-6 border-t ${t.border}`}>
          <button 
            onClick={handleCancel}
            className={`px-4 py-2 rounded ${t.buttonSecondary}`}
          >
            Annuleren
          </button>
          <button 
            onClick={handleSubmit}
            disabled={!form.title}
            className={`px-4 py-2 rounded ${t.button} disabled:opacity-50`}
          >
            {item ? 'Bijwerken' : 'Toevoegen'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ItemFormNew;
