'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { handleClientError } from './error-handler'; // Assuming handleClientError is suitable for logging
import * as Sentry from "@sentry/nextjs";
import { useI18n } from "@/lib/i18n/context"; // Added

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode; // Optional custom fallback UI
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

// Helper functional component to use hooks within class component's render method
const FallbackUI: React.FC<{ error?: Error; onTryAgain: () => void }> = ({ error, onTryAgain }) => {
  const { t } = useI18n();
  return (
    <div style={{ padding: '20px', textAlign: 'center', border: '1px solid #ff000030', borderRadius: '8px', margin: '20px' }}>
      <h2>{t('errors.boundary.title', 'Something went wrong.')}</h2>
      <p>{t('errors.boundary.message', "We're sorry, an unexpected error occurred in this part of the application.")}</p>
      {process.env.NODE_ENV === 'development' && error && (
        <details style={{ whiteSpace: 'pre-wrap', marginTop: '10px' }}>
          <summary>{t('errors.boundary.detailsToggle', 'Error Details (Development Mode)')}</summary>
          {error.toString()}
          <br />
          {error.stack}
        </details>
      )}
      <button 
        onClick={onTryAgain} 
        style={{ marginTop: '15px', padding: '8px 15px', cursor: 'pointer' }}
      >
        {t('common.tryAgain', 'Try again')}
      </button>
    </div>
  );
};

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can log the error to an error reporting service here
    // For now, using our basic client error handler
    handleClientError(error, `ReactErrorBoundary: ${errorInfo.componentStack}`);
    // console.error("Uncaught error in React tree:", error, errorInfo);

    // Report to Sentry
    if (process.env.NODE_ENV === 'production' || process.env.SENTRY_DSN) {
      Sentry.captureException(error, {
        extra: {
          componentStack: errorInfo.componentStack,
        },
      });
    }
  }

  private handleTryAgain = () => {
    this.setState({ hasError: false, error: undefined });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return <FallbackUI error={this.state.error} onTryAgain={this.handleTryAgain} />;
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 