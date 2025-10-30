import { NextApiRequest, NextApiResponse } from 'next';
import { GraphQLClient, gql } from 'graphql-request';
import { Flight } from '../../interfaces/flight';

// Helper: timeout wrapper
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Request timed out')), ms);
    promise
      .then((res) => {
        clearTimeout(timeout);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timeout);
        reject(err);
      });
  });
}

const searchFlights = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { from, to } = req.body;

  if (!from || !to) {
    return res.status(400).json({ message: 'Missing "from" or "to" parameters' });
  }

  console.log('✈️ Searching flights from:', from, 'to:', to);

  const endpoint = process.env.GRAPHQL_ENDPOINT;
  if (!endpoint) {
    console.error('❌ Missing GRAPHQL_ENDPOINT environment variable');
    return res.status(500).json({ message: 'Server configuration error' });
  }

  const graphQLClient = new GraphQLClient(endpoint);

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

  try {
    const start = Date.now();
    const variables = { fromAirport: from, toAirport: to };

    const data: any = await withTimeout(graphQLClient.request(query, variables), 7000);
    console.log(`✅ GraphQL request completed in ${Date.now() - start}ms`);

    const flights: Flight[] = data?.searchFlights || [];
    return res.status(200).json(flights);
  } catch (error: any) {
    console.error('❌ Error searching flights:', error.message || error);

    if (error.message === 'Request timed out') {
      return res.status(504).json({ message: 'Upstream service timeout' });
    }

    return res.status(500).json({ message: 'Error searching flights', error: error.message });
  }
};

export default searchFlights;
