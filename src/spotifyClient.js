const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID
const SPOTIFY_CLIENT_SECRET = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET

let spotifyToken = null
let tokenExpiry = null

async function getSpotifyToken() {
  // Check if we have a valid token
  if (spotifyToken && tokenExpiry && Date.now() < tokenExpiry) {
    return spotifyToken
  }

  // Get new token
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + btoa(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET)
    },
    body: 'grant_type=client_credentials'
  })

  if (!response.ok) {
    throw new Error('Failed to get Spotify token')
  }

  const data = await response.json()
  spotifyToken = data.access_token
  tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000 // Refresh 1 min before expiry

  return spotifyToken
}

export async function searchSpotifyTrack(query) {
  try {
    // Debug: Check if credentials are available
    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
      console.error('Spotify credentials missing:', {
        clientId: !!SPOTIFY_CLIENT_ID,
        clientSecret: !!SPOTIFY_CLIENT_SECRET
      });
      throw new Error('Spotify API credentials not configured');
    }

    const token = await getSpotifyToken()
    
    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=5`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    )

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Spotify API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`Spotify search failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json()
    
    // Debug: Log preview URL availability
    const tracks = data.tracks.items.map(track => {
      const hasPreview = !!track.preview_url;
      console.log(`Track "${track.name}" by ${track.artists[0]?.name}: Preview ${hasPreview ? 'available' : 'NOT available'}`);
      
      return {
        id: track.id,
        name: track.name,
        artist: track.artists[0]?.name || '',
        duration: Math.round(track.duration_ms / 1000),
        album: track.album?.name || '',
        image: track.album?.images[0]?.url || '',
        preview_url: track.preview_url || null
      };
    });
    
    const previewCount = tracks.filter(t => t.preview_url).length;
    console.log(`Search results: ${tracks.length} tracks, ${previewCount} with previews`);
    
    return tracks;
  } catch (error) {
    console.error('Spotify search error:', error)
    return []
  }
}
