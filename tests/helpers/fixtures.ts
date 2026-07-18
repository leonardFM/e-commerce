import bcrypt from 'bcryptjs'
import { testPrisma } from './db'

export const testUsers = {
  admin: {
    email: 'admin.integration@solutech.test',
    password: 'password123',
  },
  customer: {
    email: 'customer.integration@solutech.test',
    password: 'password123',
  },
  otherCustomer: {
    email: 'other.integration@solutech.test',
    password: 'password123',
  },
}

export async function seedUsers() {
  const passwordHash = await bcrypt.hash('password123', 10)

  const admin = await testPrisma.user.create({
    data: {
      email: testUsers.admin.email,
      name: 'Integration Admin',
      passwordHash,
      role: 'ADMIN',
    },
  })

  const customer = await testPrisma.user.create({
    data: {
      email: testUsers.customer.email,
      name: 'Integration Customer',
      passwordHash,
      role: 'CUSTOMER',
    },
  })

  const otherCustomer = await testPrisma.user.create({
    data: {
      email: testUsers.otherCustomer.email,
      name: 'Other Integration Customer',
      passwordHash,
      role: 'CUSTOMER',
    },
  })

  return { admin, customer, otherCustomer }
}

export async function seedProducts() {
  const mouse = await createProductFixture({ name: 'Integration Mouse', price: 150000, stock: 10 })
  const keyboard = await createProductFixture({ name: 'Integration Keyboard', price: 650000, stock: 5 })

  return { mouse, keyboard }
}

export async function createProductFixture(input: Partial<{ name: string; description: string | null; price: number; stock: number }> = {}) {
  return testPrisma.product.create({
    data: {
      name: input.name ?? 'Integration Product',
      description: input.description ?? 'Product for integration tests',
      price: input.price ?? 100000,
      stock: input.stock ?? 10,
    },
  })
}

export async function seedBaseData() {
  const users = await seedUsers()
  const products = await seedProducts()

  return { users, products }
}
