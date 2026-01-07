import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import ItemDetailHeader from '@/components/inventory/ItemDetailHeader'
import StockMovementHistory from '@/components/inventory/StockMovementHistory'

export const metadata: Metadata = {
  title: 'Inventory Item Details | Bakery Hub',
  description: 'View detailed inventory item information and stock movement history',
}

interface PageProps {
  params: {
    id: string
  }
}

export default async function InventoryItemDetailPage({ params }: PageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  // Get user's default bakery
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { defaultBakeryId: true },
  })

  if (!user?.defaultBakeryId) {
    redirect('/dashboard')
  }

  const bakeryId = user.defaultBakeryId

  // Fetch inventory item with supplier
  const item = await prisma.inventoryItem.findUnique({
    where: {
      id: params.id,
      bakeryId: bakeryId, // Ensure user can only access items from their bakery
    },
    include: {
      supplier: {
        select: {
          name: true,
        },
      },
    },
  })

  if (!item) {
    redirect('/inventory')
  }

  // Fetch stock movements for this item
  const stockMovements = await prisma.stockMovement.findMany({
    where: {
      itemId: params.id,
      bakeryId: bakeryId,
    },
    include: {
      productionLog: {
        select: {
          id: true,
          productName: true,
        },
      },
      expense: {
        select: {
          id: true,
          description: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  // Calculate initial stock by working backwards from current stock
  const totalChange = stockMovements.reduce(
    (sum, movement) => sum + movement.quantity,
    0
  )
  const initialStock = item.currentStock - totalChange

  // Serialize data for client components
  const serializedMovements = stockMovements.map((movement) => ({
    id: movement.id,
    type: movement.type,
    quantity: movement.quantity,
    unitCost: movement.unitCost,
    reason: movement.reason,
    createdByName: movement.createdByName,
    createdAt: movement.createdAt.toISOString(),
    productionLogId: movement.productionLogId,
    expenseId: movement.expenseId,
    productionLog: movement.productionLog,
    expense: movement.expense,
  }))

  return (
    <div className="p-6 space-y-6">
      {/* Back Link */}
      <Link
        href="/inventory"
        className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Inventory
      </Link>

      {/* Item Header */}
      <ItemDetailHeader item={item} />

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total Movements
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {stockMovements.length}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total Purchased
          </p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
            {stockMovements
              .filter((m) => m.type === 'Purchase')
              .reduce((sum, m) => sum + Math.abs(m.quantity), 0)
              .toFixed(2)}{' '}
            {item.unit}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total Used
          </p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {stockMovements
              .filter((m) => m.type === 'Usage')
              .reduce((sum, m) => sum + Math.abs(m.quantity), 0)
              .toFixed(2)}{' '}
            {item.unit}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total Wasted
          </p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
            {stockMovements
              .filter((m) => m.type === 'Waste')
              .reduce((sum, m) => sum + Math.abs(m.quantity), 0)
              .toFixed(2)}{' '}
            {item.unit}
          </p>
        </div>
      </div>

      {/* Movement History */}
      <StockMovementHistory
        movements={serializedMovements}
        unit={item.unit}
        initialStock={initialStock}
      />
    </div>
  )
}
