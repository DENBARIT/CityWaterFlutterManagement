export default function EmptyState({ message = 'No data found.' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-full bg-[rgba(29,158,117,0.08)] flex items-center justify-center text-xl mb-4">
        📭
      </div>
      <p className="text-sm text-[rgba(232,244,240,0.35)] font-light">{message}</p>
    </div>
  );
}