import { NextApiRequest, NextApiResponse } from 'next';
import { GraphQLClient, gql } from 'graphql-request';
import { Flight } from '../../interfaces/flight';

// Retry function with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 10,
  baseDelayMs: number = 500
): Promise<T> {
  let lastError: unknown;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      attempt++;

      if (attempt >= maxRetries) {
        throw lastError;
      }

      // Exponential backoff with jitter
      const delayMs = baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * 100;
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  throw lastError; // Fallback (unreachable)
}

// Custom fetch with timeout for GraphQLClient
const createFetchWithTimeout = (timeoutMs: number = 5000) => 
  async (input: RequestInfo | URL, init?: RequestInit) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(input, { ...init, signal: controller.signal });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  };

const searchFlights = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { from, to } = req.body;
  console.log(req.body);

  if (!from || !to) {
    return res.status(400).json({ message: 'From and To airports are required' });
  }

  const graphQLClient = new GraphQLClient(process.env.GRAPHQL_ENDPOINT!, {
    fetch: createFetchWithTimeout(5000), // 5s timeout per request
  });

  const query = gql`
    query searchFlights($fromAirport: String!, $toAirport: String!) {
      searchFlights(fromAirport: $fromAirport, toAirport: $toAirport) {
        airline
        arrivalAirport
        departureAirport
        arrivalTime
        departureTime
        duration
        price
        stops
        flightNumber
      }
    }
  `;

  console.log(from, to);

  const executeSearch = async () => {
    const variables = { fromAirport: from, toAirport: to };
    const data: any = await graphQLClient.request(query, variables);
    return data.searchFlights as Flight[];
  };

  try {
    // Retry up to 10 times with backoff
    const flights: Flight[] = await retryWithBackoff(executeSearch, 10);
    
    // Return empty array if no flights found (treat as success)
    res.status(200).json(flights || []);
  } catch (error: unknown) {
    console.error('Error searching flights after retries:', error);
    
    if (error instanceof Error && 'name' in error && error.name === 'AbortError') {
      res.status(408).json({ message: 'Request timeout - GraphQL endpoint too slow' });
    } else {
      res.status(500).json({ 
        message: 'No flights found or service unavailable after multiple attempts',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
};

export default searchFlights;

// Configure max duration for Vercel (add to top of file or vercel.json)
export const maxDuration = 55; // Up to 60s on Hobby with Fluid Compute
