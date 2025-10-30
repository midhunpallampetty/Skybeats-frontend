import { NextApiRequest, NextApiResponse } from 'next';
import { GraphQLClient, gql } from 'graphql-request';
import { Flight } from '../../interfaces/flight';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchFlightsWithRetry(
  client: GraphQLClient,
  query: string,
  variables: any,
  retries = 10,
  delay = 2000
): Promise<any> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Attempt ${attempt}: fetching flights...`);
      const data = await client.request(query, variables);
      console.log(`✅ Success on attempt ${attempt}`);
      return data;
    } catch (err: any) {
      console.error(`❌ Attempt ${attempt} failed:`, err.message);
      if (attempt < retries) {
        console.log(`⏳ Retrying in ${delay / 1000}s...`);
        await sleep(delay);
      } else {
        throw new Error(`Failed after ${retries} attempts`);
      }
    }
  }
}

const searchFlights = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { from, to } = req.body;
  if (!from || !to) {
    return res.status(400).json({ message: 'Missing "from" or "to" parameters' });
  }

  const endpoint = process.env.GRAPHQL_ENDPOINT;
  if (!endpoint) {
    return res.status(500).json({ message: 'GRAPHQL_ENDPOINT missing' });
  }

  const client = new GraphQLClient(endpoint);

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
    const data = await fetchFlightsWithRetry(client, query, { fromAirport: from, toAirport: to });
    const flights: Flight[] = data.searchFlights;
    res.status(200).json(flights);
  } catch (error: any) {
    console.error('💥 Final failure:', error.message);
    res.status(500).json({ message: 'Failed to fetch flights after multiple retries' });
  }
};

export default searchFlights;
