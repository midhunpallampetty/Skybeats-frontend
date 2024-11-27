import { ApolloClient, InMemoryCache, gql } from '@apollo/client';
import { NextApiRequest, NextApiResponse } from 'next';

// Initialize Apollo Client
const client = new ApolloClient({
  uri: process.env.GRAPHQL_ENDPOINT!, // Ensure you set your GraphQL API endpoint in the environment variable
  cache: new InMemoryCache(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check if the request method is POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Destructure username, email, and password from the request body
  const { username, email, password } = req.body;

  // Validate if username, email, and password are provided
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password are required.' });
  }

  // GraphQL mutation for user signup
  const SIGNUP_MUTATION = gql`
    mutation userSignup($username: String!, $email: String!, $password: String!) {
      userSignup(username: $username, email: $email, password: $password) {
        accessToken
        refreshToken
        user {
          email
        }
      }
    }
  `;

  try {
    // Execute the mutation using Apollo Client
    const { data } = await client.mutate({
      mutation: SIGNUP_MUTATION,
      variables: { username, email, password },
    });

    // Return the tokens and user data in the response
    res.status(200).json({
      accessToken: data.userSignup.accessToken,
      refreshToken: data.userSignup.refreshToken,
      user: data.userSignup.user,
    });
  } catch (error: any) {
    console.error('Error during signup:', error);

    // Return an internal server error response if something goes wrong
    res.status(500).json({
      error: 'Internal Server Error',
      details: error.message || 'An unknown error occurred.',
    });
  }
}