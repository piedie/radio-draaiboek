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

// Test function to check Spotify API status
export async function testSpotifyAPI() {
  try {
    console.log('Testing Spotify API...');
    
    // Check credentials
    console.log('Credentials check:', {
      clientId: SPOTIFY_CLIENT_ID ? 'SET' : 'MISSING',
      clientSecret: SPOTIFY_CLIENT_SECRET ? 'SET' : 'MISSING'
    });
    
    // Get token
    const token = await getSpotifyToken();
    console.log('Token obtained:', !!token);
    
    // Test a simple search for a very popular song that should have a preview
    const testQueries = ['The Beatles Yesterday', 'Ed Sheeran Shape of You', 'Billie Eilish bad guy'];
    
    for (const testQuery of testQueries) {
      console.log(`\nTesting with: "${testQuery}"`);
      const results = await searchSpotifyTrack(testQuery);
      const withPreviews = results.filter(r => r.preview_url);
      console.log(`Results: ${results.length}, With previews: ${withPreviews.length}`);
      
      if (withPreviews.length > 0) {
        console.log('✅ Found tracks with previews! API is working.');
        return true;
      }
    }
    
    console.log('❌ No previews found for any test queries. This might indicate a regional restriction or API issue.');
    return false;
    
  } catch (error) {
    console.error('Spotify API test failed:', error);
    return false;
  }
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
    
    // Try different search parameters for better preview availability
    const searchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10&market=NL&include_external=audio`;
    console.log('Spotify search URL:', searchUrl);
    
    const response = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

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
    
    // Debug: Log the full API response for first track
    if (data.tracks.items.length > 0) {
      console.log('Full Spotify API response for first track:', JSON.stringify(data.tracks.items[0], null, 2));
    }
    
    // Debug: Log preview URL availability
    const tracks = data.tracks.items.map(track => {
      const hasPreview = !!track.preview_url;
      console.log(`Track "${track.name}" by ${track.artists[0]?.name}: Preview ${hasPreview ? 'available' : 'NOT available'}`);
      if (hasPreview) {
        console.log(`  Preview URL: ${track.preview_url}`);
      }
      console.log(`  Markets: ${track.available_markets?.length || 0} countries`);
      console.log(`  Explicit: ${track.explicit}`);
      console.log(`  Track number: ${track.track_number}`);
      
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
    
    // If no tracks have previews, try a different search approach
    if (previewCount === 0 && tracks.length > 0) {
      console.log('No previews found, trying alternative search...');
      
      // Try searching for more popular/recent versions
      const alternativeQuery = query + ' official';
      const altResponse = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(alternativeQuery)}&type=track&limit=15&market=US`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (altResponse.ok) {
        const altData = await altResponse.json();
        const altTracks = altData.tracks.items.map(track => ({
          id: track.id,
          name: track.name,
          artist: track.artists[0]?.name || '',
          duration: Math.round(track.duration_ms / 1000),
          album: track.album?.name || '',
          image: track.album?.images[0]?.url || '',
          preview_url: track.preview_url || null
        }));
        
        const altPreviewCount = altTracks.filter(t => t.preview_url).length;
        console.log(`Alternative search: ${altTracks.length} tracks, ${altPreviewCount} with previews`);
        
        if (altPreviewCount > 0) {
          // Combine results, prioritizing tracks with previews
          const tracksWithPreviews = altTracks.filter(t => t.preview_url);
          const originalTracksWithoutDuplicates = tracks.filter(t => 
            !altTracks.some(alt => alt.id === t.id)
          );
          
          return [...tracksWithPreviews, ...originalTracksWithoutDuplicates].slice(0, 5);
        }
      }
    }
    
    return tracks.slice(0, 5);
  } catch (error) {
    console.error('Spotify search error:', error)
    return []
  }
}
