'use client';

import { Card, CardContent } from '@/components/ui/card';
import {
  IconFileImport,
  IconCheck,
  IconCircleCheck,
  IconX
} from '@tabler/icons-react';

type InboundInvoiceStatus = 'imported' | 'accepted' | 'paid' | 'refused';

interface InboundInvoice {
  status: InboundInvoiceStatus;
  totalAmount: string | number;
}

interface InboundInvoiceStatusCardsProps {
  invoices: InboundInvoice[];
  selectedStatus: InboundInvoiceStatus | null;
  onStatusClick: (status: InboundInvoiceStatus) => void;
}

const STATUS_CONFIG = {
  imported: {
    label: 'À vérifier',
    icon: IconFileImport,
    color: 'text-orange-500 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/50',
    borderColor: 'border-orange-500 dark:border-orange-400',
  },
  accepted: {
    label: 'À payer',
    icon: IconCheck,
    color: 'text-blue-500 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/50',
    borderColor: 'border-blue-500 dark:border-blue-400',
  },
  paid: {
    label: 'Payé',
    icon: IconCircleCheck,
    color: 'text-green-500 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/50',
    borderColor: 'border-green-500 dark:border-green-400',
  },
  refused: {
    label: 'Refusé',
    icon: IconX,
    color: 'text-red-500 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/50',
    borderColor: 'border-red-500 dark:border-red-400',
  },
} as const;

export function InboundInvoiceStatusCards({ invoices, selectedStatus, onStatusClick }: InboundInvoiceStatusCardsProps) {
  // Calculer stats par statut
  const stats = (Object.keys(STATUS_CONFIG) as InboundInvoiceStatus[]).map((status) => {
    const filtered = invoices.filter((inv) => inv.status === status);
    const count = filtered.length;
    const totalAmount = filtered.reduce((acc, inv) => {
      const amount = typeof inv.totalAmount === 'string' ? parseFloat(inv.totalAmount) : inv.totalAmount;
      return acc + (isNaN(amount) ? 0 : amount);
    }, 0);

    return {
      status,
      count,
      totalAmount,
      ...STATUS_CONFIG[status],
    };
  });

  // Regrouper Paid + Refused dans "Terminés"
  const displayStats = [
    stats.find(s => s.status === 'imported')!,
    stats.find(s => s.status === 'accepted')!,
    {
      status: 'terminated' as const,
      label: 'Terminés',
      icon: IconCircleCheck,
      color: 'text-gray-500 dark:text-gray-400',
      bgColor: 'bg-gray-100 dark:bg-gray-800',
      borderColor: 'border-gray-500 dark:border-gray-400',
      count: stats.filter(s => s.status === 'paid' || s.status === 'refused').reduce((acc, s) => acc + s.count, 0),
      totalAmount: stats.filter(s => s.status === 'paid' || s.status === 'refused').reduce((acc, s) => acc + s.totalAmount, 0),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {displayStats.map(({ status, label, icon: Icon, color, bgColor, borderColor, count, totalAmount }) => {
        const isSelected = selectedStatus === status;
        return (
          <Card
            key={status}
            className={'cursor-pointer py-1 border-2 ' + (
              isSelected ? bgColor + ' ' + borderColor : 'border-transparent hover:shadow-md'
            )}
            onClick={() => onStatusClick(status as InboundInvoiceStatus)}
          >
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <div className={'p-1.5 rounded-lg ' + bgColor}>
                    <Icon className={'h-4 w-4 ' + color} />
                  </div>
                  <h3 className="font-medium text-sm">{label}</h3>
                </div>
                <span className={'text-sm font-bold px-2 py-0.5 rounded ' + bgColor}>{count}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <p className="text-xl font-bold">
                  {new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: 'EUR',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(totalAmount)}
                </p>
                <span className="text-xs text-muted-foreground">TTC</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
