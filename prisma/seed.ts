import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Create bakeries
  const bakery1 = await prisma.bakery.upsert({
    where: { id: 'bakery-conakry-main' },
    update: {},
    create: {
      id: 'bakery-conakry-main',
      name: 'Boulangerie Centrale',
      location: 'Conakry - Centre',
      currency: 'GNF',
      initialCapital: 50000000,
      initialCashBalance: 5000000,
      initialOrangeBalance: 1000000,
      initialCardBalance: 500000,
      contactPhone: '+224 620 00 00 00',
      managerName: 'Abdoulaye Sow',
      trackingStartDate: new Date('2026-01-01'),
      isActive: true,
    },
  })
  console.log('✅ Created bakery:', bakery1.name)

  const bakery2 = await prisma.bakery.upsert({
    where: { id: 'bakery-kaloum' },
    update: {},
    create: {
      id: 'bakery-kaloum',
      name: 'Boulangerie Kaloum',
      location: 'Conakry - Kaloum',
      currency: 'GNF',
      initialCapital: 35000000,
      initialCashBalance: 3000000,
      initialOrangeBalance: 800000,
      initialCardBalance: 400000,
      contactPhone: '+224 620 11 11 11',
      managerName: 'Mariama Diallo',
      trackingStartDate: new Date('2026-01-01'),
      isActive: true,
    },
  })
  console.log('✅ Created bakery:', bakery2.name)

  const bakery3 = await prisma.bakery.upsert({
    where: { id: 'bakery-ratoma' },
    update: {},
    create: {
      id: 'bakery-ratoma',
      name: 'Boulangerie Ratoma',
      location: 'Conakry - Ratoma',
      currency: 'GNF',
      initialCapital: 40000000,
      initialCashBalance: 4000000,
      initialOrangeBalance: 900000,
      initialCardBalance: 450000,
      contactPhone: '+224 620 22 22 22',
      managerName: 'Ibrahima Camara',
      trackingStartDate: new Date('2026-01-01'),
      isActive: true,
    },
  })
  console.log('✅ Created bakery:', bakery3.name)

  // Use first bakery as the main one for inventory
  const bakery = bakery1

  // Find or create the user (will be created by NextAuth on first login)
  // This ensures the user exists and is assigned to the bakery
  const userEmail = process.env.SEED_USER_EMAIL || 'abdoulaye.sow.1989@gmail.com'

  let user = await prisma.user.findUnique({
    where: { email: userEmail },
  })

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: userEmail,
        name: 'Abdoulaye Sow',
        role: 'Manager',
      },
    })
    console.log('✅ Created user:', user.email)
  } else {
    // Update role to Manager if needed
    user = await prisma.user.update({
      where: { email: userEmail },
      data: { role: 'Manager' },
    })
    console.log('✅ Updated user role:', user.email)
  }

  // Assign user to all bakeries
  await prisma.userBakery.upsert({
    where: {
      userId_bakeryId: {
        userId: user.id,
        bakeryId: bakery1.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      bakeryId: bakery1.id,
    },
  })

  await prisma.userBakery.upsert({
    where: {
      userId_bakeryId: {
        userId: user.id,
        bakeryId: bakery2.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      bakeryId: bakery2.id,
    },
  })

  await prisma.userBakery.upsert({
    where: {
      userId_bakeryId: {
        userId: user.id,
        bakeryId: bakery3.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      bakeryId: bakery3.id,
    },
  })
  console.log('✅ Assigned user to 3 bakeries')

  // Set default bakery for user
  await prisma.user.update({
    where: { id: user.id },
    data: { defaultBakeryId: bakery.id },
  })
  console.log('✅ Set default bakery for user')

  // Create sample inventory items
  const inventoryItems = [
    {
      id: 'inv-flour-001',
      name: 'Wheat Flour',
      nameFr: 'Farine de blé',
      category: 'dry_goods',
      unit: 'kg',
      currentStock: 150,
      minStock: 50,
      reorderPoint: 75,
      unitCostGNF: 15000,
    },
    {
      id: 'inv-sugar-001',
      name: 'Sugar',
      nameFr: 'Sucre',
      category: 'dry_goods',
      unit: 'kg',
      currentStock: 80,
      minStock: 20,
      reorderPoint: 40,
      unitCostGNF: 12000,
    },
    {
      id: 'inv-butter-001',
      name: 'Butter',
      nameFr: 'Beurre',
      category: 'dairy',
      unit: 'kg',
      currentStock: 25,
      minStock: 10,
      reorderPoint: 15,
      unitCostGNF: 45000,
    },
    {
      id: 'inv-eggs-001',
      name: 'Eggs',
      nameFr: 'Oeufs',
      category: 'dairy',
      unit: 'units',
      currentStock: 120,
      minStock: 30,
      reorderPoint: 60,
      unitCostGNF: 2500,
    },
    {
      id: 'inv-yeast-001',
      name: 'Yeast',
      nameFr: 'Levure',
      category: 'dry_goods',
      unit: 'kg',
      currentStock: 5,
      minStock: 2,
      reorderPoint: 3,
      unitCostGNF: 35000,
    },
    {
      id: 'inv-salt-001',
      name: 'Salt',
      nameFr: 'Sel',
      category: 'dry_goods',
      unit: 'kg',
      currentStock: 30,
      minStock: 5,
      reorderPoint: 10,
      unitCostGNF: 3000,
    },
    {
      id: 'inv-milk-001',
      name: 'Milk',
      nameFr: 'Lait',
      category: 'dairy',
      unit: 'liters',
      currentStock: 15,
      minStock: 10,
      reorderPoint: 20,
      unitCostGNF: 8000,
    },
    {
      id: 'inv-vanilla-001',
      name: 'Vanilla Extract',
      nameFr: 'Extrait de vanille',
      category: 'flavorings',
      unit: 'ml',
      currentStock: 200,
      minStock: 50,
      reorderPoint: 100,
      unitCostGNF: 500,
    },
    {
      id: 'inv-boxes-001',
      name: 'Pastry Boxes',
      nameFr: 'Boîtes à pâtisserie',
      category: 'packaging',
      unit: 'units',
      currentStock: 200,
      minStock: 50,
      reorderPoint: 100,
      unitCostGNF: 1500,
    },
    {
      id: 'inv-bags-001',
      name: 'Paper Bags',
      nameFr: 'Sacs en papier',
      category: 'packaging',
      unit: 'units',
      currentStock: 500,
      minStock: 100,
      reorderPoint: 200,
      unitCostGNF: 500,
    },
  ]

  for (const item of inventoryItems) {
    await prisma.inventoryItem.upsert({
      where: { id: item.id },
      update: {},
      create: {
        ...item,
        bakeryId: bakery.id,
      },
    })
  }
  console.log(`✅ Created ${inventoryItems.length} inventory items`)

  // Create a sample stock movement for initial inventory
  await prisma.stockMovement.upsert({
    where: { id: 'movement-initial-001' },
    update: {},
    create: {
      id: 'movement-initial-001',
      bakeryId: bakery.id,
      itemId: 'inv-flour-001',
      type: 'Purchase',
      quantity: 150,
      unitCost: 15000,
      reason: 'Initial stock',
      createdBy: user.id,
      createdByName: user.name,
    },
  })
  console.log('✅ Created sample stock movement')

  // Create expense groups
  const expenseGroups = [
    { id: 'exp-group-ingredients', key: 'ingredients', label: 'Ingredients', labelFr: 'Ingrédients', icon: 'Package', color: '#22c55e', sortOrder: 1 },
    { id: 'exp-group-utilities', key: 'utilities', label: 'Utilities', labelFr: 'Fournitures', icon: 'Zap', color: '#3b82f6', sortOrder: 2 },
    { id: 'exp-group-salaries', key: 'salaries', label: 'Salaries', labelFr: 'Salaires', icon: 'Users', color: '#a855f7', sortOrder: 3 },
    { id: 'exp-group-maintenance', key: 'maintenance', label: 'Maintenance', labelFr: 'Entretien', icon: 'Wrench', color: '#f97316', sortOrder: 4 },
    { id: 'exp-group-rent', key: 'rent', label: 'Rent', labelFr: 'Loyer', icon: 'Building2', color: '#06b6d4', sortOrder: 5 },
    { id: 'exp-group-marketing', key: 'marketing', label: 'Marketing', labelFr: 'Marketing', icon: 'Megaphone', color: '#ec4899', sortOrder: 6 },
    { id: 'exp-group-other', key: 'other', label: 'Other', labelFr: 'Autres', icon: 'MoreHorizontal', color: '#6b7280', sortOrder: 7 },
  ]

  for (const group of expenseGroups) {
    await prisma.expenseGroup.upsert({
      where: { key: group.key },
      update: {},
      create: group,
    })
  }
  console.log(`✅ Created ${expenseGroups.length} expense groups`)

  // Create expense categories
  const categories = [
    // Ingredients
    { id: 'cat-flour', name: 'Flour', nameFr: 'Farine', color: '#22c55e', expenseGroupKey: 'ingredients' },
    { id: 'cat-sugar', name: 'Sugar', nameFr: 'Sucre', color: '#22c55e', expenseGroupKey: 'ingredients' },
    { id: 'cat-butter', name: 'Butter', nameFr: 'Beurre', color: '#22c55e', expenseGroupKey: 'ingredients' },
    { id: 'cat-eggs', name: 'Eggs', nameFr: 'Oeufs', color: '#22c55e', expenseGroupKey: 'ingredients' },
    { id: 'cat-other-ingredients', name: 'Other Ingredients', nameFr: 'Autres ingrédients', color: '#22c55e', expenseGroupKey: 'ingredients' },
    // Utilities
    { id: 'cat-electricity', name: 'Electricity', nameFr: 'Électricité', color: '#3b82f6', expenseGroupKey: 'utilities' },
    { id: 'cat-water', name: 'Water', nameFr: 'Eau', color: '#3b82f6', expenseGroupKey: 'utilities' },
    { id: 'cat-gas', name: 'Gas', nameFr: 'Gaz', color: '#3b82f6', expenseGroupKey: 'utilities' },
    { id: 'cat-internet', name: 'Internet', nameFr: 'Internet', color: '#3b82f6', expenseGroupKey: 'utilities' },
    // Salaries
    { id: 'cat-staff-salaries', name: 'Staff Salaries', nameFr: 'Salaires du personnel', color: '#a855f7', expenseGroupKey: 'salaries' },
    { id: 'cat-bonuses', name: 'Bonuses', nameFr: 'Primes', color: '#a855f7', expenseGroupKey: 'salaries' },
    // Maintenance
    { id: 'cat-equipment-repair', name: 'Equipment Repair', nameFr: 'Réparation équipement', color: '#f97316', expenseGroupKey: 'maintenance' },
    { id: 'cat-cleaning', name: 'Cleaning Supplies', nameFr: 'Produits de nettoyage', color: '#f97316', expenseGroupKey: 'maintenance' },
    // Rent
    { id: 'cat-monthly-rent', name: 'Monthly Rent', nameFr: 'Loyer mensuel', color: '#06b6d4', expenseGroupKey: 'rent' },
    // Marketing
    { id: 'cat-advertising', name: 'Advertising', nameFr: 'Publicité', color: '#ec4899', expenseGroupKey: 'marketing' },
    { id: 'cat-promotions', name: 'Promotions', nameFr: 'Promotions', color: '#ec4899', expenseGroupKey: 'marketing' },
    // Other
    { id: 'cat-miscellaneous', name: 'Miscellaneous', nameFr: 'Divers', color: '#6b7280', expenseGroupKey: 'other' },
  ]

  for (const cat of categories) {
    const group = await prisma.expenseGroup.findUnique({ where: { key: cat.expenseGroupKey } })
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: {
        id: cat.id,
        name: cat.name,
        nameFr: cat.nameFr,
        color: cat.color,
        expenseGroupId: group?.id,
      },
    })
  }
  console.log(`✅ Created ${categories.length} expense categories`)

  // Create suppliers
  const suppliers = [
    { id: 'sup-moulin', name: 'Moulin de Conakry', phone: '+224 622 11 11 11', email: 'contact@moulin-conakry.gn', address: 'Conakry, Centre-ville' },
    { id: 'sup-laiterie', name: 'Laiterie Nationale', phone: '+224 622 22 22 22', email: 'ventes@laiterie.gn', address: 'Conakry, Zone Industrielle' },
    { id: 'sup-emballages', name: 'Emballages Plus', phone: '+224 622 33 33 33', email: 'commandes@emballages.gn', address: 'Conakry, Matoto' },
    { id: 'sup-edg', name: 'Electricité de Guinée', phone: '+224 622 44 44 44', email: null, address: 'Conakry' },
    { id: 'sup-sotelgui', name: 'SOTELGUI', phone: '+224 622 55 55 55', email: null, address: 'Conakry' },
  ]

  for (const sup of suppliers) {
    await prisma.supplier.upsert({
      where: { name: sup.name },
      update: {},
      create: sup,
    })
  }
  console.log(`✅ Created ${suppliers.length} suppliers`)

  console.log('')
  console.log('🎉 Seed completed successfully!')
  console.log('')
  console.log('📋 Summary:')
  console.log(`   - Bakeries:`)
  console.log(`     • ${bakery1.name} (${bakery1.location})`)
  console.log(`     • ${bakery2.name} (${bakery2.location})`)
  console.log(`     • ${bakery3.name} (${bakery3.location})`)
  console.log(`   - User: ${user.email} (${user.role})`)
  console.log(`   - Inventory Items: ${inventoryItems.length}`)
  console.log('')
  console.log('🚀 You can now login and access the app!')
  console.log('💡 Test bakery switching by clicking the logo!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
