const mongoose = require('mongoose');
const Department = require('../models/Department');
const Category = require('../models/Category');
const SubCategory = require('../models/SubCategory');

// Helper function to check if a string is a valid ObjectId
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// Helper function to populate department data
const populateDepartment = async (deptId) => {
  if (!deptId) return null;
  
  try {
    // If it's already an ObjectId, use it directly
    if (isValidObjectId(deptId)) {
      return await Department.findById(deptId).select('department_name image_link sequence_id').lean();
    }
    
    // If it's a string ID, find by department_id field
    return await Department.findOne({ department_id: deptId }).select('department_name image_link sequence_id').lean();
  } catch (error) {
    console.error('Error populating department:', error);
    return null;
  }
};

// Helper function to populate category data
const populateCategory = async (categoryId) => {
  if (!categoryId) return null;
  
  try {
    // If it's already an ObjectId, use it directly
    if (isValidObjectId(categoryId)) {
      return await Category.findById(categoryId).select('category_name image_link sequence_id').lean();
    }
    
    // If it's a string ID, find by idcategory_master field
    return await Category.findOne({ idcategory_master: categoryId }).select('category_name image_link sequence_id').lean();
  } catch (error) {
    console.error('Error populating category:', error);
    return null;
  }
};

// Helper function to populate subcategory data
const populateSubCategory = async (subCategoryId) => {
  if (!subCategoryId) return null;
  
  try {
    // If it's already an ObjectId, use it directly
    if (isValidObjectId(subCategoryId)) {
      return await SubCategory.findById(subCategoryId).select('sub_category_name').lean();
    }
    
    // If it's a string ID, find by idsub_category_master field
    return await SubCategory.findOne({ idsub_category_master: subCategoryId }).select('sub_category_name').lean();
  } catch (error) {
    console.error('Error populating subcategory:', error);
    return null;
  }
};

// Helper function to populate all references for a product
const populateProductReferences = async (product) => {
  if (!product) return product;
  
  try {
    // Populate department
    if (product.dept_id) {
      product.dept_id = await populateDepartment(product.dept_id);
    }
    
    // Populate category
    if (product.category_id) {
      product.category_id = await populateCategory(product.category_id);
    }
    
    // Populate subcategory
    if (product.sub_category_id) {
      product.sub_category_id = await populateSubCategory(product.sub_category_id);
    }
    
    return product;
  } catch (error) {
    console.error('Error populating product references:', error);
    return product;
  }
};

// Helper function to populate all references for multiple products
const populateProductsReferences = async (products) => {
  if (!Array.isArray(products)) return products;
  
  try {
    const populatedProducts = await Promise.all(
      products.map(product => populateProductReferences(product))
    );
    
    return populatedProducts;
  } catch (error) {
    console.error('Error populating products references:', error);
    return products;
  }
};

// Helper function to populate category with department
const populateCategoryWithDepartment = async (category) => {
  if (!category) return category;
  
  try {
    if (category.dept_id) {
      category.dept_id = await populateDepartment(category.dept_id);
    }
    
    return category;
  } catch (error) {
    console.error('Error populating category with department:', error);
    return category;
  }
};

// Helper function to populate subcategory with category
const populateSubCategoryWithCategory = async (subCategory) => {
  if (!subCategory) return subCategory;
  
  try {
    if (subCategory.category_id) {
      subCategory.category_id = await populateCategory(subCategory.category_id);
    }
    
    return subCategory;
  } catch (error) {
    console.error('Error populating subcategory with category:', error);
    return subCategory;
  }
};

module.exports = {
  isValidObjectId,
  populateDepartment,
  populateCategory,
  populateSubCategory,
  populateProductReferences,
  populateProductsReferences,
  populateCategoryWithDepartment,
  populateSubCategoryWithCategory
};
