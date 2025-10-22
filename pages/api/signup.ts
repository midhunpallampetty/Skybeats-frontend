import { ApolloClient, InMemoryCache, gql } from '@apollo/client';
import { NextApiRequest, NextApiResponse } from 'next';

// Initialize Apollo Client
const client = new ApolloClient({
  uri: process.env.GRAPHQL_ENDPOINT, // Ensure you set your GraphQL API endpoint in the environment variable
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
        message
      }
    }
  `;

  try {
    // Execute the mutation using Apollo Client
    const { data } = await client.mutate({
      mutation: SIGNUP_MUTATION,
      variables: { username, email, password },
    });

    // Return the message (e.g., "OTP sent to your email") in the response
    res.status(200).json({
      message: data.userSignup.message,
    });
  } catch (error: unknown) {
    console.error('Error during signup:', error);
  
    // Check if the error is an instance of Error to safely access its properties
    if (error instanceof Error) {
      res.status(500).json({
        error: 'Internal Server Error',
        details: error.message || 'An unknown error occurred.',
      });
    } else {
      // If error is not an instance of Error, handle it as an unknown type
      console.error('Unknown error during signup:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        details: 'An unknown error occurred.',
      });
    }
  }
  
}
