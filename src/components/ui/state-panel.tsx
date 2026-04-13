import { AlertCircle, Loader2, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';

type StatePanelProps = {
  type: 'loading' | 'error' | 'empty';
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function StatePanel({ type, title, description, actionLabel, onAction }: StatePanelProps) {
  const icon =
    type === 'loading'
      ? <Loader2 className="w-5 h-5 animate-spin" />
      : type === 'error'
      ? <AlertCircle className="w-5 h-5" />
      : <Inbox className="w-5 h-5" />;

  return (
    <div className="rounded-xl border border-border/70 bg-card/70 p-6 text-center">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon}
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      {actionLabel && onAction && (
        <Button className="mt-4" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
