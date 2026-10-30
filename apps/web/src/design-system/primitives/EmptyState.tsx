import type { ReactNode } from "react";

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
}

export function EmptyState({ title, description, icon }: EmptyStateProps) {
  return (
    <div className="ui-empty-state">
      {icon && <div className="ui-empty-state__icon" aria-hidden="true">{icon}</div>}
      <strong>{title}</strong>
      {description && <p>{description}</p>}
    </div>
  );
}
