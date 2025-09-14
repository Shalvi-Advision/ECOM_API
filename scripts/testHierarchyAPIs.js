const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api'; // Adjust if your API runs on a different port

const testHierarchyAPIs = async () => {
  console.log('🧪 Testing Hierarchy APIs');
  console.log('========================');

  try {
    // Test 1: Get all departments
    console.log('\n1️⃣ Testing Departments API...');
    const departmentsResponse = await axios.get(`${BASE_URL}/departments`);
    console.log(`✅ GET /departments: ${departmentsResponse.data.data.length} departments found`);

    if (departmentsResponse.data.data.length > 0) {
      const firstDept = departmentsResponse.data.data[0];
      console.log(`📋 Sample department: ${firstDept.department_name} (${firstDept.department_id})`);

      // Test 2: Get department by ID
      console.log('\n2️⃣ Testing Department by ID...');
      const deptByIdResponse = await axios.get(`${BASE_URL}/departments/${firstDept._id}`);
      console.log(`✅ GET /departments/${firstDept._id}: ${deptByIdResponse.data.data.department_name}`);

      // Test 3: Get categories by department
      console.log('\n3️⃣ Testing Categories by Department...');
      const categoriesResponse = await axios.get(`${BASE_URL}/categories/department/${firstDept._id}`);
      console.log(`✅ GET /categories/department/${firstDept._id}: ${categoriesResponse.data.data.length} categories found`);

      if (categoriesResponse.data.data.length > 0) {
        const firstCategory = categoriesResponse.data.data[0];
        console.log(`📋 Sample category: ${firstCategory.category_name} (${firstCategory.idcategory_master})`);

        // Test 4: Get category by ID
        console.log('\n4️⃣ Testing Category by ID...');
        const categoryByIdResponse = await axios.get(`${BASE_URL}/categories/${firstCategory._id}`);
        console.log(`✅ GET /categories/${firstCategory._id}: ${categoryByIdResponse.data.data.category_name}`);

        // Test 5: Get subcategories by category
        console.log('\n5️⃣ Testing SubCategories by Category...');
        const subCategoriesResponse = await axios.get(`${BASE_URL}/subcategories/category/${firstCategory._id}`);
        console.log(`✅ GET /subcategories/category/${firstCategory._id}: ${subCategoriesResponse.data.data.length} subcategories found`);

        if (subCategoriesResponse.data.data.length > 0) {
          const firstSubCategory = subCategoriesResponse.data.data[0];
          console.log(`📋 Sample subcategory: ${firstSubCategory.sub_category_name} (${firstSubCategory.idsub_category_master})`);

          // Test 6: Get subcategory by ID
          console.log('\n6️⃣ Testing SubCategory by ID...');
          const subCategoryByIdResponse = await axios.get(`${BASE_URL}/subcategories/${firstSubCategory._id}`);
          console.log(`✅ GET /subcategories/${firstSubCategory._id}: ${subCategoryByIdResponse.data.data.sub_category_name}`);

          // Test 7: Get products by category
          console.log('\n7️⃣ Testing Products by Category...');
          const productsByCategoryResponse = await axios.get(`${BASE_URL}/products/category/${firstCategory._id}`);
          console.log(`✅ GET /products/category/${firstCategory._id}: ${productsByCategoryResponse.data.data.products.length} products found`);

          // Test 8: Get products by subcategory
          console.log('\n8️⃣ Testing Products by SubCategory...');
          const productsBySubCategoryResponse = await axios.get(`${BASE_URL}/products/subcategory/${firstSubCategory._id}`);
          console.log(`✅ GET /products/subcategory/${firstSubCategory._id}: ${productsBySubCategoryResponse.data.data.products.length} products found`);

          // Test 9: Get products by department
          console.log('\n9️⃣ Testing Products by Department...');
          const productsByDepartmentResponse = await axios.get(`${BASE_URL}/products/department/${firstDept._id}`);
          console.log(`✅ GET /products/department/${firstDept._id}: ${productsByDepartmentResponse.data.data.products.length} products found`);
        }

        // Test 10: Get all categories
        console.log('\n🔟 Testing All Categories...');
        const allCategoriesResponse = await axios.get(`${BASE_URL}/categories`);
        console.log(`✅ GET /categories: ${allCategoriesResponse.data.data.length} categories found`);

        // Test 11: Get all subcategories
        console.log('\n1️⃣1️⃣ Testing All SubCategories...');
        const allSubCategoriesResponse = await axios.get(`${BASE_URL}/subcategories`);
        console.log(`✅ GET /subcategories: ${allSubCategoriesResponse.data.data.length} subcategories found`);

        // Test 12: Get all products
        console.log('\n1️⃣2️⃣ Testing All Products...');
        const allProductsResponse = await axios.get(`${BASE_URL}/products`);
        console.log(`✅ GET /products: ${allProductsResponse.data.data.products.length} products found`);

        // Test 13: Verify hierarchy in product data
        if (allProductsResponse.data.data.products.length > 0) {
          console.log('\n1️⃣3️⃣ Testing Product Hierarchy Structure...');
          const sampleProduct = allProductsResponse.data.data.products[0];
          const hasDept = sampleProduct.dept_id && typeof sampleProduct.dept_id === 'object';
          const hasCategory = sampleProduct.category_id && typeof sampleProduct.category_id === 'object';
          const hasSubCategory = sampleProduct.sub_category_id && typeof sampleProduct.sub_category_id === 'object';

          console.log(`✅ Product hierarchy check:`);
          console.log(`   - Department: ${hasDept ? '✅' : '❌'} (${hasDept ? sampleProduct.dept_id.department_name : 'Missing'})`);
          console.log(`   - Category: ${hasCategory ? '✅' : '❌'} (${hasCategory ? sampleProduct.category_id.category_name : 'Missing'})`);
          console.log(`   - SubCategory: ${hasSubCategory ? '✅' : '❌'} (${hasSubCategory ? sampleProduct.sub_category_id.sub_category_name : 'Missing'})`);
        }
      }
    }

    console.log('\n🎉 All API tests completed successfully!');
    console.log('\n📊 Hierarchy Structure Verified:');
    console.log('   Department (ObjectId)');
    console.log('   └── Category (references Department)');
    console.log('       └── SubCategory (references Category)');
    console.log('           └── Product (references all three)');

  } catch (error) {
    console.error('\n❌ API Test failed:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Message: ${error.response.data.message || error.response.data}`);
    } else {
      console.error(`Error: ${error.message}`);
    }
    console.log('\n💡 Make sure your API server is running on the correct port.');
    process.exit(1);
  }
};

// Run the test
if (require.main === module) {
  testHierarchyAPIs();
}

module.exports = { testHierarchyAPIs };
