# Hierarchy API Rewrite - Complete Guide

## Overview
This document outlines the complete rewrite of the Categories, SubCategories, and Products APIs to ensure proper hierarchy structure: **Department → Category → SubCategory → Product**.

## What Was Fixed

### 1. Model Updates
- **Category Model**: Changed `dept_id` from `String` to `mongoose.Schema.Types.ObjectId` with proper reference to Department
- **All Models**: Added proper indexes for hierarchical queries
- **Relationships**: Ensured all ObjectId references are properly defined

### 2. API Route Fixes
- **Categories API** (`/routes/categories.js`):
  - ✅ Fixed broken GET /:id route (was returning test message)
  - ✅ Updated population to use mongoose populate instead of manual helpers
  - ✅ Added support for both ObjectId and string ID parameters
  - ✅ Fixed validation for ObjectId references

- **SubCategories API** (`/routes/subcategories.js`):
  - ✅ Updated all routes to use mongoose populate
  - ✅ Added full hierarchy population (Department → Category → SubCategory)
  - ✅ Added support for filtering by department and category
  - ✅ Improved error handling for invalid references

- **Products API** (`/routes/products.js`):
  - ✅ Replaced manual population with mongoose populate for better performance
  - ✅ Updated all CRUD operations to use proper population
  - ✅ Added support for hierarchical filtering (by department, category, subcategory)
  - ✅ Improved error handling and validation

### 3. Hierarchy Structure
```
Department (ObjectId)
└── Category (references Department via ObjectId)
    └── SubCategory (references Category via ObjectId)
        └── Product (references all three via ObjectId)
```

## Migration Scripts

### Important: Run Migration Before Using APIs
The existing data uses string IDs, but the new models expect ObjectId references. You **must** run the migration script to convert existing data.

### How to Run Migration

1. **Backup your data first** (recommended):
```bash
cd /Users/gauravpawar/Desktop/shalvi revamp/ECOM_API
node scripts/backupCollections.js
```

2. **Run the migration**:
```bash
node scripts/runHierarchyMigration.js
```

This will:
- Create a backup of all collections
- Convert Category `dept_id` strings to ObjectId references
- Validate all references and report any issues
- Ensure data integrity

### Test the APIs

After migration, test that everything works:

```bash
node scripts/testHierarchyAPIs.js
```

This will test all endpoints and verify the hierarchy structure.

## API Endpoints

### Departments
- `GET /api/departments` - Get all departments
- `GET /api/departments/:id` - Get department by ID (supports both ObjectId and department_id string)

### Categories
- `GET /api/categories` - Get all categories (with optional dept_id and store_code filters)
- `GET /api/categories/:id` - Get category by ID (supports both ObjectId and idcategory_master string)
- `GET /api/categories/department/:deptId` - Get categories by department
- `POST /api/categories` - Create category (Admin only)
- `PUT /api/categories/:id` - Update category (Admin only)
- `DELETE /api/categories/:id` - Delete category (Admin only)

### SubCategories
- `GET /api/subcategories` - Get all subcategories (with optional category_id and dept_id filters)
- `GET /api/subcategories/:id` - Get subcategory by ID (supports both ObjectId and idsub_category_master string)
- `GET /api/subcategories/category/:categoryId` - Get subcategories by category
- `POST /api/subcategories` - Create subcategory (Admin only)
- `PUT /api/subcategories/:id` - Update subcategory (Admin only)
- `DELETE /api/subcategories/:id` - Delete subcategory (Admin only)

### Products
- `GET /api/products` - Get all products (with comprehensive filtering)
- `GET /api/products/:id` - Get product by p_code
- `GET /api/products/category/:categoryId` - Get products by category
- `GET /api/products/subcategory/:subCategoryId` - Get products by subcategory
- `GET /api/products/department/:deptId` - Get products by department
- `GET /api/products/store/:store_code` - Get products by store
- `GET /api/products/search/:query` - Search products
- `GET /api/products/featured/list` - Get featured products
- `POST /api/products` - Create product (Admin only)
- `PUT /api/products/:id` - Update product (Admin only)
- `DELETE /api/products/:id` - Delete product (Admin only)

## Key Improvements

### 1. Consistent ID Handling
All APIs now support both ObjectId and legacy string ID formats for backward compatibility.

### 2. Proper Population
- Uses mongoose `populate()` for efficient data loading
- Includes full hierarchy information in responses
- Optimized database queries with proper indexes

### 3. Better Error Handling
- Validates references before operations
- Provides clear error messages for missing/invalid data
- Handles edge cases gracefully

### 4. Hierarchical Filtering
- Products can be filtered by department, category, or subcategory
- Subcategories can be filtered by department or category
- Maintains referential integrity throughout

### 5. Performance Optimizations
- Proper database indexes for hierarchical queries
- Efficient population strategies
- Reduced database calls through smart caching

## Troubleshooting

### Common Issues

1. **"Department not found" errors**: Run the migration script to convert string IDs to ObjectId references
2. **Empty results**: Check that the referenced entities exist and are properly linked
3. **Performance issues**: Ensure database indexes are created (they're defined in the models)

### Verification Steps

1. Check that migration completed successfully:
```bash
node scripts/migrateHierarchyToObjectIds.js
```

2. Test API functionality:
```bash
node scripts/testHierarchyAPIs.js
```

3. Verify data integrity:
```bash
# Check for any orphaned references
node -e "
const mongoose = require('mongoose');
require('./models/Category').find({dept_id: null}).then(cats => console.log('Orphaned categories:', cats.length));
"
```

## File Changes Summary

### Modified Files
- `models/Category.js` - Updated dept_id to ObjectId reference
- `models/SubCategory.js` - Added hierarchical indexes
- `routes/categories.js` - Complete rewrite with proper population
- `routes/subcategories.js` - Enhanced with hierarchy support
- `routes/products.js` - Optimized with mongoose populate

### New Files
- `scripts/migrateHierarchyToObjectIds.js` - Migration script
- `scripts/backupCollections.js` - Backup utility
- `scripts/runHierarchyMigration.js` - Main migration runner
- `scripts/testHierarchyAPIs.js` - API testing script
- `HIERARCHY_REWRITE_README.md` - This documentation

## Next Steps

1. **Run Migration**: Execute the migration script to convert existing data
2. **Test APIs**: Use the test script to verify everything works
3. **Update Frontend**: Ensure frontend code works with the new API structure
4. **Monitor Performance**: Check query performance and optimize if needed

## Support

If you encounter issues:
1. Check the migration output for any warnings
2. Run the test script to identify specific problems
3. Review the backup files if rollback is needed
4. Check MongoDB logs for any database-related errors
