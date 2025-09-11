const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  department_id: {
    type: String,
    required: true,
    unique: true
  },
  department_name: {
    type: String,
    required: true
  },
  dept_type_id: {
    type: String,
    required: true
  },
  dept_no_of_col: {
    type: Number,
    default: 0
  },
  store_code: {
    type: String,
    default: null
  },
  image_link: {
    type: String,
    required: true
  },
  sequence_id: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Department', departmentSchema);
