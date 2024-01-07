# Sample project

## Overview

This project consists of two microservices, [Products Service] and [Warehouse Service], both designed to manage product information and inventory. The backend database used is MongoDB.

## Microservices

### Products Service

#### Endpoints:

1. **Get Available Products:**
   - **Method:** GET
   - **Endpoint:** `/products`
   - **Description:** Retrieves a list of available products.

2. **Buy a Product:**
   - **Method:** POST
   - **Endpoint:** `/products/buy`
   - **Params:**
     - `productId` (string): The ID of the product to buy.
     - `quantity` (number): The quantity of the product to purchase.
   - **Description:** Allows the purchase of a specified quantity of a product. Updates the product count in the database.

### Warehouse Service

#### Endpoints:

1. **Get Product Count:**
   - **Method:** GET
   - **Endpoint:** `/warehouse/count/:productId`
   - **Params:**
     - `productId` (string): The ID of the product to get the count for.
   - **Description:** Retrieves the count of a product in the warehouse.

2. **Update Product Count on Product Buy:**
   - **Method:** POST
   - **Endpoint:** `/warehouse/buy`
   - **Params:**
     - `productId` (string): The ID of the product to update the count for.
     - `quantity` (number): The quantity of the product being bought.
   - **Description:** Updates the product count in the warehouse upon a purchase.

## Getting Started

1. Clone the repository

2. Navigate to the project folder

3. Create a `.env` file in the root of the project with the following content:

   ```env
   MONGO_URI=<your-mongo-db-uri>
   ```

   Ensure that your MongoDB instance is accessible, or you can use a hosted MongoDB service.

4. Run the project using Docker Compose:

   ```bash
   npm run dc:up
   ```

   This command will start the microservices and set up the necessary containers.

## Notes

- The project assumes that MongoDB is hosted on the cloud. Make sure to replace `<your-mongo-db-uri>` in the `.env` file with the actual URI.

- The project can be easily set up using Docker Compose. Use the provided npm script (`npm run dc:up`) to start the project.
