const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

// Get active sub category list
router.post('/get_sub_categories_list', async (req, res) => {
  try {
    const { category_id, project_code } = req.body;

    if (!category_id || !project_code) {
      return res.status(400).json({
        success: false,
        message: 'category_id and project_code are required'
      });
    }

    const subcategoriesCollection = mongoose.connection.db.collection('subcategories');

    // Get subcategories for the specific category
    const subcategories = await subcategoriesCollection.find({
      category_id: category_id.toString()
    }).sort({ sequence_id: 1 }).toArray();

    res.json({
      success: true,
      message: subcategories.length > 0 ? 'Active subcategories retrieved successfully' : 'No subcategories found',
      data: subcategories,
      count: subcategories.length,
      category_id: category_id
    });

  } catch (error) {
    console.error('Error getting subcategories:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get all subcategories
router.post('/get_all_subcategories', async (req, res) => {
  try {
    const { project_code } = req.body;

    if (!project_code) {
      return res.status(400).json({
        success: false,
        message: 'project_code is required'
      });
    }

    const subcategoriesCollection = mongoose.connection.db.collection('subcategories');

    // Get all subcategories
    const subcategories = await subcategoriesCollection.find({})
      .sort({ category_id: 1, sequence_id: 1 })
      .toArray();

    // Group by category
    const groupedSubcategories = {};
    subcategories.forEach(subcategory => {
      const catId = subcategory.category_id;
      if (!groupedSubcategories[catId]) {
        groupedSubcategories[catId] = [];
      }
      groupedSubcategories[catId].push(subcategory);
    });

    res.json({
      success: true,
      message: 'All subcategories retrieved successfully',
      data: groupedSubcategories,
      total_count: subcategories.length
    });

  } catch (error) {
    console.error('Error getting all subcategories:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get subcategory details by ID
router.post('/get_subcategory_details', async (req, res) => {
  try {
    const { subcategory_id, project_code } = req.body;

    if (!subcategory_id || !project_code) {
      return res.status(400).json({
        success: false,
        message: 'subcategory_id and project_code are required'
      });
    }

    const subcategoriesCollection = mongoose.connection.db.collection('subcategories');

    const subcategory = await subcategoriesCollection.findOne({
      subcategory_id: subcategory_id.toString()
    });

    if (!subcategory) {
      return res.json({
        success: false,
        message: 'Subcategory not found',
        data: null
      });
    }

    res.json({
      success: true,
      message: 'Subcategory details retrieved successfully',
      data: subcategory
    });

  } catch (error) {
    console.error('Error getting subcategory details:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get subcategories by multiple category IDs
router.post('/get_subcategories_by_categories', async (req, res) => {
  try {
    const { category_ids, project_code } = req.body;

    if (!category_ids || !Array.isArray(category_ids) || !project_code) {
      return res.status(400).json({
        success: false,
        message: 'category_ids (array) and project_code are required'
      });
    }

    const subcategoriesCollection = mongoose.connection.db.collection('subcategories');

    // Convert category IDs to strings
    const catIds = category_ids.map(id => id.toString());

    // Get subcategories for multiple categories
    const subcategories = await subcategoriesCollection.find({
      category_id: { $in: catIds }
    }).sort({ category_id: 1, sequence_id: 1 }).toArray();

    // Group by category
    const groupedSubcategories = {};
    subcategories.forEach(subcategory => {
      const catId = subcategory.category_id;
      if (!groupedSubcategories[catId]) {
        groupedSubcategories[catId] = [];
      }
      groupedSubcategories[catId].push(subcategory);
    });

    res.json({
      success: true,
      message: 'Subcategories by categories retrieved successfully',
      data: groupedSubcategories,
      total_count: subcategories.length,
      category_ids: category_ids
    });

  } catch (error) {
    console.error('Error getting subcategories by categories:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get subcategories with category and department info
router.post('/get_subcategories_with_details', async (req, res) => {
  try {
    const { category_id, project_code } = req.body;

    if (!category_id || !project_code) {
      return res.status(400).json({
        success: false,
        message: 'category_id and project_code are required'
      });
    }

    const subcategoriesCollection = mongoose.connection.db.collection('subcategories');
    const categoriesCollection = mongoose.connection.db.collection('categories');
    const departmentsCollection = mongoose.connection.db.collection('departments');

    // Get subcategories
    const subcategories = await subcategoriesCollection.find({
      category_id: category_id.toString()
    }).sort({ sequence_id: 1 }).toArray();

    if (subcategories.length === 0) {
      return res.json({
        success: true,
        message: 'No subcategories found',
        data: [],
        count: 0
      });
    }

    // Get category details
    const category = await categoriesCollection.findOne({
      category_id: category_id.toString()
    });

    // Get department details if category exists
    let department = null;
    if (category) {
      department = await departmentsCollection.findOne({
        department_id: category.dept_id
      });
    }

    // Add category and department info to each subcategory
    const enrichedSubcategories = subcategories.map(subcategory => ({
      ...subcategory,
      category_info: category,
      department_info: department
    }));

    res.json({
      success: true,
      message: 'Subcategories with details retrieved successfully',
      data: enrichedSubcategories,
      count: enrichedSubcategories.length,
      category: category,
      department: department
    });

  } catch (error) {
    console.error('Error getting subcategories with details:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
