import { NextApiRequest, NextApiResponse } from 'next';
import { GraphQLClient, gql } from 'graphql-request';

// Initialize the GraphQL Client pointing to your server
const graphQLClient = new GraphQLClient(process.env.GRAPHQL_ENDPOINT!);

// GraphQL Query for fetching applications by userId
const GET_APPLIED = gql`
  query getApplicationsById($userId: String!) {
    getApplicationsById(userId: $userId) {
      coverLetter
      createdAt
      cv
      Date
      email
      name
      phone
      userId
    }
  }
`;

// API handler for fetching applications
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'POST') {
    console.log('Request body:', req.body);
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    try {
      const variables = { userId };
      console.log('Fetching application data from GraphQL API for userId:', userId);
      
      const data: any = await graphQLClient.request(GET_APPLIED, variables);
      console.log('Received GraphQL response:', data);
      
      res.status(200).json(data.getApplicationsById);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error fetching applications:', error.message);
        res.status(500).json({ message: 'Error fetching applications', error: error.message });
      } else if (error && (error as { response?: { errors?: any } }).response) {
        console.error('Error fetching applications:', (error as { response: { errors: any } }).response.errors);
        res.status(500).json({
          message: 'Error fetching applications',
          error: (error as { response: { errors: any } }).response.errors,
        });
      } else {
        console.error('Unknown error:', error);
        res.status(500).json({ message: 'Error fetching applications', error: 'Unknown error' });
      }
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
};

export default handler;
