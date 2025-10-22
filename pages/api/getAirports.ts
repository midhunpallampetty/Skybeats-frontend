import { NextApiRequest, NextApiResponse } from 'next';

const AIRPORT_DATA_URL = 'https://res.cloudinary.com/dgnjzuwqu/raw/upload/v1761150308/airport-city_gq1oop.txt'; 

// Cache to store fetched airport data
let airportCache: any[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Serve from cache if data is still valid
    if (airportCache && Date.now() - lastFetchTime < CACHE_DURATION) {
      return res.status(200).json(airportCache);
    }

    // Fetch and parse data
    const response = await fetch(AIRPORT_DATA_URL, { cache: 'no-store' }); // Avoid redundant cache fetches
    if (!response.ok) throw new Error(`Failed to fetch airport data. Status: ${response.status}`);

    const airports = await response.json();

    // Cache the fetched data
    airportCache = airports;
    lastFetchTime = Date.now();

    res.status(200).json(airports);
  } catch (error: unknown) {
    console.error('Error fetching airports:', error);
    res.status(500).json({ message: 'Error fetching airports' });
  }
}
