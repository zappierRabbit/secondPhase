// products.service.ts

import type { Context, Service, ServiceSchema } from "moleculer";
import DbMixin from "../mixins/db.mixin";

interface ProductEntity {
    _id: string;
    name: string;
    quantity: number;
    price: number;
    productId: string;
}

interface GetAvailableProductsContext extends Context {
    params: {};
}

const ProductsService: ServiceSchema = {
    name: "products",
    mixins: [DbMixin("products")],

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
            async handler(
                this: Service,
            ): Promise<{ products: ProductEntity[] }> {
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
            async handler(this: Service, ctx: Context<{ productId: string; quantity: number }>) {
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

export = ProductsService;
