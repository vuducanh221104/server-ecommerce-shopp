# E-Commerce Server API

Backend API for the e-commerce platform built with Express.js and MongoDB.

## Getting Started

### Prerequisites

- Node.js (v14+)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository
2. Navigate to the Server directory
3. Install dependencies:

```bash
npm install
# or
yarn install
```

4. Create a `.env` file based on the `.env.example` file
5. Start the server:

```bash
npm start
# or
yarn start
```

For development with hot reload:

```bash
npm run dev
# or
yarn dev
```

## API Documentation

### Authentication

| Method | Endpoint              | Description                  | Access      |
|--------|----------------------|------------------------------|-------------|
| POST   | /api/v1/auth/register | Register a new user          | Public      |
| POST   | /api/v1/auth/login    | Login a user                 | Public      |
| POST   | /api/v1/auth/admin/login | Login as admin           | Public      |
| POST   | /api/v1/auth/refresh-token | Refresh access token    | User        |
| POST   | /api/v1/auth/logout   | Logout a user                | User        |

### Products

| Method | Endpoint              | Description                  | Access      |
|--------|----------------------|------------------------------|-------------|
| GET    | /api/v1/products     | Get all products             | Public      |
| GET    | /api/v1/products/:id | Get a product by ID          | Public      |
| GET    | /api/v1/products/slug/:slug | Get a product by slug | Public      |
| POST   | /api/v1/products     | Create a new product         | Admin       |
| PUT    | /api/v1/products/:id | Update a product             | Admin       |
| DELETE | /api/v1/products/:id | Delete a product             | Admin       |

### Categories

| Method | Endpoint              | Description                  | Access      |
|--------|----------------------|------------------------------|-------------|
| GET    | /api/v1/categories   | Get all categories           | Public      |
| GET    | /api/v1/categories/:id | Get a category by ID       | Public      |
| POST   | /api/v1/categories   | Create a new category        | Admin       |
| PUT    | /api/v1/categories/:id | Update a category          | Admin       |
| DELETE | /api/v1/categories/:id | Delete a category          | Admin       |

### Cart

| Method | Endpoint              | Description                  | Access      |
|--------|----------------------|------------------------------|-------------|
| GET    | /api/v1/cart         | Get user's cart              | User        |
| POST   | /api/v1/cart         | Add item to cart             | User        |
| PUT    | /api/v1/cart/:itemId | Update cart item             | User        |
| DELETE | /api/v1/cart/:itemId | Remove item from cart        | User        |

### Orders

| Method | Endpoint              | Description                  | Access      |
|--------|----------------------|------------------------------|-------------|
| GET    | /api/v1/orders       | Get all orders (admin)       | Admin       |
| GET    | /api/v1/orders/my    | Get user's orders            | User        |
| GET    | /api/v1/orders/:id   | Get order details            | User/Admin  |
| POST   | /api/v1/orders       | Create a new order           | User        |
| PUT    | /api/v1/orders/:id/status | Update order status     | Admin       |

### Comments

| Method | Endpoint              | Description                  | Access      |
|--------|----------------------|------------------------------|-------------|
| GET    | /api/v1/comments/product/:productId | Get product comments | Public |
| GET    | /api/v1/comments/product/:productId/stats | Get comment stats | Public |
| POST   | /api/v1/comments/product/:productId | Add a comment to product | User |
| DELETE | /api/v1/comments/product/:productId/comment/:commentId | Delete a comment | User/Admin |
| PATCH  | /api/v1/comments/product/:productId/comment/:commentId/status | Update comment status | Admin |

## Comment Feature

The comment feature allows users to rate and review products. Key features:

- Users can only comment on products they've purchased with a delivered order status
- Comments include text content and a star rating (1-5)
- Comments are stored directly in the product document
- Comment statistics provide average ratings and count by star
- Rate limiting prevents spam (5 comments per 15 minutes)
- Admin can moderate comments by approving, rejecting, or flagging them

### Comment Schema

```javascript
{
  user_id: ObjectId,      // Reference to User
  user_name: String,      // User's display name
  content: String,        // Comment text
  rating: Number,         // Rating (1-5)
  status: String,         // "PENDING", "APPROVED", "REJECTED", "FLAGGED"
  verified_purchase: Boolean, // Whether user has purchased this product
  createdAt: Date,        // Timestamp
  updatedAt: Date         // Timestamp
}
```

## Testing the API

You can use the test script to interact with the comment API:

```bash
node source/scripts/test-comments-api.js
```

## License

This project is licensed under the MIT License. 