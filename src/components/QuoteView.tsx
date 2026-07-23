import { forwardRef } from 'react';

interface DateSubject {
  date: string;
  subjects: Array<{
    subjectId: string;
    examTypes: Array<{ type: string; time: string }>;
  }>;
}

interface QuoteData {
  customerName: string;
  studentId: string;
  campus?: string;
  toolPackage: string;
  toolTypeName: string;
  dates: DateSubject[];
  toolFee: number;
  supportFee: number;
  discount: number;
  amountReceived: number;
  totalPrice: number;
}

const formatVND = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

const formatDate = (dateStr: string) => {
  const parts = dateStr.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
};

function getToolPackageLabel(pkg: string) {
  return pkg === 'day' ? 'Ngày' : 'Kỳ';
}

interface QuoteViewProps {
  data: QuoteData;
}

const QuoteView = forwardRef<HTMLDivElement, QuoteViewProps>(({ data }, ref) => {
  const groupedDates: Record<string, DateSubject[]> = {};
  for (const d of data.dates) {
    if (!groupedDates[d.date]) groupedDates[d.date] = [];
    groupedDates[d.date].push(d);
  }

  return (
    <div
      ref={ref}
      className="bg-white text-gray-900 p-6 rounded-xl"
      style={{ fontFamily: 'Inter, system-ui, sans-serif', width: 400 }}
    >
      <div className="text-center border-b border-dashed border-pink-200 pb-4 mb-4">
        <h1 className="text-2xl font-bold tracking-widest text-pink-600">
          ♡ PINK LADY DUYÊN ♡
        </h1>
      </div>

      <div className="flex items-start justify-between mb-4">
        <div className="space-y-0.5">
          <p className="font-semibold text-base">{data.customerName}</p>
          <p className="text-gray-400 text-sm">{data.studentId}</p>
        </div>
        <span className="text-[11px] text-rose-400 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full whitespace-nowrap">
          Tool {getToolPackageLabel(data.toolPackage)}
        </span>
      </div>

      <div className="mb-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Lịch thi</p>
        {Object.entries(groupedDates).map(([date, items]) => (
          <div key={date} className="mb-2">
            <p className="text-sm font-medium text-gray-800">{formatDate(date)}</p>
            <div className="ml-3 space-y-0.5">
              {items.flatMap(d => d.subjects).map((s, si) => (
                <p key={si} className="text-sm text-gray-700">
                  ♡ {s.subjectId}: {s.examTypes.map(e => `${e.type} ${e.time}`).join(', ')}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-pink-50/30 rounded-lg p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Chi tiết giá</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Phí Tool</span>
            <span className="font-medium">{formatVND(data.toolFee)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Phí Support</span>
            <span className="font-medium">{formatVND(data.supportFee)}</span>
          </div>
          <div className="flex justify-between text-red-500">
            <span>Giảm giá</span>
            <span className="font-medium">-{formatVND(data.discount)}</span>
          </div>
          <div className="border-t border-dashed border-pink-200 my-1" />
          <div className="flex justify-between text-blue-600">
            <span>Đã thanh toán</span>
            <span className="font-medium">-{formatVND(data.amountReceived)}</span>
          </div>
          <div className="border-t border-pink-200 pt-2 mt-1">
            <div className="flex justify-between text-base font-bold text-rose-600">
              <span>Tổng cộng</span>
              <span>{formatVND(data.totalPrice)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-dashed border-pink-200 text-center">
        <img
          src="/qr_payment.jpg"
          alt="QR Payment"
          className="mx-auto w-48 h-auto rounded-lg"
        />
      </div>
    </div>
  );
});

QuoteView.displayName = 'QuoteView';

export { QuoteView };
export type { QuoteData };
