# E-commerce API Collection

## 📋 Overview

This Postman collection contains all the API endpoints for the deployed e-commerce application. The API is built with Node.js, Express, and MongoDB Atlas, and is deployed on Render.

## 🚀 Base URL

**Production URL:** `https://ecom-api-ozl0.onrender.com`

## 🔧 Environment Variables

Set up these variables in your Postman environment:

| Variable | Value | Description |
|----------|-------|-------------|
| `base_url` | `https://ecom-api-ozl0.onrender.com` | Base URL for all API calls |
| `store_code` | `KLK` | Default store code (Kalyan) |
| `project_code` | `RET5890` | Project identifier |
| `access_key` | `T1234567890ABCDEF` | User authentication token |

## 📚 API Categories

### 1. 🔐 Authentication (SMS/OTP)
- **Send OTP**: `/api/auth/get_otp`
- **Validate OTP**: `/api/auth/validate_otp`

**Demo OTP:** Use `1234` for testing OTP validation

### 2. 📍 Pincode & Store Management
- **Check Pincode**: `/api/pincodes/check_if_pincode_exists`
- **Get Stores by Pincode**: `/api/pincodes/get_pincodewise_outlet`
- **Get Store Details**: `/api/pincodes/get_store_details`
- **Get All Pincodes**: `/api/pincodes/get_pincode_list`
- **Check Outlet Status**: `/api/pincodes/check_outlet_status`

### 3. 🏪 Department Management
- **Get All Departments**: `/api/departments/get_active_department_list`
- **Get Additional Offers**: `/api/departments/get_additional_offers`
- **Get Popular Categories**: `/api/departments/get_popular_category_list_[1-5]`
- **Get Seasonal Picks**: `/api/departments/get_seasonal_picks`

### 4. 📂 Category Management
- **Get Categories by Department**: `/api/categories/get_active_categories_list`
- **Get All Categories**: `/api/categories/get_all_categories`

### 5. 🏷️ Subcategory Management
- **Get Subcategories**: `/api/subcategories/get_sub_categories_list`

### 6. 📦 Product Management
- **Get Products List**: `/api/products/get_active_products_list`
- **Search Products**: `/api/products/get_search_autocomplete_results`
- **Get Best Sellers**: `/api/products/get_active_best_seller_[1-4]`
- **Get Product Details**: `/api/products/getpcodeproducts`
- **Get Products by Price Range**: `/api/products/get_products_by_price_range`

### 7. 🖼️ Banner Management
- **Get Banners by Type**: `/api/banners/get_banner`
- **Get Popup Banners**: `/api/banners/get_popup_screen`
- **Get All Banners**: `/api/banners/get_all_banners`
- **Get Banner Types**: `/api/banners/get_banner_types`

**Banner Types:**
- `1`: Home Slider 1
- `2`: Home Slider 2
- `3`: Bestseller 1
- `4`: Bestseller 2
- `5`: Loyalty Card
- `6`: Popup Screen
- `7`: Table Booking
- `8`: Product List
- `9`: Banquet Booking
- `10`: Seasonal Pick
- `11`: Bestseller 3
- `12`: Bestseller 4
- `13`: Offers
- `14`: Department

### 8. 🛒 Shopping Cart & Orders
- **Save Cart**: `/api/orders/save_cart`
- **Get Orders History**: `/api/orders/get_orders_history`
- **Get Delivery Charges**: `/api/orders/get_delivery_charges`
- **Get Discount Amount**: `/api/orders/get_discount_amount`
- **Get Handling Charges**: `/api/orders/get_handling_charges`
- **Get Delivery Slots**: `/api/orders/get_delivery_slot`
- **Confirm Order**: `/api/orders/confirm_order`
- **Order Payment Processing**: `/api/orders/order_payment_processing`
- **Validate Cart**: `/api/orders/validate_cart`

### 9. 👤 User Management
- **Add/Remove Favorites**: `/api/users/add_remove_to_favorites`
- **Get Favorite Items**: `/api/users/get_favorite_items`
- **Add Address**: `/api/users/add_address`
- **Get Address List**: `/api/users/get_address_list`
- **Update Address**: `/api/users/update_address/:id`
- **Add/Update Profile**: `/api/users/add_update_customer_profile`
- **Get Customer Profile**: `/api/users/get_customer_profile`

### 10. 💳 Payment Management
- **Get Payment Modes**: `/api/payments/get_payment_mode`
- **Get Payment Statuses**: `/api/payments/get_payment_status`

### 11. 🔧 Health & Migration
- **Health Check**: `/api/health`
- **Migration Endpoints**: `/api/migration/*`

## 📝 Request/Response Format

### Standard Request Headers
```json
{
  "Content-Type": "application/json"
}
```

### Standard Response Format
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { /* Response data */ },
  "count": 10, // Optional count
  "pagination": { /* Pagination info */ } // For paginated responses
}
```

### Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

## 🔍 Common Parameters

### Required Parameters (most endpoints)
- `store_code`: Store identifier (e.g., "KLK", "ULN")
- `project_code`: Project identifier ("RET5890")
- `access_key`: User authentication token (from OTP login)

### Optional Parameters
- `page`: Page number for pagination (default: 1)
- `limit`: Number of items per page (default: 10-50)
- `device_id`: Device identifier for tracking

## 🧪 Testing Workflow

### 1. Authentication Flow
1. **Send OTP** → Get OTP on mobile
2. **Validate OTP** → Get access_key (use `1234` for demo)
3. **Use access_key** → For all authenticated requests

### 2. Product Browsing Flow
1. **Get Departments** → Browse categories
2. **Get Categories** → By selected department
3. **Get Products** → With filters and pagination
4. **Search Products** → By name/keywords

### 3. Shopping Flow
1. **Add to Cart** → Save cart items
2. **Validate Cart** → Check availability
3. **Get Delivery Charges** → Calculate shipping
4. **Get Delivery Slots** → Choose delivery time
5. **Confirm Order** → Place order

### 4. User Management Flow
1. **Add Address** → Save delivery addresses
2. **Get Address List** → View saved addresses
3. **Add to Favorites** → Save favorite products
4. **Get Favorites** → View favorite items

## 📊 Sample Data

### Store Codes
- `KLK`: Kalyan
- `ULN`: Ulhasnagar
- `KLT`: Kalyan West
- `DOW`: Dombivli West

### Department IDs
- `1`: Household Items
- `2`: Grocery & Staples
- `3`: Personal Care
- `4`: Baby Care
- `5`: Beverages
- `6`: Noodles, Sauces & Instant Food
- `7`: Bakery, Dairy & Frozen
- `8`: Biscuits, Snacks & Chocolates
- `11`: Seasonal Picks

## ⚡ Performance Notes

- **Response Time**: Typically < 2 seconds
- **Pagination**: Use for large datasets (products, categories)
- **Caching**: Implement client-side caching for better UX
- **Rate Limiting**: 100 requests per 15 minutes per IP

## 🐛 Troubleshooting

### Common Issues:
1. **CORS Errors**: Ensure correct origin in CORS settings
2. **Authentication Errors**: Check access_key validity
3. **Store Code Errors**: Verify store_code exists
4. **Timeout Errors**: Check network connectivity

### Debug Tips:
- Use Postman's Console for detailed request/response logs
- Check network tab for request timing
- Verify environment variables are set correctly

## 📞 Support

For API issues or questions:
- Check the health endpoint: `GET /api/health`
- Review error messages in responses
- Ensure all required parameters are included
- Use correct data types in request bodies

## 🔄 Version History

- **v1.0.0**: Complete e-commerce API with 50+ endpoints
- **Deployed**: Render (Production)
- **Database**: MongoDB Atlas with 258K+ records
- **Features**: Authentication, Products, Cart, Orders, Users

---

**Happy Testing! 🚀**
