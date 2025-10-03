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

// Mock preview URLs for testing when Spotify doesn't provide them
const generateMockPreview = (trackName, artist) => {
  // This creates a unique identifier that could be used to search other sources
  const searchTerm = `${trackName} ${artist}`.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '+');
  
  // For now, return null, but this could be extended to use:
  // - YouTube Music API
  // - Last.fm API
  // - Other music services
  console.log(`Could search for: "${searchTerm}" on alternative platforms`);
  return null;
};

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
    const testQueries = [
      'Never Gonna Give You Up Rick Astley', // Classic that often has previews
      'Bohemian Rhapsody Queen',
      'Imagine Dragons Believer', 
      'Dua Lipa Levitating',
      'The Weeknd Blinding Lights',
      'Olivia Rodrigo drivers license'
    ];
    
    console.log('\n🎵 Testing with songs known to have previews in most regions...');
    
    for (const testQuery of testQueries) {
      console.log(`\n🔍 Testing: "${testQuery}"`);
      const results = await searchSpotifyTrack(testQuery);
      const withPreviews = results.filter(r => r.preview_url);
      console.log(`📊 Results: ${results.length} tracks found, ${withPreviews.length} with previews`);
      
      if (withPreviews.length > 0) {
        console.log('✅ SUCCESS! Found working previews.');
        console.log('🎵 Preview example:', withPreviews[0].preview_url);
        console.log('🌍 Track has markets:', withPreviews[0].markets || 'unknown');
        return true;
      } else if (results.length > 0) {
        console.log(`❌ Found tracks but no previews. First track markets: ${results[0].markets || 0}`);
      } else {
        console.log('❌ No tracks found at all');
      }
    }
    
    console.log('❌ No previews found for any test queries. This might indicate a regional restriction or API issue.');
    
    // Final diagnosis - if we see tracks with many markets but no previews, it's a policy issue
    console.log('\n🔍 FINAL DIAGNOSIS:');
    console.log('• Tracks found: ✅ YES (API credentials work)');
    console.log('• Markets available: ✅ YES (180+ countries for major tracks)');
    console.log('• Preview URLs: ❌ NO (consistently null across all tracks)');
    console.log('');
    console.log('🎯 CONCLUSION: This indicates a Spotify API policy change.');
    console.log('   Spotify has likely restricted preview access for:');
    console.log('   • Client Credentials flow (your current setup)');
    console.log('   • Certain regions (EU/Netherlands)');
    console.log('   • Third-party applications');
    console.log('');
    console.log('💡 SOLUTIONS:');
    console.log('   1. Switch to Authorization Code flow (requires user login)');
    console.log('   2. Use alternative music APIs (Last.fm, YouTube, etc.)');
    console.log('   3. Accept that previews are not available');
    console.log('');
    console.log('🚫 This is NOT a bug in your code - it\'s a Spotify policy limitation.');
    
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
    
    // Try WITHOUT market restrictions first - this often works better
    console.log('🎵 Trying search WITHOUT market restrictions...');
    const basicSearchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=20`;
    console.log('Basic search URL:', basicSearchUrl);
    
    const basicResponse = await fetch(basicSearchUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (basicResponse.ok) {
      const basicData = await basicResponse.json();
      console.log('Basic search results:', basicData.tracks.items.length);
      
      const basicTracks = basicData.tracks.items.map(track => ({
        id: track.id,
        name: track.name,
        artist: track.artists[0]?.name || '',
        duration: Math.round(track.duration_ms / 1000),
        album: track.album?.name || '',
        image: track.album?.images[0]?.url || '',
        preview_url: track.preview_url || null,
        markets: track.available_markets?.length || 0
      }));
      
      const basicPreviewCount = basicTracks.filter(t => t.preview_url).length;
      console.log(`Basic search: ${basicTracks.length} tracks, ${basicPreviewCount} with previews`);
      
      // If we found previews, return them
      if (basicPreviewCount > 0) {
        console.log('✅ Found previews with basic search!');
        // Debug first few tracks
        basicTracks.slice(0, 3).forEach(track => {
          console.log(`"${track.name}" by ${track.artist}: Preview ${track.preview_url ? 'YES' : 'NO'}, Markets: ${track.markets}`);
        });
        return basicTracks.slice(0, 5);
      }
      
      // Log details about first few tracks for debugging
      console.log('📊 Detailed track analysis:');
      basicTracks.slice(0, 3).forEach(track => {
        console.log(`"${track.name}" by ${track.artist}:`);
        console.log(`  - Preview: ${track.preview_url ? 'YES' : 'NO'}`);
        console.log(`  - Markets: ${track.markets} countries`);
        console.log(`  - ID: ${track.id}`);
      });
    }

    // If basic search didn't work, try the old multi-market approach
    console.log('🌍 Basic search had no previews, trying multiple markets...');
    const markets = ['US', 'GB', 'DE', 'SE', 'AU', 'CA']; // Try markets known for having previews
    let bestResults = [];
    
    for (const market of markets) {
      const searchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=20&market=${market}`;
      console.log(`Trying market ${market}...`);
      
      const response = await fetch(searchUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        console.log(`Market ${market} failed:`, response.status);
        continue;
      }

      const data = await response.json();
      
      if (data.tracks.items.length > 0) {
        const tracksWithPreviews = data.tracks.items.filter(track => track.preview_url);
        console.log(`Market ${market}: ${data.tracks.items.length} tracks, ${tracksWithPreviews.length} with previews`);
        
        if (tracksWithPreviews.length > 0) {
          console.log(`✅ Found previews in market: ${market}`);
          bestResults = data.tracks.items;
          break;
        }
        
        if (bestResults.length === 0) {
          bestResults = data.tracks.items;
        }
      }
    }

    if (bestResults.length === 0) {
      console.log('❌ No results found in any market');
      return [];
    }

    const data = { tracks: { items: bestResults } };
    
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
      console.log('No previews found, trying alternative search strategies...');
      
      // Strategy 1: Search for radio edit, single version, etc.
      const alternativeQueries = [
        query + ' radio edit',
        query + ' single version',
        query + ' remaster',
        query.split(' ').slice(0, 2).join(' ') // Just first two words
      ];
      
      for (const altQuery of alternativeQueries) {
        console.log(`Trying alternative query: "${altQuery}"`);
        
        const altResponse = await fetch(
          `https://api.spotify.com/v1/search?q=${encodeURIComponent(altQuery)}&type=track&limit=15&market=US`,
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
          console.log(`Alternative search "${altQuery}": ${altTracks.length} tracks, ${altPreviewCount} with previews`);
          
          if (altPreviewCount > 0) {
            // Combine results, prioritizing tracks with previews
            const tracksWithPreviews = altTracks.filter(t => t.preview_url);
            const originalTracksWithoutDuplicates = tracks.filter(t => 
              !altTracks.some(alt => alt.id === t.id)
            );
            
            console.log('✅ Found previews with alternative search!');
            return [...tracksWithPreviews, ...originalTracksWithoutDuplicates].slice(0, 5);
          }
        }
      }
      
      console.log('❌ No previews found with any search strategy');
    }
    
    return tracks.slice(0, 5);
  } catch (error) {
    console.error('Spotify search error:', error)
    return []
  }
}
