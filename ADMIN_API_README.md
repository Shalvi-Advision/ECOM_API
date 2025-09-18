# Admin API Documentation

This document provides comprehensive documentation for the Admin API endpoints created for the E-commerce API system.

## Admin Authentication

All admin routes require authentication with admin privileges. Use the admin login endpoint to obtain a token, then include it in the Authorization header as `Bearer <token>`.

### Admin Login Credentials (Demo)
- **Super Admin**: username: `admin`, password: `admin123`
- **Manager**: username: `manager`, password: `manager123`
- **Staff**: username: `staff`, password: `staff123`

## Base URL
All admin endpoints are prefixed with `/api/admin/`

---

## 🔐 Admin Authentication Routes

### 1. Admin Login
**POST** `/api/admin/auth/admin_login`

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin123",
  "project_code": "your_project_code"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Admin login successful",
  "data": {
    "username": "admin",
    "admin_role": "super_admin",
    "authenticated": true,
    "token": "jwt_token_here",
    "token_type": "Bearer",
    "expires_in": "7d"
  }
}
```

### 2. Admin Logout
**POST** `/api/admin/auth/admin_logout`

**Headers:** `Authorization: Bearer <token>`

### 3. Verify Admin Token
**POST** `/api/admin/auth/verify_admin_token`

**Request Body:**
```json
{
  "token": "jwt_token_here"
}
```

### 4. Refresh Admin Token
**POST** `/api/admin/auth/refresh_admin_token`

**Request Body:**
```json
{
  "token": "jwt_token_here"
}
```

### 5. Get Admin Profile
**POST** `/api/admin/auth/get_admin_profile`

**Request Body:**
```json
{
  "token": "jwt_token_here"
}
```

---

## 📦 Products Management

### 1. Get All Products
**POST** `/api/admin/products/get_all_products`

**Request Body:**
```json
{
  "page": 1,
  "limit": 50,
  "search": "product_name",
  "category_id": "category_id",
  "dept_id": "dept_id",
  "sort_by": "product_name",
  "sort_order": "asc"
}
```

### 2. Get Product by ID
**POST** `/api/admin/products/get_product_by_id`

**Request Body:**
```json
{
  "product_id": "mongodb_object_id"
}
```

### 3. Create Product
**POST** `/api/admin/products/create_product`

**Request Body:**
```json
{
  "p_code": "P001",
  "product_name": "Product Name",
  "category_id": "category_id",
  "sub_category_id": "sub_category_id",
  "dept_id": "dept_id",
  "selling_price": 100.00,
  "mrp": 120.00,
  "description": "Product description",
  "image_url": "image_url",
  "stock_quantity": 10,
  "is_active": true,
  "sequence_id": 1,
  "store_code": "store_code"
}
```

### 4. Update Product
**POST** `/api/admin/products/update_product`

**Request Body:**
```json
{
  "product_id": "mongodb_object_id",
  "product_name": "Updated Product Name",
  "selling_price": 150.00,
  // ... other fields to update
}
```

### 5. Delete Product
**POST** `/api/admin/products/delete_product`

**Request Body:**
```json
{
  "product_id": "mongodb_object_id"
}
```

### 6. Bulk Update Products
**POST** `/api/admin/products/bulk_update_products`

**Request Body:**
```json
{
  "product_ids": ["id1", "id2"],
  "update_data": {
    "is_active": false,
    "selling_price": 200.00
  }
}
```

### 7. Update Product Stock
**POST** `/api/admin/products/update_product_stock`

**Request Body:**
```json
{
  "product_id": "mongodb_object_id",
  "stock_quantity": 50,
  "operation": "set" // "set", "add", "subtract"
}
```

---

## 📂 Categories Management

### 1. Get All Categories
**POST** `/api/admin/categories/get_all_categories`

### 2. Get Category by ID
**POST** `/api/admin/categories/get_category_by_id`

### 3. Create Category
**POST** `/api/admin/categories/create_category`

**Request Body:**
```json
{
  "category_id": "C001",
  "category_name": "Category Name",
  "dept_id": "dept_id",
  "sequence_id": 1,
  "is_active": true,
  "image_url": "image_url",
  "description": "Category description"
}
```

### 4. Update Category
**POST** `/api/admin/categories/update_category`

### 5. Delete Category
**POST** `/api/admin/categories/delete_category`

### 6. Get Categories by Department
**POST** `/api/admin/categories/get_categories_by_department`

### 7. Bulk Update Categories
**POST** `/api/admin/categories/bulk_update_categories`

---

## 🏢 Departments Management

### 1. Get All Departments
**POST** `/api/admin/departments/get_all_departments`

### 2. Get Department by ID
**POST** `/api/admin/departments/get_department_by_id`

### 3. Create Department
**POST** `/api/admin/departments/create_department`

**Request Body:**
```json
{
  "dept_id": "D001",
  "dept_name": "Department Name",
  "sequence_id": 1,
  "is_active": true,
  "image_url": "image_url",
  "description": "Department description"
}
```

### 4. Update Department
**POST** `/api/admin/departments/update_department`

### 5. Delete Department
**POST** `/api/admin/departments/delete_department`

### 6. Bulk Update Departments
**POST** `/api/admin/departments/bulk_update_departments`

### 7. Get Department Statistics
**POST** `/api/admin/departments/get_department_stats`

---

## 📋 Subcategories Management

### 1. Get All Subcategories
**POST** `/api/admin/subcategories/get_all_subcategories`

### 2. Get Subcategory by ID
**POST** `/api/admin/subcategories/get_subcategory_by_id`

### 3. Create Subcategory
**POST** `/api/admin/subcategories/create_subcategory`

### 4. Update Subcategory
**POST** `/api/admin/subcategories/update_subcategory`

### 5. Delete Subcategory
**POST** `/api/admin/subcategories/delete_subcategory`

### 6. Get Subcategories by Category
**POST** `/api/admin/subcategories/get_subcategories_by_category`

### 7. Bulk Update Subcategories
**POST** `/api/admin/subcategories/bulk_update_subcategories`

---

## 📢 Banners Management

### 1. Get All Banners
**POST** `/api/admin/banners/get_all_banners`

### 2. Get Banner by ID
**POST** `/api/admin/banners/get_banner_by_id`

### 3. Create Banner
**POST** `/api/admin/banners/create_banner`

**Request Body:**
```json
{
  "banner_title": "Banner Title",
  "banner_description": "Banner Description",
  "banner_image_url": "image_url",
  "banner_type": "general",
  "banner_link": "link_url",
  "sequence_id": 1,
  "is_active": true,
  "start_date": "2024-01-01",
  "end_date": "2024-12-31"
}
```

### 4. Update Banner
**POST** `/api/admin/banners/update_banner`

### 5. Delete Banner
**POST** `/api/admin/banners/delete_banner`

### 6. Bulk Update Banners
**POST** `/api/admin/banners/bulk_update_banners`

### 7. Get Active Banners
**POST** `/api/admin/banners/get_active_banners`

---

## 📍 Pincodes Management

### 1. Get All Pincodes
**POST** `/api/admin/pincodes/get_all_pincodes`

### 2. Get Pincode by ID
**POST** `/api/admin/pincodes/get_pincode_by_id`

### 3. Create Pincode
**POST** `/api/admin/pincodes/create_pincode`

**Request Body:**
```json
{
  "pincode": "400001",
  "area_name": "Area Name",
  "city": "City Name",
  "state": "State Name",
  "district": "District Name",
  "store_code": "store_code",
  "delivery_charge": 50.00,
  "min_order_amount": 100.00,
  "estimated_delivery_days": 2,
  "is_active": true
}
```

### 4. Update Pincode
**POST** `/api/admin/pincodes/update_pincode`

### 5. Delete Pincode
**POST** `/api/admin/pincodes/delete_pincode`

### 6. Bulk Update Pincodes
**POST** `/api/admin/pincodes/bulk_update_pincodes`

### 7. Check Pincode Serviceability
**POST** `/api/admin/pincodes/check_pincode_serviceability`

---

## 👥 Users Management

### 1. Get All Users
**POST** `/api/admin/users/get_all_users`

### 2. Get User by ID
**POST** `/api/admin/users/get_user_by_id`

### 3. Create User
**POST** `/api/admin/users/create_user`

### 4. Update User
**POST** `/api/admin/users/update_user`

### 5. Delete User
**POST** `/api/admin/users/delete_user`

### 6. Bulk Update Users
**POST** `/api/admin/users/bulk_update_users`

### 7. Get User Statistics
**POST** `/api/admin/users/get_user_stats`

---

## 📦 Orders Management

### 1. Get All Orders
**POST** `/api/admin/orders/get_all_orders`

### 2. Get Order by ID
**POST** `/api/admin/orders/get_order_by_id`

### 3. Update Order Status
**POST** `/api/admin/orders/update_order_status`

**Request Body:**
```json
{
  "order_id": "order_id",
  "order_status": "confirmed", // pending, confirmed, preparing, ready, delivered, cancelled
  "delivery_notes": "Delivery notes"
}
```

### 4. Update Payment Status
**POST** `/api/admin/orders/update_payment_status`

**Request Body:**
```json
{
  "order_id": "order_id",
  "payment_status": "paid", // pending, paid, failed
  "payment_notes": "Payment notes"
}
```

### 5. Bulk Update Order Status
**POST** `/api/admin/orders/bulk_update_order_status`

### 6. Get Order Statistics
**POST** `/api/admin/orders/get_order_stats`

### 7. Get Orders by Date Range
**POST** `/api/admin/orders/get_orders_by_date_range`

---

## 💰 Payments Management

### 1. Get All Payments
**POST** `/api/admin/payments/get_all_payments`

### 2. Get Payment by ID
**POST** `/api/admin/payments/get_payment_by_id`

### 3. Update Payment Status
**POST** `/api/admin/payments/update_payment_status`

### 4. Bulk Update Payment Status
**POST** `/api/admin/payments/bulk_update_payment_status`

### 5. Get Payment Statistics
**POST** `/api/admin/payments/get_payment_stats`

### 6. Process Refund
**POST** `/api/admin/payments/process_refund`

**Request Body:**
```json
{
  "payment_id": "payment_id",
  "refund_amount": 100.00,
  "refund_reason": "Customer request",
  "refund_notes": "Refund processed"
}
```

### 7. Get Payments by Date Range
**POST** `/api/admin/payments/get_payments_by_date_range`

---

## 📊 Common Features

All admin endpoints support:

1. **Pagination**: `page` and `limit` parameters
2. **Search**: `search` parameter for text-based filtering
3. **Sorting**: `sort_by` and `sort_order` parameters
4. **Filtering**: Entity-specific filters
5. **Bulk Operations**: Update multiple records at once
6. **Statistics**: Get aggregated data and insights

## 🔒 Security Features

- **JWT Authentication**: All admin routes require valid JWT tokens
- **Admin Role Verification**: Only users with `user_type: 'admin'` can access admin routes
- **Input Validation**: All inputs are validated before processing
- **Error Handling**: Comprehensive error handling with meaningful messages

## 📝 Response Format

All responses follow a consistent format:

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "pagination": { ... }, // for list endpoints
  "filters": { ... } // for filtered endpoints
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

## 🚀 Getting Started

1. **Login as Admin:**
   ```bash
   POST /api/admin/auth/admin_login
   {
     "username": "admin",
     "password": "admin123",
     "project_code": "your_project_code"
   }
   ```

2. **Use the Token:**
   Include the token in Authorization header for all subsequent requests:
   ```
   Authorization: Bearer <your_jwt_token>
   ```

3. **Start Managing:**
   Use any of the CRUD endpoints to manage your e-commerce data.

---

This admin API provides comprehensive management capabilities for your e-commerce platform. All endpoints are secured and follow RESTful conventions with consistent response formats.
