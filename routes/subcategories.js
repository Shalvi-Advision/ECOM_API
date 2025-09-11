const express = require('express');
const router = express.Router();
const SubCategory = require('../models/SubCategory');

// Get all subcategories
router.get('/', async (req, res) => {
  try {
    const { category_id } = req.query;
    
    const filter = {};
    if (category_id) filter.category_id = category_id;

    const subCategories = await SubCategory.find(filter)
      .populate('category_id', 'category_name')
      .sort({ sub_category_name: 1 })
      .lean();

    res.json({
      success: true,
      data: subCategories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching subcategories',
      error: error.message
    });
  }
});

// Get subcategory by ID
router.get('/:id', async (req, res) => {
  try {
    const subCategory = await SubCategory.findById(req.params.id)
      .populate('category_id', 'category_name');

    if (!subCategory) {
      return res.status(404).json({
        success: false,
        message: 'Subcategory not found'
      });
    }

    res.json({
      success: true,
      data: subCategory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching subcategory',
      error: error.message
    });
  }
});

// Get subcategories by category
router.get('/category/:categoryId', async (req, res) => {
  try {
    const subCategories = await SubCategory.find({ category_id: req.params.categoryId })
      .populate('category_id', 'category_name')
      .sort({ sub_category_name: 1 })
      .lean();

    res.json({
      success: true,
      data: subCategories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching subcategories by category',
      error: error.message
    });
  }
});

module.exports = router;
