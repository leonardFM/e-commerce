import { createSwaggerSpec } from 'next-swagger-doc'

export const apiDocument = createSwaggerSpec({
  apiFolder: 'app/api',
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Solutech Commerce API',
      version: '1.0.0',
      description: 'E-commerce backend API — Next.js App Router, Prisma, PostgreSQL, JWT auth.',
    },
    servers: [{ url: '/', description: 'Local server' }],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        AuthResponse: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            email: { type: 'string' },
            name: { type: 'string', nullable: true },
            role: { type: 'string', enum: ['ADMIN', 'CUSTOMER'] },
          },
        },
        ProductRecord: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            price: { type: 'number' },
            stock: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CartItemRecord: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            productId: { type: 'integer' },
            productName: { type: 'string' },
            unitPrice: { type: 'number' },
            stock: { type: 'integer' },
            quantity: { type: 'integer' },
            lineTotal: { type: 'number' },
          },
        },
        CartRecord: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            userId: { type: 'integer' },
            items: { type: 'array', items: { $ref: '#/components/schemas/CartItemRecord' } },
            total: { type: 'number' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        OrderItemRecord: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            productId: { type: 'integer' },
            productName: { type: 'string' },
            quantity: { type: 'integer' },
            unitPrice: { type: 'number' },
          },
        },
        OrderRecord: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            userId: { type: 'integer' },
            status: { type: 'string', enum: ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'COMPLETED'] },
            paymentStatus: { type: 'string', enum: ['PENDING', 'PAID'] },
            paymentMethod: { type: 'string', enum: ['BANK_TRANSFER', 'EWALLET', 'COD'] },
            paymentReference: { type: 'string' },
            shippingName: { type: 'string' },
            shippingPhone: { type: 'string' },
            shippingAddress: { type: 'string' },
            shippingCity: { type: 'string' },
            shippingPostalCode: { type: 'string' },
            shippingCost: { type: 'number' },
            subtotal: { type: 'number' },
            total: { type: 'number' },
            items: { type: 'array', items: { $ref: '#/components/schemas/OrderItemRecord' } },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        InventoryMovementRecord: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            productId: { type: 'integer' },
            productName: { type: 'string' },
            userId: { type: 'integer', nullable: true },
            orderId: { type: 'integer', nullable: true },
            type: { type: 'string', enum: ['ORDER_CHECKOUT', 'ADMIN_ADJUSTMENT'] },
            quantityChange: { type: 'integer' },
            stockBefore: { type: 'integer' },
            stockAfter: { type: 'integer' },
            note: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            page: { type: 'integer' },
            limit: { type: 'integer' },
            total: { type: 'integer' },
            totalPages: { type: 'integer' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
        ValidationError: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            issues: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  path: { type: 'array', items: { type: 'string' } },
                  code: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  },
})
