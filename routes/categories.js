const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

// Get active category list
router.post('/get_active_categories_list', async (req, res) => {
  try {
    const { department_id, store_code, project_code } = req.body;

    if (!department_id || !store_code || !project_code) {
      return res.status(400).json({
        success: false,
        message: 'department_id, store_code, and project_code are required'
      });
    }

    const categoriesCollection = mongoose.connection.db.collection('categories');

    // Get categories for the specific department
    const categories = await categoriesCollection.find({
      dept_id: department_id.toString()
    }).sort({ sequence_id: 1 }).toArray();

    res.json({
      success: true,
      message: categories.length > 0 ? 'Active categories retrieved successfully' : 'No categories found',
      data: categories,
      count: categories.length,
      department_id: department_id
    });

  } catch (error) {
    console.error('Error getting active categories:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get all categories (without department filter)
router.post('/get_all_categories', async (req, res) => {
  try {
    const { store_code, project_code } = req.body;

    if (!store_code || !project_code) {
      return res.status(400).json({
        success: false,
        message: 'store_code and project_code are required'
      });
    }

    const categoriesCollection = mongoose.connection.db.collection('categories');

    // Get all categories
    const categories = await categoriesCollection.find({})
      .sort({ dept_id: 1, sequence_id: 1 })
      .toArray();

    // Group by department
    const groupedCategories = {};
    categories.forEach(category => {
      const deptId = category.dept_id;
      if (!groupedCategories[deptId]) {
        groupedCategories[deptId] = [];
      }
      groupedCategories[deptId].push(category);
    });

    res.json({
      success: true,
      message: 'All categories retrieved successfully',
      data: groupedCategories,
      total_count: categories.length
    });

  } catch (error) {
    console.error('Error getting all categories:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get category details by ID
router.post('/get_category_details', async (req, res) => {
  try {
    const { category_id, project_code } = req.body;

    if (!category_id || !project_code) {
      return res.status(400).json({
        success: false,
        message: 'category_id and project_code are required'
      });
    }

    const categoriesCollection = mongoose.connection.db.collection('categories');

    const category = await categoriesCollection.findOne({
      category_id: category_id.toString()
    });

    if (!category) {
      return res.json({
        success: false,
        message: 'Category not found',
        data: null
      });
    }

    res.json({
      success: true,
      message: 'Category details retrieved successfully',
      data: category
    });

  } catch (error) {
    console.error('Error getting category details:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get categories by multiple department IDs
router.post('/get_categories_by_departments', async (req, res) => {
  try {
    const { department_ids, store_code, project_code } = req.body;

    if (!department_ids || !Array.isArray(department_ids) || !store_code || !project_code) {
      return res.status(400).json({
        success: false,
        message: 'department_ids (array), store_code, and project_code are required'
      });
    }

    const categoriesCollection = mongoose.connection.db.collection('categories');

    // Convert department IDs to strings
    const deptIds = department_ids.map(id => id.toString());

    // Get categories for multiple departments
    const categories = await categoriesCollection.find({
      dept_id: { $in: deptIds }
    }).sort({ dept_id: 1, sequence_id: 1 }).toArray();

    // Group by department
    const groupedCategories = {};
    categories.forEach(category => {
      const deptId = category.dept_id;
      if (!groupedCategories[deptId]) {
        groupedCategories[deptId] = [];
      }
      groupedCategories[deptId].push(category);
    });

    res.json({
      success: true,
      message: 'Categories by departments retrieved successfully',
      data: groupedCategories,
      total_count: categories.length,
      department_ids: department_ids
    });

  } catch (error) {
    console.error('Error getting categories by departments:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
