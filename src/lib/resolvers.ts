import { AnyObject } from "mongoose";
import { ObjectIdLike } from "bson";
import database from "./db";
import { MatchKeysAndValues, ObjectId } from "mongodb";

const resolvers = {
	Wishlist: {
		id: (parent: { id: any; _id: any }) => parent.id ?? parent._id,
		wishes: async (parent: { id: any; _id: any }) => {
			let collection = database.collection("wishes");
			let wishes = await collection.find({ wishlist_id: new ObjectId(parent.id ?? parent._id) }).toArray();
			return wishes;
		},
	},
	Wish: {
		id: (parent: { id: any; _id: any }) => parent.id ?? parent._id,
	},
	Profile: {
		id: (parent: { id: any; _id: any }) => parent.id ?? parent._id,
	},
	Query: {
		async wishlist(_: any, { id }: { id: any }) {
			let collection = database.collection("wishlists");
			let query = { _id: new ObjectId(id) };

			return await collection.findOne(query);
		},
		async wishlists(_: any, __: any) {
			let collection = database.collection("wishlists");
			const wishlists = await collection.find({}).toArray();
			console.log(wishlists);
			return wishlists;
		},
		wishlistsByUser: async (_: any, { user_id }: { user_id: any }) => {
			let collection = database.collection("wishlists");
			const wishlists = await collection.find({ user_id }).toArray();
			return wishlists;
		},
		async wish(_: any, { id }: { id: any }) {
			let collection = database.collection("wishes");
			let query = { _id: new ObjectId(id) };

			return await collection.findOne(query);
		},
		async wishes(_: any, __: any) {
			let collection = database.collection("wishes");
			const wishes = await collection.find({}).toArray();
			return wishes;
		},
		wishesByWishlist: async (_: any, { wishlist_id }: { wishlist_id: any }) => {
			let collection = database.collection("wishes");
			let wishes = await collection.find({ wishlist_id: new ObjectId(wishlist_id) }).toArray();
			return wishes.sort((a, b) => a.order - b.order);
		},
		async profileByUser(_: any, { user_id }: { user_id: any }) {
			let collection = database.collection("profiles");
			const profile = await collection.findOne({ user_id });
			return profile;
		},
	},
	Mutation: {
		async createWishlist(_: any, { name, user_id }: { name: any; user_id: any }) {
			let collection = database.collection("wishlists");
			const date_created = new Date();
			const insert = await collection.insertOne({ name, user_id, date_created });
			if (insert.acknowledged) return { name, user_id, date_created, id: insert.insertedId };
			return null;
		},
		async updateWishlist(_: any, args: { id: any }) {
			const id = new ObjectId(args.id);
			let query = { _id: new ObjectId(id) };
			let collection = database.collection("wishlists");
			const update = await collection.updateOne(query, { $set: { ...args } });

			if (update.acknowledged) return await collection.findOne(query);

			return null;
		},
		async deleteWishlist(_: any, { id }: { id: any }) {
			let collection = database.collection("wishlists");
			const databaseDelete = await collection.deleteOne({ _id: new ObjectId(id) });
			return databaseDelete.acknowledged && databaseDelete.deletedCount == 1 ? true : false;
		},
		async createWish(
			_: any,
			{ wishlist_id, name, description, price, link, img_url }: { wishlist_id: any; name: any; description: any; price: any; link: any; img_url: any }
		) {
			let collection = database.collection("wishes");

			// Get the current count of wishes in the wishlist
			let order = await collection.countDocuments({ wishlist_id: new ObjectId(wishlist_id) });

			let insert = await collection.insertOne({ wishlist_id: new ObjectId(wishlist_id), name, description, price, link, img_url, order });

			if (insert.acknowledged) return { wishlist_id, name, description, price, link, img_url, id: insert.insertedId, order };

			return null;
		},
		async updateWish(_: any, args: any | MatchKeysAndValues<AnyObject> | undefined) {
			const id = new ObjectId(args.id);
			let query = { _id: new ObjectId(id) };
			let collection = database.collection("wishes");
			const update = await collection.updateOne(query, { $set: { ...args } });

			if (update.acknowledged) return await collection.findOne(query);

			return null;
		},
		async deleteWish(_: any, { id }: any) {
			let wishesCollection = database.collection("wishes");

			// Find the wish to get the wishlist_id
			const wish = await wishesCollection.findOne({ _id: new ObjectId(id) });

			if (!wish) {
				throw new Error("Wish not found");
			}

			// Delete the wish
			const databaseDelete = await wishesCollection.deleteOne({ _id: new ObjectId(id) });

			if (databaseDelete.acknowledged && databaseDelete.deletedCount == 1) {
				return true;
			}

			return false;
		},
		async updateProfileImageUrl(_: any, args: any | MatchKeysAndValues<AnyObject> | undefined) {
			const user_id = args.user_id;
			let collection = database.collection("profiles");
			const update = await collection.updateOne({ user_id }, { $set: { ...args } }, { upsert: true });

			if (update.acknowledged) return await collection.findOne({ user_id });

			return null;
		},
		updateWishOrder: async (_: any, { wishlist_id, wishes }: any) => {
			if (wishes.length === 0) return [];

			let collection = database.collection("wishes");

			let bulkOperations = wishes.map((wish: { id: string | number | ObjectId | ObjectIdLike | Uint8Array | undefined }, i: any) => ({
				updateOne: {
					filter: { _id: new ObjectId(wish.id) },
					update: { $set: { order: i } },
				},
			}));

			await collection.bulkWrite(bulkOperations);

			let updatedWishes = await collection.find({ wishlist_id: new ObjectId(wishlist_id) }).toArray();
			return updatedWishes.sort((a, b) => a.order - b.order);
		},
	},
};

export default resolvers;
