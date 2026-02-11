import React, { useState, useRef } from 'react';
import { Edit2, Trash2, GripVertical, Music, Mic, Volume2, Play, Pause, Plus, Minus, User } from 'lucide-react';

const RundownItem = ({ 
  item, 
  index, 
  isExpanded, 
  isDragOver, 
  theme,
  formatTimeShort,
  formatTime,
  getCumulativeTime,
  toggleExpanded,
  onEdit,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState(null);
  const audioRef = useRef(null);
  const gameAudioRefs = useRef({});
  
  // Scoreboard state - initialize with default scores if scoreboard is enabled
  const [scores, setScores] = useState(() => {
    if (item.type === 'game' && item.enable_scoreboard) {
      // Always start with default scores (don't load from database)
      return [
        { name: 'Speler 1', score: 0 },
        { name: 'Speler 2', score: 0 },
        { name: 'Speler 3', score: 0 }
      ];
    }
    return [];
  });
  const [editingPlayerName, setEditingPlayerName] = useState(null);
  
  // Debug logging voor items (alleen bij problemen)
  if (!item.title && item.type === 'music') {
    console.warn('⚠️ Music item without title:', item);
  }
  if (!item.notes && item.type === 'talk') {
    console.warn('⚠️ Talk item without notes:', item);
  }
  if (!item.audio_files && item.type === 'game') {
    console.warn('⚠️ Game item without audio_files:', item);
  }
  
  const t = theme === 'light' ? {
    card: 'bg-white',
    text: 'text-gray-900',
    textSecondary: 'text-gray-600',
    border: 'border-gray-200'
  } : {
    card: 'bg-gray-800',
    text: 'text-white',
    textSecondary: 'text-gray-400',
    border: 'border-gray-700'
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

  const getStatusMeta = (status) => {
    switch (status) {
      case 'checked':
        return { label: 'Checked', cls: 'bg-green-600 text-white' };
      case 'review':
        return { label: 'Review', cls: 'bg-yellow-500 text-black' };
      case 'montage':
        return { label: 'Montage', cls: 'bg-blue-600 text-white' };
      case 'cancelled':
        return { label: 'Cancel', cls: 'bg-gray-500 text-white' };
      case 'draft':
      default:
        return { label: 'Draft', cls: 'bg-gray-300 text-gray-900' };
    }
  };

  const statusMeta = getStatusMeta(item.status);

  const handlePlayPreview = (e) => {
    e.stopPropagation();
    console.log('Preview clicked for:', item.title, 'URL:', item.spotify_preview_url);
    
    if (!item.spotify_preview_url) {
      console.warn('No preview URL available');
      return;
    }

    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      console.log('Audio paused');
    } else {
      if (audioRef.current) {
        audioRef.current.play().then(() => {
          setIsPlaying(true);
          console.log('Audio started playing');
        }).catch(error => {
          console.error('Error playing audio:', error);
        });
      }
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const handleGameAudioPlay = (audioFile, e) => {
    e.stopPropagation();
    
    // Stop any currently playing game audio
    Object.values(gameAudioRefs.current).forEach(audio => {
      if (audio && !audio.paused) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
    
    // Stop spotify preview if playing
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    
    const audioId = audioFile.id;
    
    if (playingAudioId === audioId) {
      // Stop current audio
      setPlayingAudioId(null);
      return;
    }
    
    // Create or get audio element for this file
    if (!gameAudioRefs.current[audioId]) {
      gameAudioRefs.current[audioId] = new Audio(audioFile.data);
      gameAudioRefs.current[audioId].volume = 0.7;
      
      gameAudioRefs.current[audioId].addEventListener('ended', () => {
        setPlayingAudioId(null);
      });
    }
    
    // Play the audio
    gameAudioRefs.current[audioId].play().then(() => {
      setPlayingAudioId(audioId);
    }).catch(error => {
      console.error('Game audio play failed:', error);
      alert('Kan geluidseffect niet afspelen');
    });
  };

  // Scoreboard functions
  const updateScore = (playerIndex, delta) => {
    if (!item.enable_scoreboard) return;
    
    const newScores = [...scores];
    newScores[playerIndex].score = Math.max(0, newScores[playerIndex].score + delta);
    setScores(newScores);
    
    // Save to item data (this would need to be passed up to parent to persist)
    if (onEdit) {
      const updatedItem = { ...item, scores: newScores };
      // Note: We would need onScoreUpdate callback to persist this
    }
  };

  const updatePlayerName = (playerIndex, newName) => {
    if (!item.enable_scoreboard) return;
    
    const newScores = [...scores];
    newScores[playerIndex].name = newName || `Speler ${playerIndex + 1}`;
    setScores(newScores);
    setEditingPlayerName(null);
    
    // Save to item data
    if (onEdit) {
      const updatedItem = { ...item, scores: newScores };
      // Note: We would need onScoreUpdate callback to persist this
    }
  };

  const resetAllScores = () => {
    if (!item.enable_scoreboard) return;
    
    const newScores = scores.map(player => ({ ...player, score: 0 }));
    setScores(newScores);
  };

  // Reset scores when scoreboard is enabled/disabled
  React.useEffect(() => {
    if (item.type === 'game' && item.enable_scoreboard && scores.length === 0) {
      // Initialize scores when scoreboard is turned on
      setScores([
        { name: 'Speler 1', score: 0 },
        { name: 'Speler 2', score: 0 },
        { name: 'Speler 3', score: 0 }
      ]);
    } else if (!item.enable_scoreboard) {
      // Clear scores when scoreboard is turned off
      setScores([]);
    }
  }, [item.enable_scoreboard, item.type]);

  return (
    <div 
      draggable 
      onDragStart={(e) => onDragStart(e, item, index)} 
      onDragOver={(e) => onDragOver(e, index)} 
      onDrop={(e) => onDrop(e, index)} 
      className={`rounded-lg p-4 border cursor-move ${t.card} ${t.border} ${isDragOver ? 'border-t-4 border-t-blue-500' : ''}`}
    >
      {/* Hidden audio element for Spotify preview */}
      {item.spotify_preview_url && (
        <audio 
          ref={audioRef}
          src={item.spotify_preview_url}
          onEnded={handleAudioEnded}
          preload="none"
        />
      )}
      <div className="flex justify-between">
        <div className="flex gap-3 flex-1">
          <GripVertical size={16} className={t.textSecondary} />
          <div style={{ color: item.color }}>
            {getIcon(item.type)}
          </div>
          <div className="flex-1 cursor-pointer" onClick={() => toggleExpanded(item.id)}>
            <div className="flex items-center gap-2">
              <div className={`font-medium ${t.text}`}>{item.title}</div>
              <span
                className={`text-xs px-2 py-0.5 rounded ${statusMeta.cls}`}
                title="Status"
              >
                {statusMeta.label}
              </span>
            </div>
            {item.artist && (
              <div className={`text-sm ${t.textSecondary}`}>{item.artist}</div>
            )}
            {(item.first_words || item.last_words || item.connection_type) && (
              <div className={`text-xs mt-1 ${t.textSecondary}`}>
                {item.first_words && (
                  <span>
                    EW: {item.first_words.substring(0, 40)}
                    {item.first_words.length > 40 ? '...' : ''}
                  </span>
                )}
                {item.first_words && item.last_words && (
                  <span className="mx-1">|</span>
                )}
                {item.last_words && (
                  <span>
                    LW: {item.last_words.substring(0, 40)}
                    {item.last_words.length > 40 ? '...' : ''}
                  </span>
                )}
                {item.connection_type && (
                  <div className="mt-1">
                    <span className="font-semibold">
                      Verbinding: {item.connection_type}
                    </span>
                    {item.connection_type === 'Telefoon' && item.phone_number && (
                      <span> ({item.phone_number})</span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-3">
          <div className="text-right">
            <div className={`text-sm font-mono ${t.text}`}>
              {formatTimeShort(item.duration)}
            </div>
            <div className={`text-xs font-mono ${t.textSecondary}`}>
              totaal {formatTime(getCumulativeTime(index))}
            </div>
          </div>
          
          {/* Spotify preview button */}
          {item.type === 'music' && item.spotify_preview_url && (
            <button 
              onClick={handlePlayPreview}
              className={`p-2 rounded-full ${isPlaying ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'} hover:bg-green-400 transition-colors`}
              title="Speel 30 seconden preview"
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            </button>
          )}
          
          <button 
            onClick={() => onEdit(item)} 
            className={t.textSecondary}
          >
            <Edit2 size={16} />
          </button>
          <button 
            onClick={() => onDelete(item.id)} 
            className={`${t.textSecondary} hover:text-red-500`}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Uitgevouwen content */}
      {isExpanded && (item.first_words || item.notes || item.last_words) && (
        <div className={`mt-3 pt-3 border-t ${t.border}`}>
          <div className={`text-sm p-3 rounded ${theme === 'light' ? 'bg-gray-50' : 'bg-gray-900'}`}>
            {item.first_words && (
              <div className="mb-3 p-3 bg-green-100 dark:bg-green-900 bg-opacity-40 rounded border border-green-200 dark:border-green-800">
                <div className="text-[11px] text-green-700 dark:text-green-300 mb-1 font-bold tracking-wide">
                  EERSTE WOORDEN
                </div>
                <div className={`${t.text} whitespace-pre-wrap leading-relaxed`}>{item.first_words}</div>
              </div>
            )}
            
            {/* Game audio files - na eerste woorden */}
            {item.type === 'game' && item.audio_files && item.audio_files.length > 0 && (
              <div className="mb-3">
                <div className={`text-xs font-semibold mb-2 ${t.textSecondary} flex items-center justify-between`}>
                  <span>🎵 Geluidseffectjes ({item.audio_files.length}):</span>
                  <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 px-2 py-1 rounded">
                    Sneltoetsen: 1-{Math.min(item.audio_files.length, 4)}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {item.audio_files.map((audioFile, fileIndex) => (
                    <div
                      key={audioFile.id}
                      data-audio-id={audioFile.id}
                      onClick={(e) => handleGameAudioPlay(audioFile, e)}
                      className={`flex items-center justify-between p-2 rounded border ${t.border} bg-gray-50 dark:bg-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors ${
                        playingAudioId === audioFile.id ? 'ring-2 ring-green-500' : ''
                      }`}
                      title={`Klik om af te spelen (sneltoets: ${fileIndex + 1}) - ${playingAudioId === audioFile.id ? 'Nu aan het spelen' : 'Klik om af te spelen'}`}
                    >
                      <div className="flex-1 min-w-0 flex items-center">
                        <div className={`text-xs font-bold mr-2 ${t.textSecondary} bg-gray-200 dark:bg-gray-600 px-1 rounded`}>
                          {fileIndex + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-xs font-medium truncate ${t.text}`}>
                            {audioFile.name}
                          </div>
                          <div className={`text-xs ${t.textSecondary}`}>
                            {Math.round(audioFile.size / 1024)}KB
                          </div>
                        </div>
                      </div>
                      <div className="ml-2">
                        {playingAudioId === audioFile.id ? (
                          <Pause size={14} className="text-green-600" />
                        ) : (
                          <Play size={14} className={t.textSecondary} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Scoreboard for game items - only if enabled */}
            {item.type === 'game' && item.enable_scoreboard && (
              <div className="mb-3">
                <div className={`flex items-center justify-between mb-2`}>
                  <div className={`text-xs font-semibold ${t.textSecondary} flex items-center`}>
                    <User size={12} className="mr-1" />
                    🏆 Scoreboard
                  </div>
                  <button
                    onClick={resetAllScores}
                    className={`text-xs px-2 py-1 rounded ${theme === 'light' ? 'bg-gray-200 hover:bg-gray-300' : 'bg-gray-600 hover:bg-gray-500'} transition-colors`}
                    title="Reset alle scores naar 0"
                  >
                    Reset
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {scores.map((player, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded border ${t.border} bg-gray-50 dark:bg-gray-700`}
                    >
                      <div className="text-center">
                        {editingPlayerName === index ? (
                          <input
                            type="text"
                            value={player.name}
                            onChange={(e) => {
                              const newScores = [...scores];
                              newScores[index].name = e.target.value;
                              setScores(newScores);
                            }}
                            onBlur={(e) => updatePlayerName(index, e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                updatePlayerName(index, e.target.value);
                              }
                            }}
                            className={`text-xs font-medium text-center w-full mb-1 px-1 py-0.5 rounded ${t.input}`}
                            autoFocus
                          />
                        ) : (
                          <div
                            onClick={() => setEditingPlayerName(index)}
                            className={`text-xs font-medium cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 px-1 py-0.5 rounded mb-1 ${t.text}`}
                            title="Klik om naam te bewerken"
                          >
                            {player.name}
                          </div>
                        )}
                        
                        <div className={`text-lg font-bold mb-2 ${t.text}`}>
                          {player.score}
                        </div>
                        
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={() => updateScore(index, -1)}
                            className="p-1 rounded bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                            title="Score verlagen"
                          >
                            <Minus size={12} />
                          </button>
                          <button
                            onClick={() => updateScore(index, 1)}
                            className="p-1 rounded bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                            title="Score verhogen"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {item.notes && (
              <div className="mb-3 p-3 bg-amber-50 dark:bg-amber-950/30 rounded border border-amber-200 dark:border-amber-800">
                <div className="text-[11px] text-amber-700 dark:text-amber-300 mb-1 font-bold tracking-wide">
                  NOTITIES / OPMERKINGEN (voor presentator)
                </div>
                <div className={`${t.text} whitespace-pre-wrap leading-relaxed`}>{item.notes}</div>
              </div>
            )}
            {item.last_words && (
              <div className="p-3 bg-blue-100 dark:bg-blue-900 bg-opacity-40 rounded border border-blue-200 dark:border-blue-800">
                <div className="text-[11px] text-blue-700 dark:text-blue-300 mb-1 font-bold tracking-wide">
                  LAATSTE WOORDEN
                </div>
                <div className={`${t.text} whitespace-pre-wrap leading-relaxed`}>{item.last_words}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RundownItem;
