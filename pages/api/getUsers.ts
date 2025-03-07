import { NextApiRequest, NextApiResponse } from 'next';
import { GraphQLClient, gql } from 'graphql-request';

const getUsers = async (req: NextApiRequest, res: NextApiResponse) => {
    const graphQLClient = new GraphQLClient(process.env.GRAPHQL_ENDPOINT!);

    const query = gql`
        query getUserList {
            getUserList {
                email
                username
                isBlocked
                id

            }
        }
    `;

    try {
        const data:any = await graphQLClient.request(query);

        const users: String[] = data.getUserList;
        res.status(200).json(users);
    } catch (error: any) {
        console.error('Error fetching users:', error.message);
        res.status(500).json({ message: 'Error fetching users' });
    }
};

export default getUsers;
