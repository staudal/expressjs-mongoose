import express from "express";
import { resolve } from "path";
import gql from "graphql-tag";
import { ApolloServer } from "@apollo/server";
import { buildSubgraphSchema } from "@apollo/subgraph";
import { readFileSync } from "fs";
import resolvers from "./lib/resolvers";
import { expressMiddleware } from "@apollo/server/express4";

const cwd = process.cwd();

const app = express();
const port = process.env.PORT || 3333;

app.use(express.json());
app.use(express.raw({ type: "application/vnd.custom-type" }));
app.use(express.text({ type: "text/html" }));

const typeDefs = gql(
	readFileSync(resolve(cwd, ".", "schema.graphql"), {
		encoding: "utf-8",
	})
);

const initializeServer = async () => {
	const schema = buildSubgraphSchema({ typeDefs, resolvers });
	const server = new ApolloServer({
		schema,
	});

	await server.start();

	const requestLogger = (req: any, res: any, next: () => void) => {
		next();
	};

	app.use("/graphql", requestLogger, expressMiddleware(server));

	app.get("/", async (req, res) => {
		res.json({ message: "Please visit /countries to view all the countries" });
	});

	app.listen(port, () => {
		console.log(`Example app listening at http://localhost:${port}`);
	});
};

initializeServer().catch((error) => {
	console.error("Error initializing server:", error);
});
