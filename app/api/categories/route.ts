import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/categories - List all categories with expense groups
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all active categories with their expense groups
    const categories = await prisma.category.findMany({
      where: {
        isActive: true,
      },
      include: {
        expenseGroup: {
          select: {
            id: true,
            key: true,
            label: true,
            labelFr: true,
            icon: true,
            color: true,
            sortOrder: true,
          },
        },
      },
      orderBy: [
        { expenseGroup: { sortOrder: 'asc' } },
        { name: 'asc' },
      ],
    })

    // Also fetch expense groups for grouping in UI
    const expenseGroups = await prisma.expenseGroup.findMany({
      where: {
        isActive: true,
      },
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json({ categories, expenseGroups })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
