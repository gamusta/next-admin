'use client';

import { Card, CardContent } from '@/components/ui/card';
import {
  IconFileText,
  IconSend,
  IconClock,
  IconCheck,
  IconX
} from '@tabler/icons-react';

type QuoteStatus = 'draft' | 'to_send' | 'pending' | 'refused' | 'signed';

interface Quote {
  status: QuoteStatus;
  subtotal: string | number;
}

interface QuoteStatusCardsProps {
  quotes: Quote[];
  selectedStatus: QuoteStatus | null;
  onStatusClick: (status: QuoteStatus) => void;
}

const STATUS_CONFIG = {
  draft: {
    label: 'Brouillon',
    icon: IconFileText,
    color: 'text-gray-500 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
  },
  to_send: {
    label: 'À envoyer',
    icon: IconSend,
    color: 'text-blue-500 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/50',
  },
  pending: {
    label: 'En attente',
    icon: IconClock,
    color: 'text-orange-500 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/50',
  },
  signed: {
    label: 'Signé',
    icon: IconCheck,
    color: 'text-green-500 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/50',
  },
  refused: {
    label: 'Refusé',
    icon: IconX,
    color: 'text-red-500 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/50',
  },
} as const;

export function QuoteStatusCards({ quotes, selectedStatus, onStatusClick }: QuoteStatusCardsProps) {
  // Calculer stats par statut
  const stats = (Object.keys(STATUS_CONFIG) as QuoteStatus[]).map((status) => {
    const filtered = quotes.filter((q) => q.status === status);
    const count = filtered.length;
    const subtotal = filtered.reduce((acc, q) => {
      const amount = typeof q.subtotal === 'string' ? parseFloat(q.subtotal) : q.subtotal;
      return acc + (isNaN(amount) ? 0 : amount);
    }, 0);

    return {
      status,
      count,
      subtotal,
      ...STATUS_CONFIG[status],
    };
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
      {stats.map(({ status, label, icon: Icon, color, bgColor, count, subtotal }) => {
        const isSelected = selectedStatus === status;
        return (
          <Card
            key={status}
            className={`cursor-pointer py-1 border-2 ${
              isSelected ? `${bgColor} ${color.replace('text-', 'border-')}` : 'border-transparent hover:shadow-md'
            }`}
            onClick={() => onStatusClick(status)}
          >
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${bgColor}`}>
                    <Icon className={`h-4 w-4 ${color}`} />
                  </div>
                  <h3 className="font-medium text-sm">{label}</h3>
                </div>
                <span className={`text-sm font-bold px-2 py-0.5 rounded ${bgColor}`}>{count}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <p className="text-xl font-bold">
                  {new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: 'EUR',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(subtotal)}
                </p>
                <span className="text-xs text-muted-foreground">HT</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
