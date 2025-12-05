'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import {
  Clock,
  UserCheck,
  CheckCircle2,
  Send,
  DollarSign,
} from 'lucide-react'

interface StatsCardsProps {
  stats: {
    awaitingApproval: number
    firstRound: number
    secondRound: number
    sent: number
    totalAmount: number
  }
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Awaiting Approval',
      value: stats.awaitingApproval,
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
    },
    {
      title: 'First Round',
      value: stats.firstRound,
      icon: UserCheck,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Second Round',
      value: stats.secondRound,
      icon: CheckCircle2,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Sent to Client',
      value: stats.sent,
      icon: Send,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Total Amount',
      value: formatCurrency(stats.totalAmount),
      icon: DollarSign,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      isAmount: true,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              {card.title}
            </CardTitle>
            <div className={`rounded-full p-2 ${card.bgColor}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {card.isAmount ? card.value : card.value.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default StatsCards
