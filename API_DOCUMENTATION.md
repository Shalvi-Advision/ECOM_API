# E-commerce API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
Most endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## API Endpoints

### Health Check
- **GET** `/api/health`
- **Description**: Check if the API is running
- **Response**: 
```json
{
  "status": "OK",
  "message": "E-commerce API is running",
  "timestamp": "2025-01-11T19:43:07.000Z"
}
```

### Authentication Endpoints

#### Register User
- **POST** `/api/auth/register`
- **Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "password": "password123"
}
```
- **Response**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "1234567890",
      "role": "user"
    },
    "token": "jwt_token"
  }
}
```

#### Login User
- **POST** `/api/auth/login`
- **Body**:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get User Profile
- **GET** `/api/auth/profile`
- **Headers**: `Authorization: Bearer <token>`

#### Update User Profile
- **PUT** `/api/auth/profile`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
```json
{
  "name": "Updated Name",
  "phone": "9876543210"
}
```

### Product Endpoints

#### Get All Products
- **GET** `/api/products`
- **Query Parameters**:
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page (default: 20)
  - `category_id` (optional): Filter by category
  - `sub_category_id` (optional): Filter by subcategory
  - `dept_id` (optional): Filter by department
  - `store_code` (optional): Filter by store
  - `search` (optional): Search term
  - `min_price` (optional): Minimum price filter
  - `max_price` (optional): Maximum price filter
  - `sort_by` (optional): Sort field (default: createdAt)
  - `sort_order` (optional): Sort direction (asc/desc, default: desc)

#### Get Product by ID
- **GET** `/api/products/:id`

#### Get Products by Category
- **GET** `/api/products/category/:categoryId`

#### Get Featured Products
- **GET** `/api/products/featured/list`
- **Query Parameters**:
  - `limit` (optional): Number of products (default: 10)

#### Search Products
- **GET** `/api/products/search/:query`
- **Query Parameters**:
  - `page` (optional): Page number
  - `limit` (optional): Items per page

### Category Endpoints

#### Get All Categories
- **GET** `/api/categories`
- **Query Parameters**:
  - `dept_id` (optional): Filter by department
  - `store_code` (optional): Filter by store

#### Get Category by ID
- **GET** `/api/categories/:id`

#### Get Categories by Department
- **GET** `/api/categories/department/:deptId`

### Department Endpoints

#### Get All Departments
- **GET** `/api/departments`

#### Get Department by ID
- **GET** `/api/departments/:id`

### Subcategory Endpoints

#### Get All Subcategories
- **GET** `/api/subcategories`
- **Query Parameters**:
  - `category_id` (optional): Filter by category

#### Get Subcategory by ID
- **GET** `/api/subcategories/:id`

#### Get Subcategories by Category
- **GET** `/api/subcategories/category/:categoryId`

### Banner Endpoints

#### Get Active Banners
- **GET** `/api/banners`
- **Query Parameters**:
  - `store_code` (optional): Filter by store
  - `banner_type_id` (optional): Filter by banner type

#### Get Banner by ID
- **GET** `/api/banners/:id`

### Pincode Endpoints

#### Get All Pincodes
- **GET** `/api/pincodes`
- **Query Parameters**:
  - `is_enabled` (optional): Filter by enabled status

#### Check Pincode Serviceability
- **GET** `/api/pincodes/check/:pincode`
- **Response**:
```json
{
  "success": true,
  "data": {
    "is_serviceable": true,
    "pincode": {
      "pincode": "421002",
      "is_enabled": "Enabled"
    },
    "available_stores": [...]
  }
}
```

#### Get Pincode by ID
- **GET** `/api/pincodes/id/:id`

### Payment Endpoints

#### Get Payment Modes
- **GET** `/api/payments/modes`

#### Get Payment Statuses
- **GET** `/api/payments/statuses`

### Order Endpoints

#### Create Order
- **POST** `/api/orders`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
```json
{
  "items": [
    {
      "product_id": "product_id",
      "quantity": 2
    }
  ],
  "delivery_address": {
    "name": "John Doe",
    "phone": "1234567890",
    "address_line_1": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001"
  },
  "payment_mode": "Online Payment",
  "store_code": "AME",
  "delivery_slot": "slot_id",
  "notes": "Delivery instructions"
}
```

#### Get User Orders
- **GET** `/api/orders`
- **Headers**: `Authorization: Bearer <token>`
- **Query Parameters**:
  - `page` (optional): Page number
  - `limit` (optional): Items per page
  - `status` (optional): Filter by order status

#### Get Order by ID
- **GET** `/api/orders/:id`
- **Headers**: `Authorization: Bearer <token>`

#### Cancel Order
- **PUT** `/api/orders/:id/cancel`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
```json
{
  "reason": "Change of mind"
}
```

### User Management Endpoints

#### Add Product to Favorites
- **POST** `/api/users/favorites`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
```json
{
  "product_id": "product_id"
}
```

#### Remove Product from Favorites
- **DELETE** `/api/users/favorites/:productId`
- **Headers**: `Authorization: Bearer <token>`

#### Get User's Favorite Products
- **GET** `/api/users/favorites`
- **Headers**: `Authorization: Bearer <token>`
- **Query Parameters**:
  - `page` (optional): Page number
  - `limit` (optional): Items per page

#### Add Address
- **POST** `/api/users/addresses`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
```json
{
  "type": "home",
  "name": "John Doe",
  "phone": "1234567890",
  "address_line_1": "123 Main St",
  "address_line_2": "Apt 4B",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "landmark": "Near Station",
  "is_default": true
}
```

#### Update Address
- **PUT** `/api/users/addresses/:addressId`
- **Headers**: `Authorization: Bearer <token>`

#### Delete Address
- **DELETE** `/api/users/addresses/:addressId`
- **Headers**: `Authorization: Bearer <token>`

## Response Format

All API responses follow this format:

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  },
  "pagination": {
    // Pagination info (when applicable)
    "current_page": 1,
    "total_pages": 10,
    "total_items": 200,
    "has_next": true,
    "has_prev": false
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message",
  "errors": [
    // Validation errors (when applicable)
  ]
}
```

## HTTP Status Codes

- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

The API implements rate limiting:
- 100 requests per 15 minutes per IP address
- Rate limit headers are included in responses

## Data Models

### Product
```json
{
  "p_code": "2390",
  "barcode": "SB3",
  "product_name": "SABUDANA 250 (N.W.)",
  "product_description": "INDIAN CHASKA (PKT) STK_GRO,UPVAS SABUDANA UPWAS 250 GM PLS",
  "package_size": 250,
  "package_unit": "GM",
  "product_mrp": 20.00,
  "our_price": 18.00,
  "brand_name": "INDIAN CHASKA (PKT)",
  "store_code": "AVB",
  "pcode_status": "Y",
  "dept_id": "2",
  "category_id": "89",
  "sub_category_id": "349",
  "store_quantity": 33,
  "max_quantity_allowed": 10,
  "pcode_img": "https://retailmagic.in/cdn/RET3163/2390_1.webp",
  "discount_percentage": 10
}
```

### Category
```json
{
  "idcategory_master": "118",
  "category_name": "Maha Bachat",
  "dept_id": "18",
  "sequence_id": 1,
  "store_code": "AME",
  "no_of_col": "12",
  "image_link": "https://patelrmart.com/mgmt_panel/sites/default/files/category/thumbnail/1_0.jpg",
  "category_bg_color": "#FFFF00"
}
```

### Order
```json
{
  "order_id": "ORD1234567890",
  "user_id": "user_id",
  "items": [
    {
      "product_id": "product_id",
      "p_code": "2390",
      "product_name": "SABUDANA 250 (N.W.)",
      "quantity": 2,
      "unit_price": 18.00,
      "total_price": 36.00
    }
  ],
  "delivery_address": {
    "name": "John Doe",
    "phone": "1234567890",
    "address_line_1": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001"
  },
  "store_code": "AME",
  "order_status": "pending",
  "payment_status": "pending",
  "payment_mode": "Online Payment",
  "subtotal": 36.00,
  "delivery_charge": 0,
  "total_amount": 36.00
}
```

## Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Set Environment Variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB credentials
   ```

3. **Upload Data** (if needed):
   ```bash
   npm run upload-data
   ```

4. **Start Server**:
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

5. **Test API**:
   ```bash
   curl http://localhost:5000/api/health
   ```

## Database Statistics

- **Products**: 250,000+ products uploaded
- **Categories**: 3,830 categories
- **Subcategories**: 388 subcategories
- **Departments**: 9 departments
- **Banners**: 336 banners
- **Pincodes**: 22 serviceable pincodes
- **Payment Modes**: 4 payment options
- **Delivery Slots**: 1 delivery slot configuration

The API is now ready for integration with your frontend applications!
