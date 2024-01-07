"use strict";
// products.service.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const db_mixin_1 = __importDefault(require("../mixins/db.mixin"));
const ProductsService = {
    name: "products",
    mixins: [(0, db_mixin_1.default)("products")],
    settings: {
        fields: ["_id", "name", "quantity", "price", "productId"],
        entityValidator: {
            name: "string|min:3",
            price: "number|positive",
            quantity: "number|integer|min:0",
            productId: "string|min:3"
        },
        indexes: [{ name: 1 }],
    },
    actions: {
        // Get Available Products
        getAvailableProducts: {
            rest: "GET /",
            async handler() {
                const products = await this.adapter.find({});
                return { products };
            },
        },
        // Buy a Product
        buyProduct: {
            rest: "POST /buy",
            params: {
                productId: "string",
                quantity: "number|integer|positive",
            },
            async handler(ctx) {
                const { productId, quantity } = ctx.params;
                // Check if the product exists
                const existingProduct = await this.adapter.findOne({ productId });
                if (!existingProduct) {
                    return { error: "Product not found." };
                }
                // Check if the requested quantity is available
                if (existingProduct.quantity < quantity) {
                    return { error: "Insufficient quantity available." };
                }
                // Update the quantity in the database
                const updatedProduct = await this.adapter.updateById(existingProduct._id, {
                    $inc: { quantity: -quantity },
                });
                const updatedProductJson = await this.transformDocuments(ctx, {}, updatedProduct);
                await this.entityChanged("updated", updatedProductJson, ctx);
                // Return the success flag and the updated product
                return { success: true, product_left: updatedProductJson };
            },
        },
    },
};
module.exports = ProductsService;
