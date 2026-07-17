const bcrypt = require('bcryptjs')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.product.deleteMany()
  await prisma.user.deleteMany()

  const passwordHash = await bcrypt.hash('password123', 10)

  const user = await prisma.user.create({
    data: {
      email: 'admin@solutech.test',
      name: 'Solutech Admin',
      passwordHash,
    },
  })

  await prisma.product.createMany({
    data: [
      { name: 'Wireless Mouse', description: 'Ergonomic mouse', price: 150000, stock: 25 },
      { name: 'Mechanical Keyboard', description: 'Blue switch keyboard', price: 650000, stock: 12 },
      { name: 'USB-C Cable', description: '1 meter fast charging cable', price: 75000, stock: 100 },
    ],
  })

  console.log(`Seeded user ${user.email} with password password123`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
