const express = require('express');
const router = express.Router();
const Department = require('../models/Department');
const { body, validationResult } = require('express-validator');
const adminAuth = require('../middleware/adminAuth');

// Get all departments
router.get('/', async (req, res) => {
  try {
    const departments = await Department.find({})
      .sort({ sequence_id: 1 })
      .lean();

    res.json({
      success: true,
      data: departments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching departments',
      error: error.message
    });
  }
});

// Get department by ID
router.get('/:id', async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    res.json({
      success: true,
      data: department
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching department',
      error: error.message
    });
  }
});

// ==================== ADMIN CRUD ROUTES ====================

// Create new department (Admin only)
router.post('/', adminAuth, [
  body('department_name').notEmpty().withMessage('Department name is required'),
  body('sequence_id').isInt({ min: 1 }).withMessage('Valid sequence ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const {
      department_name,
      sequence_id,
      department_description,
      department_img,
      is_active = 'Y'
    } = req.body;

    // Check if sequence ID already exists
    const existingDepartment = await Department.findOne({ sequence_id });
    if (existingDepartment) {
      return res.status(400).json({
        success: false,
        message: 'Sequence ID already exists'
      });
    }

    // Generate a unique ID for the department
    const department_id = `DEPT${Date.now()}${Math.floor(Math.random() * 1000)}`;
    
    const department = new Department({
      department_id,
      department_name,
      dept_type_id: '1', // Default department type
      dept_no_of_col: 12, // Default number of columns
      store_code: req.body.store_code || 'DEFAULT',
      image_link: department_img || 'https://via.placeholder.com/200x200?text=Department',
      sequence_id
    });

    await department.save();

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: department
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating department',
      error: error.message
    });
  }
});

// Update department (Admin only)
router.put('/:id', adminAuth, [
  body('department_name').optional().notEmpty().withMessage('Department name cannot be empty'),
  body('sequence_id').optional().isInt({ min: 1 }).withMessage('Valid sequence ID is required'),
  body('is_active').optional().isIn(['Y', 'N']).withMessage('Valid status is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Check if sequence ID already exists (excluding current department)
    if (req.body.sequence_id && req.body.sequence_id !== department.sequence_id) {
      const existingDepartment = await Department.findOne({
        sequence_id: req.body.sequence_id,
        _id: { $ne: req.params.id }
      });
      if (existingDepartment) {
        return res.status(400).json({
          success: false,
          message: 'Sequence ID already exists'
        });
      }
    }

    // Update fields
    const updateFields = [
      'department_name', 'sequence_id', 'department_description', 
      'department_img', 'is_active'
    ];

    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        department[field] = req.body[field];
      }
    });

    await department.save();

    res.json({
      success: true,
      message: 'Department updated successfully',
      data: department
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating department',
      error: error.message
    });
  }
});

// Delete department (Admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    await Department.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Department deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting department',
      error: error.message
    });
  }
});

// Get all departments for admin (including inactive)
router.get('/admin/all', adminAuth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      is_active,
      search 
    } = req.query;
    
    const filter = {};
    if (is_active) filter.is_active = is_active;
    if (search) {
      filter.$or = [
        { department_name: { $regex: search, $options: 'i' } },
        { department_description: { $regex: search, $options: 'i' } }
      ];
    }

    const departments = await Department.find(filter)
      .sort({ sequence_id: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Department.countDocuments(filter);

    res.json({
      success: true,
      data: {
        departments,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_departments: total,
          has_next: page < Math.ceil(total / limit),
          has_prev: page > 1
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching departments',
      error: error.message
    });
  }
});

// Toggle department status (Admin only)
router.patch('/:id/toggle-status', adminAuth, async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    department.is_active = department.is_active === 'Y' ? 'N' : 'Y';
    await department.save();

    res.json({
      success: true,
      message: `Department ${department.is_active === 'Y' ? 'enabled' : 'disabled'} successfully`,
      data: {
        id: department._id,
        is_active: department.is_active
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error toggling department status',
      error: error.message
    });
  }
});

module.exports = router;
