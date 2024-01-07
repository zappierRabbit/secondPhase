// warehouse.service.ts

import { Context, Service, ServiceSchema } from "moleculer";
import DbMixin from "../mixins/db.mixin";
interface ProductEntity {
    _id: string;
    name: string;
    quantity: number;
    price: number;
    productId: string;
}

interface GetProductCountContext extends Context {
    params: { productId: string };
}

const WarehouseService: ServiceSchema = {
    name: "warehouse",
    mixins: [DbMixin("warehouse")],

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
            async handler(
                this: Service,
                ctx: GetProductCountContext
            ): Promise<{ productId: string; count: number }> {
                try {
                    const { productId } = ctx.params;

                    // Call the 'products.getProductById' action to get the product details
                    const productDetails: { products: ProductEntity[] } = await this.broker.call(
                        "products.getAvailableProducts",
                        { productId }
                    );

                    // Find the product with the specified productId
                    const product = productDetails.products.find((p) => p.productId === productId);

                    // Return the product count or 0 if not found
                    return {
                        productId,
                        count: product ? product.quantity || 0 : 0,
                    };
                } catch (error) {
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
            async handler(
                this: Service,
                ctx: Context<{ productId: string; quantity: number }>
            ): Promise<{ success: boolean; message?: string; }> {
                const { productId, quantity } = ctx.params;

                // Call the 'products.buyProduct' action to buy the product
                const buyResult: { success: boolean; product_left?: ProductEntity } = await this.broker.call(
                    "products.buyProduct",
                    { productId, quantity }
                );

                if (!buyResult.success) {
                    return {
                        success: false,
                        message: "Product not found or insufficient quantity available.",
                    };
                }

                // Wait for the 'products.buyProduct' action to complete before proceeding
                await new Promise((resolve) => setTimeout(resolve, 1000)); // Adjust the timeout if needed

                // Update the product count in the warehouse
                const updatedWarehouseEntry = await this.adapter.updateById(
                    buyResult.product_left?._id,
                    {
                        $inc: { count: quantity },
                    }
                );

                const updatedWarehouseEntryJson = await this.transformDocuments(
                    ctx,
                    {},
                    updatedWarehouseEntry
                );
                await this.entityChanged("updated", updatedWarehouseEntryJson, ctx);
                return { success: true, message: `updated quantity is ${buyResult.product_left?.quantity}` };
            },
        },
    },
};

export = WarehouseService;
