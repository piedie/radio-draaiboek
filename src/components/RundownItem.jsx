import React, { useState, useRef } from 'react';
import { Edit2, Trash2, GripVertical, Music, Mic, Volume2, Play, Pause } from 'lucide-react';

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
            <div className={`font-medium ${t.text}`}>{item.title}</div>
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
            
            {/* Game audio files */}
            {item.type === 'game' && item.audio_files && item.audio_files.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
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
                      <div
                        className={`ml-2 p-1 rounded-full text-white text-xs ${
                          playingAudioId === audioFile.id
                            ? 'bg-red-500'
                            : 'bg-green-500'
                        } transition-colors pointer-events-none`}
                      >
                        {playingAudioId === audioFile.id ? '⏹️' : '▶️'}
                      </div>
                    </div>
                  ))}
                </div>
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
              tot {formatTime(getCumulativeTime(index))}
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
          
          {/* Debug: toon preview icon als er geen URL is maar het wel een muziek item is */}
          {item.type === 'music' && !item.spotify_preview_url && (
            <div 
              className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-400 text-xs"
              title="Geen Spotify preview - bewerk item en zoek via Spotify om preview toe te voegen"
            >
              🎵
            </div>
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
              <div className="mb-3 p-2 bg-green-100 dark:bg-green-900 bg-opacity-30 rounded">
                <div className="text-xs text-green-600 dark:text-green-400 mb-1 font-semibold">
                  EERSTE WOORDEN:
                </div>
                <div>{item.first_words}</div>
              </div>
            )}
            {item.notes && (
              <div className="mb-3">
                <div className={`text-xs mb-1 font-semibold ${t.textSecondary}`}>
                  HOOFDTEKST:
                </div>
                <div>{item.notes}</div>
              </div>
            )}
            {item.last_words && (
              <div className="p-2 bg-blue-100 dark:bg-blue-900 bg-opacity-30 rounded">
                <div className="text-xs text-blue-600 dark:text-blue-400 mb-1 font-semibold">
                  LAATSTE WOORDEN:
                </div>
                <div>{item.last_words}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RundownItem;
