import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const imdbUrlOrId = searchParams.get('query');

    if (!imdbUrlOrId) {
        return NextResponse.json({ error: 'IMDb URL or ID is required' }, { status: 400 });
    }

    // Extract the IMDb ID (e.g., tt0903747) using Regex
    const match = imdbUrlOrId.match(/tt\d+/);
    if (!match) {
        return NextResponse.json({ error: 'Invalid IMDb ID or URL format' }, { status: 400 });
    }
    const imdbId = match[0];

    try {
        // 1. Query TVmaze's lookup system via the IMDb ID (fetch follows redirects automatically)
        const lookupResponse = await fetch(`https://api.tvmaze.com/lookup/shows?imdb=${imdbId}`, {
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 3600 } // Cache results for 1 hour to optimize speed
        });

        if (!lookupResponse.ok) {
            if (lookupResponse.status === 404) {
                return NextResponse.json({ error: 'Series not found in open databases.' }, { status: 404 });
            }
            return NextResponse.json({ error: 'Metadata server rejected request.' }, { status: lookupResponse.status });
        }

        const showData = await lookupResponse.json();
        const showId = showData.id;

        // 2. Fetch the entire episode map to calculate accurate season/episode counts
        const episodesResponse = await fetch(`https://api.tvmaze.com/shows/${showId}/episodes`);
        let seasonsCount = 1;
        let totalEpisodes = 0;

        if (episodesResponse.ok) {
            const episodes = await episodesResponse.json();
            totalEpisodes = episodes.length;

            // Extract the highest season integer recorded across the episode timeline
            const seasonNumbers = episodes.map(ep => ep.season).filter(Boolean);
            if (seasonNumbers.length > 0) {
                seasonsCount = Math.max(...seasonNumbers);
            }
        }

        // Return a clean payload back to your client-side Modal inputs
        return NextResponse.json({
            title: showData.name || '',
            imageUrl: showData.image?.original || showData.image?.medium || '',
            seasons: seasonsCount,
            totalEpisodes: totalEpisodes
        });

    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error: ' + error.message }, { status: 500 });
    }
}