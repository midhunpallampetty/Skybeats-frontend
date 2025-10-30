import { NextApiRequest, NextApiResponse } from 'next';
import { GraphQLClient, gql } from 'graphql-request';
import { Flight } from '../../interfaces/flight';

// Retry function (unchanged)
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
      console.log(`Retry attempt ${attempt}/${maxRetries} failed:`, error);

      if (attempt >= maxRetries) {
        throw lastError;
      }

      const delayMs = baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * 100;
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
}

// Custom fetch with shorter timeout
const createFetchWithTimeout = (timeoutMs: number = 3000) =>  // Reduced to 3s
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
  console.log('Request body:', req.body);
  console.log('Start time:', new Date().toISOString());

  if (!from || !to) {
    return res.status(400).json({ message: 'From and To airports are required' });
  }

  const graphQLClient = new GraphQLClient(process.env.GRAPHQL_ENDPOINT!, {
    fetch: createFetchWithTimeout(3000),
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

  const executeSearch = async () => {
    console.log('Executing GraphQL query...');
    const startQuery = Date.now();
    const variables = { fromAirport: from, toAirport: to };
    const data: any = await graphQLClient.request(query, variables);
    console.log(`Query took ${Date.now() - startQuery}ms`);
    return data.searchFlights as Flight[];
  };

  try {
    const flights: Flight[] = await retryWithBackoff(executeSearch, 10);
    console.log('Success - Flights found:', flights?.length || 0);
    res.status(200).json(flights || []);
  } catch (error: unknown) {
    console.error('Final error after retries:', error);
    console.log('End time:', new Date().toISOString());
    
    if (error instanceof Error && error.name === 'AbortError') {
      res.status(408).json({ message: 'GraphQL endpoint timeout - try again later' });
    } else {
      res.status(500).json({ 
        message: 'Flight search unavailable after retries',
        attempts: 10,
        error: error instanceof Error ? error.message : 'Unknown'
      });
    }
  }
};

export default searchFlights;
