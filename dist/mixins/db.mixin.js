"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const moleculer_db_1 = __importDefault(require("moleculer-db"));
const moleculer_db_adapter_mongo_1 = __importDefault(require("moleculer-db-adapter-mongo"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
function createDbServiceMixin(collection) {
    const cacheCleanEventName = `cache.clean.${collection}`;
    const schema = {
        mixins: [moleculer_db_1.default],
        events: {
            /**
             * Subscribe to the cache clean event. If it's triggered
             * clean the cache entries for this service.
             */
            async [cacheCleanEventName]() {
                if (this.broker.cacher) {
                    await this.broker.cacher.clean(`${this.fullName}.*`);
                }
            },
        },
        methods: {
            /**
             * Send a cache clearing event when an entity changed.
             */
            async entityChanged(type, json, ctx) {
                await ctx.broadcast(cacheCleanEventName);
            },
        },
        async started() {
            // Check the count of items in the DB. If it's empty,
            // call the `seedDB` method of the service.
            if (this.seedDB) {
                const count = await this.adapter.count();
                if (count === 0) {
                    this.logger.info(`The '${collection}' collection is empty. Seeding the collection...`);
                    await this.seedDB();
                    this.logger.info("Seeding is done. Number of records:", await this.adapter.count());
                }
            }
        },
    };
    if (process.env.MONGO_URI) {
        // Mongo adapter
        schema.adapter = new moleculer_db_adapter_mongo_1.default(process.env.MONGO_URI);
        schema.collection = collection;
    }
    else if (process.env.NODE_ENV === "test") {
        // NeDB memory adapter for testing
        schema.adapter = new moleculer_db_1.default.MemoryAdapter();
    }
    else {
        // NeDB file DB adapter
        if (!fs_1.default.existsSync("./data")) {
            fs_1.default.mkdirSync("./data");
        }
        schema.adapter = new moleculer_db_1.default.MemoryAdapter({ filename: `./data/${collection}.db` });
    }
    return schema;
}
exports.default = createDbServiceMixin;
