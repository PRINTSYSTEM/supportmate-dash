import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { QuoteView } from '@/components/QuoteView';
import type { QuoteData } from '@/components/QuoteView';

export default function QuotePage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, error } = useQuery<QuoteData>({
    queryKey: ['quote', id],
    queryFn: () => api.get(`/tool-registrations/${id}/quote`).then(r => r.data),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-700">Không tìm thấy báo giá</p>
          <p className="text-sm text-gray-500 mt-1">Liên kết không hợp lệ hoặc đã hết hạn</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="shadow-xl rounded-xl overflow-hidden">
        <QuoteView data={data} />
      </div>
    </div>
  );
}
