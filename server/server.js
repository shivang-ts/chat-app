const { GraphQLServer, PubSub } = require('graphql-yoga');//PublishSubscribe handler fm GQL

const messages = [];
/* Defining the schema for message
!mark means field is required
 */

const typeDefs = `
    type Message {
        id: ID!
        user: String!
        content: String!
    }
    type Query {
        messages: [Message!]
    }
    type Mutation{
        postMessage(user: String!, content: String!) :ID! 
    }
    type Subscription{
        messages: [Message!]
    }
`;//postMessage returns the ID created 

/*Defining resolvers to get the data. Resolvers match the keys present in 
typeDefs*/

const subscribers = [];
const onMessagesUpdates = (fn) => subscribers.push(fn);

const resolvers = {
    Query: {
        messages: () => messages,
    },
    Mutation: {
        postMessage: (parent, {user,content}) => {
            const id = messages.length;
            messages.push({
                id,
                user,
                content
            });
            subscribers.forEach((fn) => fn());
            return id;
         },
    },
    Subscription: {
        messages: {
            subscribe: (parent, args, {pubsub}) => {
                const channel = Math.random().toString(36).slice(2,15);
                onMessagesUpdates(() => pubsub.publish(channel, {messages}));
                setTimeout(() => pubsub.publish( channel, { messages }), 0);
                return pubsub.asyncIterator(channel);              
            },
        },
    },
};

const pubsub = new PubSub();
const server = new GraphQLServer({typeDefs, resolvers, context: {pubsub}});
server.start(({port}) => {
    console.log(`Server started on http://localhost:${port}/`);
} )