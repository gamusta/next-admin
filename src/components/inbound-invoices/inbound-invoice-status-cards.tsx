'use client';

import { Card, CardContent } from '@/components/ui/card';
import { IconFileImport, IconCheck, IconCircleCheck } from '@tabler/icons-react';

type InboundInvoiceStatus = 'imported' | 'accepted' | 'paid' | 'refused';

interface InboundInvoice {
  status: InboundInvoiceStatus;
  totalAmount: string | number;
}

interface InboundInvoiceStatusCardsProps {
  invoices: InboundInvoice[];
  onCardClick: (statuses: InboundInvoiceStatus[]) => void;
  selectedStatuses: InboundInvoiceStatus[] | null;
}

const CARDS_CONFIG = [
  {
    id: 'imported',
    label: 'À vérifier',
    icon: IconFileImport,
    color: 'text-orange-500 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/50',
    borderColor: 'border-orange-500',
    statuses: ['imported'] as InboundInvoiceStatus[],
  },
  {
    id: 'accepted',
    label: 'À payer',
    icon: IconCheck,
    color: 'text-blue-500 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/50',
    borderColor: 'border-blue-500',
    statuses: ['accepted'] as InboundInvoiceStatus[],
  },
  {
    id: 'terminated',
    label: 'Terminés',
    icon: IconCircleCheck,
    color: 'text-gray-500 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    borderColor: 'border-gray-500',
    statuses: ['paid', 'refused'] as InboundInvoiceStatus[],
  },
] as const;

export function InboundInvoiceStatusCards({ invoices, onCardClick, selectedStatuses }: InboundInvoiceStatusCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {CARDS_CONFIG.map(({ id, label, icon: Icon, color, bgColor, borderColor, statuses }) => {
        const filtered = invoices.filter((inv) => statuses.includes(inv.status));
        const count = filtered.length;
        const totalAmount = filtered.reduce((acc, inv) => {
          const amount = typeof inv.totalAmount === 'string' ? parseFloat(inv.totalAmount) : inv.totalAmount;
          return acc + (isNaN(amount) ? 0 : amount);
        }, 0);

        const isSelected = selectedStatuses && JSON.stringify(selectedStatuses) === JSON.stringify(statuses);

        return (
          <Card
            key={id}
            className={'cursor-pointer py-1 border-2 ' + (
              isSelected ? bgColor + ' ' + borderColor : 'border-transparent hover:shadow-md'
            )}
            onClick={() => onCardClick(statuses)}
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
