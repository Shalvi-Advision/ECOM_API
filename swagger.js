const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Swagger definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'E-commerce API',
    version: '1.0.0',
    description: 'Complete API documentation for Patel Mart E-commerce Platform',
    contact: {
      name: 'Gaurav Pawar',
      email: 'gaurav@example.com'
    },
  },
  servers: [
    {
      url: 'http://localhost:5000/api',
      description: 'Development server',
    },
    {
      url: 'https://api.patelrmart.com/api',
      description: 'Production server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            example: '64f1a2b3c4d5e6f7g8h9i0j1'
          },
          name: {
            type: 'string',
            example: 'John Doe'
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'john@example.com'
          },
          phone: {
            type: 'string',
            example: '1234567890'
          },
          role: {
            type: 'string',
            enum: ['user', 'admin'],
            example: 'user'
          },
          is_active: {
            type: 'boolean',
            example: true
          },
          addresses: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Address'
            }
          },
          favorite_products: {
            type: 'array',
            items: {
              type: 'string'
            }
          }
        }
      },
      Address: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['home', 'work', 'other'],
            example: 'home'
          },
          name: {
            type: 'string',
            example: 'John Doe'
          },
          phone: {
            type: 'string',
            example: '1234567890'
          },
          address_line_1: {
            type: 'string',
            example: '123 Main Street'
          },
          address_line_2: {
            type: 'string',
            example: 'Apt 4B'
          },
          city: {
            type: 'string',
            example: 'Mumbai'
          },
          state: {
            type: 'string',
            example: 'Maharashtra'
          },
          pincode: {
            type: 'string',
            example: '400001'
          },
          landmark: {
            type: 'string',
            example: 'Near Railway Station'
          },
          is_default: {
            type: 'boolean',
            example: true
          }
        }
      },
      Product: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            example: '64f1a2b3c4d5e6f7g8h9i0j2'
          },
          p_code: {
            type: 'string',
            example: '2390'
          },
          product_name: {
            type: 'string',
            example: 'SABUDANA 250 (N.W.)'
          },
          product_description: {
            type: 'string',
            example: 'INDIAN CHASKA (PKT) STK_GRO,UPVAS SABUDANA UPWAS 250 GM PLS'
          },
          package_size: {
            type: 'number',
            example: 250
          },
          package_unit: {
            type: 'string',
            example: 'GM'
          },
          product_mrp: {
            type: 'number',
            example: 20.00
          },
          our_price: {
            type: 'number',
            example: 18.00
          },
          brand_name: {
            type: 'string',
            example: 'INDIAN CHASKA (PKT)'
          },
          store_code: {
            type: 'string',
            example: 'AVB'
          },
          pcode_status: {
            type: 'string',
            example: 'Y'
          },
          store_quantity: {
            type: 'number',
            example: 33
          },
          max_quantity_allowed: {
            type: 'number',
            example: 10
          },
          pcode_img: {
            type: 'string',
            example: 'https://retailmagic.in/cdn/RET3163/2390_1.webp'
          },
          discount_percentage: {
            type: 'number',
            example: 10
          },
          dept_id: {
            type: 'string',
            example: '2'
          },
          category_id: {
            type: 'string',
            example: '89'
          },
          sub_category_id: {
            type: 'string',
            example: '349'
          }
        }
      },
      Order: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            example: '64f1a2b3c4d5e6f7g8h9i0j3'
          },
          order_id: {
            type: 'string',
            example: 'ORD1234567890'
          },
          user_id: {
            type: 'string',
            example: '64f1a2b3c4d5e6f7g8h9i0j1'
          },
          items: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/OrderItem'
            }
          },
          delivery_address: {
            $ref: '#/components/schemas/Address'
          },
          store_code: {
            type: 'string',
            example: 'AME'
          },
          order_status: {
            type: 'string',
            enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
            example: 'pending'
          },
          payment_status: {
            type: 'string',
            enum: ['pending', 'paid', 'failed', 'refunded'],
            example: 'pending'
          },
          payment_mode: {
            type: 'string',
            example: 'Online Payment'
          },
          subtotal: {
            type: 'number',
            example: 36.00
          },
          delivery_charge: {
            type: 'number',
            example: 0
          },
          total_amount: {
            type: 'number',
            example: 36.00
          },
          notes: {
            type: 'string',
            example: 'Delivery instructions'
          }
        }
      },
      OrderItem: {
        type: 'object',
        properties: {
          product_id: {
            type: 'string',
            example: '64f1a2b3c4d5e6f7g8h9i0j2'
          },
          p_code: {
            type: 'string',
            example: '2390'
          },
          product_name: {
            type: 'string',
            example: 'SABUDANA 250 (N.W.)'
          },
          quantity: {
            type: 'number',
            example: 2
          },
          unit_price: {
            type: 'number',
            example: 18.00
          },
          total_price: {
            type: 'number',
            example: 36.00
          }
        }
      },
      Category: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            example: '64f1a2b3c4d5e6f7g8h9i0j4'
          },
          idcategory_master: {
            type: 'string',
            example: '118'
          },
          category_name: {
            type: 'string',
            example: 'Maha Bachat'
          },
          dept_id: {
            type: 'string',
            example: '18'
          },
          sequence_id: {
            type: 'number',
            example: 1
          },
          store_code: {
            type: 'string',
            example: 'AME'
          },
          no_of_col: {
            type: 'string',
            example: '12'
          },
          image_link: {
            type: 'string',
            example: 'https://patelrmart.com/mgmt_panel/sites/default/files/category/thumbnail/1_0.jpg'
          },
          category_bg_color: {
            type: 'string',
            example: '#FFFF00'
          }
        }
      },
      Banner: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            example: '64f1a2b3c4d5e6f7g8h9i0j5'
          },
          banner_name: {
            type: 'string',
            example: 'Festival Offer'
          },
          banner_image: {
            type: 'string',
            example: 'https://patelrmart.com/banner1.jpg'
          },
          banner_type_id: {
            type: 'string',
            example: '1'
          },
          store_code: {
            type: 'string',
            example: 'AME'
          },
          is_active: {
            type: 'boolean',
            example: true
          },
          sequence_id: {
            type: 'number',
            example: 1
          }
        }
      },
      ApiResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true
          },
          message: {
            type: 'string',
            example: 'Operation successful'
          },
          data: {
            type: 'object',
            description: 'Response data'
          },
          pagination: {
            type: 'object',
            properties: {
              current_page: {
                type: 'number',
                example: 1
              },
              total_pages: {
                type: 'number',
                example: 10
              },
              total_items: {
                type: 'number',
                example: 200
              },
              has_next: {
                type: 'boolean',
                example: true
              },
              has_prev: {
                type: 'boolean',
                example: false
              }
            }
          }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false
          },
          message: {
            type: 'string',
            example: 'Error description'
          },
          error: {
            type: 'string',
            example: 'Detailed error message'
          },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: {
                  type: 'string',
                  example: 'email'
                },
                message: {
                  type: 'string',
                  example: 'Email is required'
                }
              }
            }
          }
        }
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ]
};

// Options for the swagger docs
const options = {
  swaggerDefinition,
  apis: ['./routes/*.js', './server.js'], // Paths to files containing OpenAPI definitions
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJSDoc(options);

module.exports = {
  swaggerUi,
  swaggerSpec
};
