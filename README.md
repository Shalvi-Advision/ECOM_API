# E-commerce API Backend

A comprehensive REST API backend for the Patel Mart e-commerce platform built with Node.js, Express.js, and MongoDB Atlas.

## Features

- **Product Management**: Full CRUD operations for products with search, filtering, and pagination
- **Category Management**: Hierarchical category system with departments and subcategories
- **User Authentication**: JWT-based authentication with registration and login
- **Order Management**: Complete order processing with status tracking
- **Address Management**: Multiple address support for users
- **Favorites**: Product wishlist functionality
- **Pincode Service**: Delivery area validation
- **Payment Integration**: Multiple payment modes and status tracking
- **Banner Management**: Dynamic banner system for promotions

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB Atlas
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Express Validator
- **Security**: Helmet, CORS, Rate Limiting
- **Documentation**: Built-in API documentation

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Shalvi-Advision/ECOM_API.git
cd ECOM_API
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Update the `.env` file with your MongoDB Atlas credentials and other configurations.

5. Upload data to MongoDB:
```bash
npm run upload-data
```

6. Start the server:
```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Products
- `GET /api/products` - Get all products (with pagination and filters)
- `GET /api/products/:id` - Get product by ID
- `GET /api/products/category/:categoryId` - Get products by category
- `GET /api/products/featured/list` - Get featured products
- `GET /api/products/search/:query` - Search products

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get category by ID
- `GET /api/categories/department/:deptId` - Get categories by department

### Departments
- `GET /api/departments` - Get all departments
- `GET /api/departments/:id` - Get department by ID

### Subcategories
- `GET /api/subcategories` - Get all subcategories
- `GET /api/subcategories/:id` - Get subcategory by ID
- `GET /api/subcategories/category/:categoryId` - Get subcategories by category

### Banners
- `GET /api/banners` - Get active banners
- `GET /api/banners/:id` - Get banner by ID

### Pincodes
- `GET /api/pincodes` - Get all pincodes
- `GET /api/pincodes/check/:pincode` - Check if pincode is serviceable
- `GET /api/pincodes/id/:id` - Get pincode by ID

### Payments
- `GET /api/payments/modes` - Get payment modes
- `GET /api/payments/statuses` - Get payment statuses

### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get order by ID
- `PUT /api/orders/:id/cancel` - Cancel order

### Users
- `POST /api/users/favorites` - Add product to favorites
- `DELETE /api/users/favorites/:productId` - Remove product from favorites
- `GET /api/users/favorites` - Get user's favorite products
- `POST /api/users/addresses` - Add address
- `PUT /api/users/addresses/:addressId` - Update address
- `DELETE /api/users/addresses/:addressId` - Delete address

## Database Schema

The API uses the following main collections:

- **departments**: Store departments (e.g., Grocery & Staples, Personal Care)
- **categories**: Store product categories within departments
- **subcategories**: Store subcategories within categories
- **products**: Store product information with pricing and inventory
- **banners**: Store promotional banners
- **pincodes**: Store serviceable pincodes
- **pincodestores**: Store pincode-store mapping with delivery charges
- **paymentmodes**: Store available payment methods
- **paymentstatuses**: Store payment status options
- **deliveryslots**: Store available delivery time slots
- **users**: Store user accounts and preferences
- **orders**: Store order information and status

## Environment Variables

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000,https://your-frontend-domain.com
```

**Note**: `FRONTEND_URL` is optional. If not provided, the API will accept requests from any origin. For production, specify your frontend domain(s) separated by commas.

## Data Upload

The project includes a comprehensive data upload script that processes JSON files from the Patel Mart database and uploads them to MongoDB Atlas. The script handles:

- Department masters
- Category masters
- Subcategory masters
- Product masters (with batch processing for large datasets)
- Banner masters
- Pincode masters
- Pincode store masters
- Payment modes
- Payment statuses
- Delivery slots

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting to prevent abuse
- CORS configuration
- Helmet for security headers
- Input validation and sanitization
- Error handling and logging

## API Response Format

All API responses follow a consistent format:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  },
  "pagination": {
    // Pagination info (when applicable)
  }
}
```

## Error Handling

The API includes comprehensive error handling with appropriate HTTP status codes and descriptive error messages.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team.
