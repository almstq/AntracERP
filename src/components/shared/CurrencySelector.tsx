import { CURRENCIES, type Currency } from '../../lib/utils/money';

interface Props {
  value: Currency;
  onChange: (v: Currency) => void;
  className?: string;
}

export function CurrencySelector({ value, onChange, className = '' }: Props) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value as Currency)}
      className={`text-xs border border-border rounded px-2 py-1 bg-bg-surface text-text-primary ${className}`}
    >
      {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
    </select>
  );
}
