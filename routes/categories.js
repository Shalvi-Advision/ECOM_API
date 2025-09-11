const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Department = require('../models/Department');

// Get all categories
router.get('/', async (req, res) => {
  try {
    const { dept_id, store_code } = req.query;
    
    const filter = {};
    if (dept_id) filter.dept_id = dept_id;
    if (store_code) filter.store_code = store_code;

    const categories = await Category.find(filter)
      .populate('dept_id', 'department_name')
      .sort({ sequence_id: 1 })
      .lean();

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
});

// Get category by ID
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('dept_id', 'department_name');

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching category',
      error: error.message
    });
  }
});

// Get categories by department
router.get('/department/:deptId', async (req, res) => {
  try {
    const { store_code } = req.query;
    
    const filter = { dept_id: req.params.deptId };
    if (store_code) filter.store_code = store_code;

    const categories = await Category.find(filter)
      .populate('dept_id', 'department_name')
      .sort({ sequence_id: 1 })
      .lean();

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching categories by department',
      error: error.message
    });
  }
});

module.exports = router;
