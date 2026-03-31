import { ProcessStatus } from '@/data/types';
import { cn } from '@/lib/utils';

const statusLabels: Record<ProcessStatus, string> = {
  pending: 'Pending',
  assigned: 'Assigned',
  supporting: 'Supporting',
  done: 'Done',
  cancelled: 'Cancelled',
};

export function StatusBadge({ status }: { status: ProcessStatus }) {
  return (
    <span
      className={cn(
        'status-badge',
        status === 'pending' && 'status-pending',
        status === 'assigned' && 'status-assigned',
        status === 'supporting' && 'status-supporting',
        status === 'done' && 'status-done',
        status === 'cancelled' && 'status-cancelled'
      )}
    >
      {statusLabels[status]}
    </span>
  );
}
