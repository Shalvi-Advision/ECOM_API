# Centralized Users Collection Migration

## Overview

This migration consolidates user data from scattered collections (`addressbooks` and `favorites`) into a centralized `users` collection for better data management and consistency.

## Problem Solved

**Before Migration:**
- User data scattered across `addressbooks` and `favorites` collections
- `addressbooks` collection used for both addresses AND user profiles
- No centralized user lifecycle management
- Inconsistent user identification (mobile_no in some places, user_id in others)

**After Migration:**
- Single `users` collection with complete user profiles
- `addressbooks` collection references `user_id` (addresses only)
- `favorites` collection references `user_id`
- Proper user authentication and profile management
- Consistent data structure across the application

## Data Structure

### Users Collection
```json
{
  "_id": ObjectId("..."),
  "mobile_no": "9702901943",
  "name": "John Doe",
  "email": "john@example.com",
  "user_type": "customer",
  "is_active": true,
  "created_at": "2025-09-19T04:55:59.866Z",
  "updated_at": "2025-09-19T04:55:59.866Z",
  "last_login": "2025-09-19T04:55:59.866Z"
}
```

### Addressbooks Collection (Updated)
```json
{
  "_id": ObjectId("..."),
  "user_id": ObjectId("..."), // Reference to users collection
  "mobile_number": "9702901943", // Kept for backward compatibility
  "full_name": "John Doe",
  "delivery_addr_line_1": "123 Main St",
  "delivery_addr_city": "Mumbai",
  "is_default": "Yes",
  "latitude": "19.0760",
  "longitude": "72.8777",
  "created_at": "2025-09-19T04:55:59.866Z"
}
```

### Favorites Collection (Updated)
```json
{
  "_id": ObjectId("..."),
  "user_id": ObjectId("..."), // Reference to users collection
  "mobile_no": "9702901943", // Kept for backward compatibility
  "p_code": "672",
  "store_code": "KLK",
  "added_at": "2025-09-19T04:55:59.866Z"
}
```

## Migration Steps

### Step 1: Generate Migration Data
```bash
cd ECOM_API
node scripts/migrate_users.js
```
This creates migration files in `migration_output/` directory.

### Step 2: Import Migrated Data
```bash
node scripts/import_migrated_data.js
```
This imports the centralized data into MongoDB collections.

### Step 3: Update API Routes
The following routes have been updated to work with the new structure:
- `routes/auth.js` - Authentication now creates/updates users in centralized collection
- `routes/users.js` - All user-related operations now reference the users collection

### Step 4: Test the System
Test the following endpoints:
- `POST /auth/validate_otp` - Should create users automatically
- `POST /users/get_customer_profile` - Should return profile from users collection
- `POST /users/add_address` - Should reference user_id
- `POST /users/get_address_list` - Should query by user_id
- `POST /users/add_remove_to_favorites` - Should reference user_id
- `POST /users/get_favorite_items` - Should query by user_id

## Migration Statistics

From the migration run:
- **2,177 unique users** consolidated from addressbooks and favorites
- **2,251 address records** updated with user references
- **2,002 favorite records** updated with user references

## API Changes

### Authentication
- `POST /auth/validate_otp` now automatically creates users in the `users` collection
- JWT tokens now include `user_id` in payload

### User Profile Management
- `POST /users/add_update_customer_profile` now updates the `users` collection
- `POST /users/get_customer_profile` now reads from the `users` collection

### Address Management
- `POST /users/add_address` now requires finding user by mobile_no and storing user_id reference
- `POST /users/get_address_list` now queries addresses by user_id
- `PUT /users/update_address/:address_id` remains unchanged

### Favorites Management
- `POST /users/add_remove_to_favorites` now stores user_id reference
- `POST /users/get_favorite_items` now queries favorites by user_id

## Backward Compatibility

- `mobile_number` and `mobile_no` fields are kept in addressbooks and favorites for backward compatibility
- API responses maintain the same structure where possible
- Old mobile-based queries still work during transition period

## Benefits of New Structure

1. **Single Source of Truth**: All user data in one collection
2. **Better Performance**: Faster user lookups and profile management
3. **Data Consistency**: No duplicate or conflicting user data
4. **Scalability**: Easier to add new user attributes
5. **Maintainability**: Clear separation of concerns (users vs addresses vs favorites)
6. **Analytics**: Better user analytics and reporting capabilities

## Rollback Plan

If you need to rollback:

1. Restore original collections from backups
2. Revert API route changes
3. Update client applications to use old endpoints

## Future Enhancements

With centralized users, you can now easily add:
- User preferences and settings
- Purchase history and analytics
- Loyalty program data
- Notification preferences
- Social features and referrals
- Advanced user segmentation

## Support

If you encounter issues during migration:
1. Check the migration logs for errors
2. Verify MongoDB connection
3. Ensure all dependencies are installed
4. Test individual endpoints before full deployment

---

**Migration completed on:** September 19, 2025
**Total users migrated:** 2,177
**Total addresses migrated:** 2,251
**Total favorites migrated:** 2,002
