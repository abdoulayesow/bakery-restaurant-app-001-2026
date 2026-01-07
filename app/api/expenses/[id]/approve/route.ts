import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isManagerRole } from '@/lib/roles'

// POST /api/expenses/[id]/approve - Approve or reject an expense (Manager only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only managers can approve/reject
    if (!isManagerRole(session.user.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Manager role required' },
        { status: 403 }
      )
    }

    const { id } = await params

    const existingExpense = await prisma.expense.findUnique({
      where: { id },
    })

    if (!existingExpense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    // Validate user has access to this bakery
    const userBakery = await prisma.userBakery.findUnique({
      where: {
        userId_bakeryId: {
          userId: session.user.id,
          bakeryId: existingExpense.bakeryId,
        },
      },
    })

    if (!userBakery) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { action, reason } = body

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      )
    }

    const newStatus = action === 'approve' ? 'Approved' : 'Rejected'

    // Update expense status
    const expense = await prisma.expense.update({
      where: { id },
      data: {
        status: newStatus,
        approvedBy: session.user.id,
        approvedByName: session.user.name || session.user.email,
        approvedAt: new Date(),
        // Optionally append rejection reason to comments
        comments: action === 'reject' && reason
          ? `${existingExpense.comments ? existingExpense.comments + '\n' : ''}[Rejected: ${reason}]`
          : existingExpense.comments,
      },
      include: {
        bakery: true,
        category: {
          select: {
            id: true,
            name: true,
            nameFr: true,
            color: true,
          },
        },
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // If approved, update daily summary
    if (action === 'approve') {
      const expenseDate = new Date(expense.date)
      expenseDate.setHours(0, 0, 0, 0)

      // Get existing summary to add to expenses
      const existingSummary = await prisma.dailySummary.findUnique({
        where: {
          bakeryId_date: {
            bakeryId: expense.bakeryId,
            date: expenseDate,
          },
        },
      })

      // Calculate expense amount by payment method
      const cashExpense = expense.paymentMethod === 'Cash' ? expense.amountGNF : 0
      const orangeExpense = expense.paymentMethod === 'OrangeMoney' ? expense.amountGNF : 0
      const cardExpense = expense.paymentMethod === 'Card' ? expense.amountGNF : 0

      await prisma.dailySummary.upsert({
        where: {
          bakeryId_date: {
            bakeryId: expense.bakeryId,
            date: expenseDate,
          },
        },
        update: {
          dailyCashExpenses: (existingSummary?.dailyCashExpenses || 0) + cashExpense,
          dailyOrangeExpenses: (existingSummary?.dailyOrangeExpenses || 0) + orangeExpense,
          dailyCardExpenses: (existingSummary?.dailyCardExpenses || 0) + cardExpense,
        },
        create: {
          bakeryId: expense.bakeryId,
          date: expenseDate,
          dailyCashExpenses: cashExpense,
          dailyOrangeExpenses: orangeExpense,
          dailyCardExpenses: cardExpense,
        },
      })
    }

    return NextResponse.json({
      expense,
      message: `Expense ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
    })
  } catch (error) {
    console.error('Error approving/rejecting expense:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
