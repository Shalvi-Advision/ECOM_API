const express = require('express');
const mongoose = require('mongoose');
const { protect, adminOnly } = require('../../middleware/auth');
const router = express.Router();

// Apply admin authentication to all routes
router.use(protect);
router.use(adminOnly);

// Get all departments (admin view with pagination)
router.post('/get_all_departments', async (req, res) => {
  try {
    const { page = 1, limit = 50, search, sort_by = 'dept_name', sort_order = 'asc' } = req.body;

    const departmentsCollection = mongoose.connection.db.collection('departments');

    // Build query
    const query = {};
    if (search) {
      query.$or = [
        { dept_name: { $regex: search, $options: 'i' } },
        { dept_id: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sortObj = {};
    sortObj[sort_by] = sort_order === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get total count
    const totalCount = await departmentsCollection.countDocuments(query);

    // Get departments
    const departments = await departmentsCollection.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    const totalPages = Math.ceil(totalCount / parseInt(limit));

    res.json({
      success: true,
      message: departments.length > 0 ? 'Departments retrieved successfully' : 'No departments found',
      data: departments,
      pagination: {
        current_page: parseInt(page),
        total_pages: totalPages,
        total_departments: totalCount,
        per_page: parseInt(limit),
        has_next: parseInt(page) < totalPages,
        has_prev: parseInt(page) > 1
      },
      filters: {
        search
      }
    });

  } catch (error) {
    console.error('Error getting all departments:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get department by ID
router.post('/get_department_by_id', async (req, res) => {
  try {
    const { dept_id } = req.body;

    if (!dept_id) {
      return res.status(400).json({
        success: false,
        message: 'dept_id is required'
      });
    }

    const departmentsCollection = mongoose.connection.db.collection('departments');

    const department = await departmentsCollection.findOne({
      dept_id: dept_id.toString()
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    res.json({
      success: true,
      message: 'Department retrieved successfully',
      data: department
    });

  } catch (error) {
    console.error('Error getting department by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new department
router.post('/create_department', async (req, res) => {
  try {
    const {
      dept_id,
      dept_name,
      sequence_id,
      is_active = true,
      image_url,
      description
    } = req.body;

    // Validate required fields
    if (!dept_id || !dept_name) {
      return res.status(400).json({
        success: false,
        message: 'dept_id and dept_name are required'
      });
    }

    const departmentsCollection = mongoose.connection.db.collection('departments');

    // Check if department ID already exists
    const existingDepartment = await departmentsCollection.findOne({ dept_id: dept_id.toString() });
    if (existingDepartment) {
      return res.status(400).json({
        success: false,
        message: 'Department with this ID already exists'
      });
    }

    // Create new department
    const newDepartment = {
      dept_id: dept_id.toString(),
      dept_name,
      sequence_id: sequence_id ? parseInt(sequence_id) : 0,
      is_active: Boolean(is_active),
      image_url: image_url || '',
      description: description || '',
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await departmentsCollection.insertOne(newDepartment);

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: {
        _id: result.insertedId,
        ...newDepartment
      }
    });

  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create department'
    });
  }
});

// Update department
router.post('/update_department', async (req, res) => {
  try {
    const {
      dept_id,
      dept_name,
      sequence_id,
      is_active,
      image_url,
      description
    } = req.body;

    if (!dept_id) {
      return res.status(400).json({
        success: false,
        message: 'dept_id is required'
      });
    }

    const departmentsCollection = mongoose.connection.db.collection('departments');

    // Find department
    const existingDepartment = await departmentsCollection.findOne({
      dept_id: dept_id.toString()
    });

    if (!existingDepartment) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Check if dept_id is being changed and if it's already taken
    if (dept_id && dept_id !== existingDepartment.dept_id) {
      const duplicateDepartment = await departmentsCollection.findOne({
        dept_id: dept_id.toString(),
        _id: { $ne: existingDepartment._id }
      });
      if (duplicateDepartment) {
        return res.status(400).json({
          success: false,
          message: 'Department ID already exists'
        });
      }
    }

    // Build update object
    const updateData = {
      updated_at: new Date()
    };

    if (dept_name !== undefined) updateData.dept_name = dept_name;
    if (sequence_id !== undefined) updateData.sequence_id = parseInt(sequence_id);
    if (is_active !== undefined) updateData.is_active = Boolean(is_active);
    if (image_url !== undefined) updateData.image_url = image_url;
    if (description !== undefined) updateData.description = description;

    const result = await departmentsCollection.updateOne(
      { dept_id: dept_id.toString() },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'No changes made to department'
      });
    }

    // Get updated department
    const updatedDepartment = await departmentsCollection.findOne({
      dept_id: dept_id.toString()
    });

    res.json({
      success: true,
      message: 'Department updated successfully',
      data: updatedDepartment
    });

  } catch (error) {
    console.error('Error updating department:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update department'
    });
  }
});

// Delete department
router.post('/delete_department', async (req, res) => {
  try {
    const { dept_id } = req.body;

    if (!dept_id) {
      return res.status(400).json({
        success: false,
        message: 'dept_id is required'
      });
    }

    const departmentsCollection = mongoose.connection.db.collection('departments');

    // Find department
    const existingDepartment = await departmentsCollection.findOne({
      dept_id: dept_id.toString()
    });

    if (!existingDepartment) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    const result = await departmentsCollection.deleteOne({
      dept_id: dept_id.toString()
    });

    if (result.deletedCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'Failed to delete department'
      });
    }

    res.json({
      success: true,
      message: 'Department deleted successfully',
      data: {
        deleted_dept_id: dept_id,
        deleted_department: existingDepartment
      }
    });

  } catch (error) {
    console.error('Error deleting department:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete department'
    });
  }
});

// Bulk update departments
router.post('/bulk_update_departments', async (req, res) => {
  try {
    const { dept_ids, update_data } = req.body;

    if (!dept_ids || !Array.isArray(dept_ids) || dept_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'dept_ids array is required and cannot be empty'
      });
    }

    if (!update_data || Object.keys(update_data).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'update_data is required'
      });
    }

    const departmentsCollection = mongoose.connection.db.collection('departments');

    // Build query to match departments by dept_id strings
    const query = {
      dept_id: { $in: dept_ids.map(id => id.toString()) }
    };

    // Add updated_at timestamp
    const bulkUpdateData = {
      ...update_data,
      updated_at: new Date()
    };

    const result = await departmentsCollection.updateMany(
      query,
      { $set: bulkUpdateData }
    );

    res.json({
      success: true,
      message: `Bulk update completed. ${result.modifiedCount} departments updated.`,
      data: {
        matched_count: result.matchedCount,
        modified_count: result.modifiedCount,
        dept_ids: dept_ids
      }
    });

  } catch (error) {
    console.error('Error bulk updating departments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk update departments'
    });
  }
});

// Get department statistics
router.post('/get_department_stats', async (req, res) => {
  try {
    const departmentsCollection = mongoose.connection.db.collection('departments');
    const categoriesCollection = mongoose.connection.db.collection('categories');
    const productsCollection = mongoose.connection.db.collection('products');

    // Get all departments
    const departments = await departmentsCollection.find({}).toArray();

    // Get statistics for each department
    const stats = await Promise.all(departments.map(async (dept) => {
      const categoriesCount = await categoriesCollection.countDocuments({ dept_id: dept.dept_id });
      const productsCount = await productsCollection.countDocuments({ dept_id: dept.dept_id });

      return {
        dept_id: dept.dept_id,
        dept_name: dept.dept_name,
        categories_count: categoriesCount,
        products_count: productsCount,
        is_active: dept.is_active
      };
    }));

    res.json({
      success: true,
      message: 'Department statistics retrieved successfully',
      data: stats,
      total_departments: stats.length
    });

  } catch (error) {
    console.error('Error getting department statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get department statistics'
    });
  }
});

module.exports = router;
