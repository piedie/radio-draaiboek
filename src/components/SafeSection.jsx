import React from 'react';
import ErrorBoundary from './ErrorBoundary';

export default function SafeSection({ name, title, className, children }) {
  return (
    <ErrorBoundary name={name} title={title}>
      <div className={className}>{children}</div>
    </ErrorBoundary>
  );
}
