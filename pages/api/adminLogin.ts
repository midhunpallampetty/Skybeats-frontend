import { ApolloClient, InMemoryCache, gql } from '@apollo/client';
import { NextApiRequest, NextApiResponse } from 'next';

// Initialize Apollo Client
const client = new ApolloClient({
  uri: "https://skybeatscloud.upskillr.online/graphql", // Replace with your GraphQL API endpoint
  cache: new InMemoryCache(),
});

// GraphQL Mutation
const ADMIN_LOGIN_MUTATION = gql`
  mutation adminLogin($email: String!, $password: String!, $adminType: String!) {
    adminLogin(email: $email, password: $password, adminType: $adminType) {
       adminaccessToken
       adminrefreshToken
      admin {
        email
        adminType
      }
    }
  }
`;

// Next.js API Route
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email, password, adminType } = req.body;

  // Validate request body
  if (!email || !password || !adminType) {
    return res.status(400).json({ error: 'Email, password, and admin type are required.' });
  }

  try {
    // Execute the GraphQL mutation
    const { data } = await client.mutate({
      mutation: ADMIN_LOGIN_MUTATION,
      variables: { email, password, adminType },
    });

    const { adminaccessToken, adminrefreshToken,admin } = data.adminLogin;

    // Return the token and admin details
    res.status(200).json({ adminaccessToken, adminrefreshToken ,admin});
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error during admin login:', error.message);
      res.status(500).json({
        error: 'Failed to log in as admin.',
        details: error.message,
      });
    } else {
      console.error('Unexpected error during admin login:', error);
      res.status(500).json({
        error: 'Failed to log in as admin.',
        details: 'An unexpected error occurred.',
      });
    }
  }
  
}
