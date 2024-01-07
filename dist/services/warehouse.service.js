"use strict";
// warehouse.service.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const db_mixin_1 = __importDefault(require("../mixins/db.mixin"));
const WarehouseService = {
    name: "warehouse",
    mixins: [(0, db_mixin_1.default)("warehouse")],
    settings: {
        fields: ["_id", "productId", "count"],
        entityValidator: {
            productId: "string|min:3",
            count: "number|integer|min:0",
        },
        indexes: [{ productId: 1 }],
    },
    actions: {
        // Get Product count against a given Product Id
        getProductCount: {
            rest: "GET /count/:productId",
            params: {
                productId: "string",
            },
            async handler(ctx) {
                try {
                    const { productId } = ctx.params;
                    // Call the 'products.getProductById' action to get the product details
                    const productDetails = await this.broker.call("products.getAvailableProducts", { productId });
                    // Find the product with the specified productId
                    const product = productDetails.products.find((p) => p.productId === productId);
                    // Return the product count or 0 if not found
                    return {
                        productId,
                        count: product ? product.quantity || 0 : 0,
                    };
                }
                catch (error) {
                    console.error("Error in getProductCount:", error);
                    throw error;
                }
            },
        },
        // Update Product count on Product buy
        updateProductCount: {
            rest: "POST /buy",
            params: {
                productId: "string",
                quantity: "number|integer|positive",
            },
            async handler(ctx) {
                const { productId, quantity } = ctx.params;
                // Call the 'products.buyProduct' action to buy the product
                const buyResult = await this.broker.call("products.buyProduct", { productId, quantity });
                if (!buyResult.success) {
                    return {
                        success: false,
                        message: "Product not found or insufficient quantity available.",
                    };
                }
                // Wait for the 'products.buyProduct' action to complete before proceeding
                await new Promise((resolve) => setTimeout(resolve, 1000)); // Adjust the timeout if needed
                // Update the product count in the warehouse
                const updatedWarehouseEntry = await this.adapter.updateById(buyResult.product_left?._id, {
                    $inc: { count: quantity },
                });
                const updatedWarehouseEntryJson = await this.transformDocuments(ctx, {}, updatedWarehouseEntry);
                await this.entityChanged("updated", updatedWarehouseEntryJson, ctx);
                return { success: true, message: `updated quantity is ${buyResult.product_left?.quantity}` };
            },
        },
    },
};
module.exports = WarehouseService;
