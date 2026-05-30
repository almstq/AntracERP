
interface QueueCardProps {
  title: string;
  count: number;
  color: 'blue' | 'amber' | 'red' | 'teal' | 'green' | 'purple';
}

const colorMap: Record<string, string> = {
  blue: 'bg-blue/10 text-blue border-blue/20',
  amber: 'bg-amber/10 text-amber border-amber/20',
  red: 'bg-red/10 text-red border-red/20',
  teal: 'bg-teal/10 text-teal border-teal/20',
  green: 'bg-green/10 text-green border-green/20',
  purple: 'bg-purple/10 text-purple border-purple/20',
};

export function QueueCard({ title, count, color }: QueueCardProps) {
  return (
    <div className={`rounded-lg border p-4 ${colorMap[color]}`}>
      <p className="text-xs font-medium opacity-80">{title}</p>
      <p className="text-2xl font-bold mt-1">{count}</p>
    </div>
  );
}
