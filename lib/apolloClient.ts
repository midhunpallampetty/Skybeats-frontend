import { ApolloClient, InMemoryCache } from '@apollo/client';
const   client=new ApolloClient({
<<<<<<< HEAD
    uri:'https://skybeats.site/graphql',
=======
    uri:'http://localhost:3300/graphql',
>>>>>>> 97fc021 (test commit after ui animation)
    cache:new InMemoryCache(),
});
export default client;
