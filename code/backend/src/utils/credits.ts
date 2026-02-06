import { prisma } from '../db'

/**
 * Record a credit transaction and update user balance atomically.
 */
export async function recordTransaction(
  userId: string,
  amount: number,
  reason: string,
  referenceId?: string
): Promise<{ newBalance: number }> {
  const result = await prisma.$transaction(async (tx) => {
    // Update user credits
    const user = await tx.user.update({
      where: { id: userId },
      data: { credits: { increment: amount } },
    })

    // Prevent negative balance
    if (user.credits < 0) {
      throw new Error('Insufficient credits')
    }

    // Record transaction
    await tx.creditTransaction.create({
      data: {
        user_id: userId,
        amount,
        balance: user.credits,
        reason,
        reference_id: referenceId,
      },
    })

    return { newBalance: user.credits }
  })

  return result
}
