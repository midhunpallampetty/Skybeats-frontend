import { NextApiRequest, NextApiResponse } from 'next';
import { ApolloClient, InMemoryCache, gql } from '@apollo/client';

const client = new ApolloClient({
  uri: process.env.GRAPHQL_ENDPOINT!, // Replace with your actual GraphQL API URI
  cache: new InMemoryCache(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { bookingId } = req.body;

  if (!bookingId) {
    return res.status(400).json({ error: 'Booking ID is required' });
  }

  // Mutation to cancel the hotel booking
  const CANCEL_HOTEL_MUTATION = gql`
    mutation CancelHotel($bookingId: String!) {
      cancelHotel(BookingId: $bookingId) {
        amount
        email
      }
    }
  `;

  try {
    // Perform the mutation
    const { data } = await client.mutate({
      mutation: CANCEL_HOTEL_MUTATION,
      variables: { bookingId },
    });

    // Return the relevant data from the mutation
    res.status(200).json(data.cancelHotel);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error cancelling hotel:', error.message);
      res.status(500).json({ error: 'An error occurred while cancelling the hotel booking.', details: error.message });
    } else {
      console.error('Unexpected error cancelling hotel:', error);
      res.status(500).json({ error: 'An unexpected error occurred while cancelling the hotel booking.' });
    }
  }
  
}
