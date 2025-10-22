import { ApolloClient, InMemoryCache, gql } from '@apollo/client';
import { NextApiRequest, NextApiResponse } from 'next';

const client = new ApolloClient({
  uri:process.env.GRAPHQL_ENDPOINT, // Your GraphQL API endpoint
  cache: new InMemoryCache(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const SIGNIN_MUTATION = gql`
    mutation userLogin($email: String!, $password: String!) {
      userLogin(email: $email, password: $password) {
        accessToken
        refreshToken
        user {
          id
          email
          isBlocked
        }
      }
    }
  `;

  try {
    const { data } = await client.mutate({
      mutation: SIGNIN_MUTATION,
      variables: { email, password },
    });

    const { accessToken, refreshToken, user } = data.userLogin;

    console.log(accessToken, refreshToken);

    // Set cookies using the Set-Cookie header
    res.setHeader('Set-Cookie', [
      `accessToken=${accessToken};  Secure=${
        process.env.NODE_ENV === 'production'
      };  Path=/; Max-Age=${60 * 60}`,
      `refreshToken=${refreshToken}; Secure=${
        process.env.NODE_ENV === 'production'
      };  Path=/; Max-Age=${60 * 60 * 24 * 7}`,
    ]);

    return res.status(200).json({
      user,
    });
  } catch (error: any) {
    console.error('Error during login:', error);

    if (error.networkError) {
      return res
        .status(502)
        .json({ error: 'Failed to connect to the GraphQL server.' });
    }

    return res.status(401).json({
      error: 'Invalid credentials or internal server error.',
      details: error.message,
    });
  }
}
