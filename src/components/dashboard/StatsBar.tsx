
export function StatsBar() {
  const stats = [
    { label: 'Open Tickets', value: '12', color: 'text-blue' },
    { label: 'Pending', value: '5', color: 'text-amber' },
    { label: 'Critical', value: '2', color: 'text-red' },
    { label: 'Resolved Today', value: '8', color: 'text-teal' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map(stat => (
        <div key={stat.label} className="rounded-lg border border-border bg-bg-panel p-3 text-center">
          <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
          <p className="text-[10px] text-text-muted mt-0.5">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
