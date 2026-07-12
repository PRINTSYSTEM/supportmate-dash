import { ProcessStatus } from '@/data/types';
import { cn } from '@/lib/utils';

const statusLabels: Record<ProcessStatus, string> = {
  pending: 'Chờ xử lý',
  assigned: 'Đã gán',
  supporting: 'Đang hỗ trợ',
  done: 'Hoàn thành',
  failed: 'Thất bại',
  cancelled: 'Đã hủy',
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
        status === 'failed' && 'status-failed',
        status === 'cancelled' && 'status-cancelled'
      )}
    >
      {statusLabels[status]}
    </span>
  );
}
