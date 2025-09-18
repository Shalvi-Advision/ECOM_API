const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

// Get active department list
router.post('/get_active_department_list', async (req, res) => {
  try {
    const { project_code } = req.body;

    if (!project_code) {
      return res.status(400).json({
        success: false,
        message: 'project_code is required'
      });
    }

    const departmentsCollection = mongoose.connection.db.collection('departments');

    // Get all active departments sorted by sequence
    const departments = await departmentsCollection.find({})
      .sort({ sequence_id: 1 })
      .toArray();

    res.json({
      success: true,
      message: 'Active departments retrieved successfully',
      data: departments,
      count: departments.length
    });

  } catch (error) {
    console.error('Error getting active departments:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get additional offers for a department
router.post('/get_additional_offers', async (req, res) => {
  try {
    const { department_id, store_code, project_code } = req.body;

    if (!department_id || !store_code || !project_code) {
      return res.status(400).json({
        success: false,
        message: 'department_id, store_code, and project_code are required'
      });
    }

    const departmentsCollection = mongoose.connection.db.collection('departments');

    // Find department with additional offers
    const department = await departmentsCollection.findOne({
      department_id: department_id.toString()
    });

    if (!department) {
      return res.json({
        success: false,
        message: 'Department not found',
        data: []
      });
    }

    // For now, return department info - in real implementation,
    // you might have a separate offers collection
    res.json({
      success: true,
      message: 'Additional offers retrieved successfully',
      data: [department], // Return department as offers data
      department: department
    });

  } catch (error) {
    console.error('Error getting additional offers:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get popular category lists (1-5)
const getPopularCategoryList = (listNumber) => {
  return async (req, res) => {
    try {
      const { department_id, store_code, project_code } = req.body;

      if (!department_id || !store_code || !project_code) {
        return res.status(400).json({
          success: false,
          message: 'department_id, store_code, and project_code are required'
        });
      }

      const categoriesCollection = mongoose.connection.db.collection('categories');

      // Get categories for the department
      const categories = await categoriesCollection.find({
        dept_id: department_id.toString()
      }).sort({ sequence_id: 1 }).toArray();

      res.json({
        success: true,
        message: `Popular categories list ${listNumber} retrieved successfully`,
        data: categories,
        count: categories.length,
        list_number: listNumber
      });

    } catch (error) {
      console.error(`Error getting popular category list ${listNumber}:`, error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
};

// Create individual routes for popular categories
router.post('/get_popular_category_list_1', getPopularCategoryList(1));
router.post('/get_popular_category_list_2', getPopularCategoryList(2));
router.post('/get_popular_category_list_3', getPopularCategoryList(3));
router.post('/get_popular_category_list_4', getPopularCategoryList(4));
router.post('/get_popular_category_list_5', getPopularCategoryList(5));

// Get seasonal picks
router.post('/get_seasonal_picks', async (req, res) => {
  try {
    const { store_code, project_code } = req.body;

    if (!store_code || !project_code) {
      return res.status(400).json({
        success: false,
        message: 'store_code and project_code are required'
      });
    }

    const departmentsCollection = mongoose.connection.db.collection('departments');

    // Find seasonal picks department (assuming dept_type_id = 2 for seasonal)
    const seasonalDepartment = await departmentsCollection.findOne({
      dept_type_id: '2' // Seasonal picks
    });

    if (!seasonalDepartment) {
      return res.json({
        success: true,
        message: 'No seasonal picks available',
        data: [],
        count: 0
      });
    }

    res.json({
      success: true,
      message: 'Seasonal picks retrieved successfully',
      data: [seasonalDepartment],
      count: 1
    });

  } catch (error) {
    console.error('Error getting seasonal picks:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
