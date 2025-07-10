import React from 'react';

type PageHeaderProps = {
  title: string;
  description?: string;
};

export default function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="mb-6">
      <h1 className="font-headline text-3xl font-semibold text-foreground">{title}</h1>
      {description && <p className="mt-1 text-muted-foreground">{description}</p>}
    </div>
  );
}
