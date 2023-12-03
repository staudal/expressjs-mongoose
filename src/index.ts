import "./lib/db";
import express from "express";
import countryRoutes from "./routes/country";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import gql from "graphql-tag";
import { ApolloServer } from "@apollo/server";
import { buildSubgraphSchema } from "@apollo/subgraph";
import { readFileSync } from "fs";
import resolvers from "./lib/resolvers";
import { expressMiddleware } from "@apollo/server/express4";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3333;

app.use(express.json());
app.use(express.raw({ type: "application/vnd.custom-type" }));
app.use(express.text({ type: "text/html" }));

const typeDefs = gql(
	readFileSync(resolve(__dirname, "..", "schema.graphql"), {
		encoding: "utf-8",
	})
);

const schema = buildSubgraphSchema({ typeDefs, resolvers });
const server = new ApolloServer({
	schema,
});

// Note you must call `start()` on the `ApolloServer`
// instance before passing the instance to `expressMiddleware`
await server.start();

// Define a middleware function
const requestLogger = (req: { method: any; url: any }, res: any, next: () => void) => {
	next();
};

// Add the middleware function to the express app before the GraphQL endpoint
app.use("/graphql", requestLogger, expressMiddleware(server));

app.get("/", async (req, res) => {
	res.json({ message: "Please visit /countries to view all the countries" });
});

app.use("/countries", countryRoutes);

app.listen(port, () => {
	console.log(`Example app listening at http://localhost:${port}`);
});
