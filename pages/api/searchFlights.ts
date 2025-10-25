import { NextApiRequest, NextApiResponse } from 'next';
import { GraphQLClient, gql } from 'graphql-request';
import { Flight } from '../../interfaces/flight';

const searchFlights = async (req: NextApiRequest, res: NextApiResponse) => {
  const { from, to } = req.body;
 console.log(req.body)
  const graphQLClient = new GraphQLClient(process.env.GRAPHQL_ENDPOINT!);

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

  try {
                                                                                                                                                                                        
    const variables = { fromAirport: from, toAirport:to };
    const data: any = await graphQLClient.request(query, variables);
    const flights: Flight[] = data.searchFlights;

    res.status(200).json(flights);
  }catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error searching flights:', error.message);
      res.status(500).json({ message: 'Error searching flights' });
    } else if (error instanceof Response) {
      // If the error has a `response` property (e.g., network request errors)
      console.error('Error searching flights:', error.statusText || 'Unknown network error');
      res.status(500).json({ message: 'Error searching flights' });
    } else {
      // Handle unknown error type
      console.error('Error searching flights: Unknown error');
      res.status(500).json({ message: 'Error searching flights' });
    }
  }
  
};

export default searchFlights;
