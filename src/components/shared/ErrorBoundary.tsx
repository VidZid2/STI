import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  name?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // We intentionally keep this console.error as it's critical for debugging real crashes
    console.error(`[ErrorBoundary - ${this.props.name || 'Global'}]`, error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          padding: '32px',
          margin: '16px auto',
          maxWidth: '500px',
          borderRadius: '16px',
          background: 'var(--bg-surface, #ffffff)',
          border: '1px solid var(--border-subtle, rgba(0, 0, 0, 0.1))',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          color: 'var(--text-primary, #0f172a)'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'var(--bg-error-light, rgba(239, 68, 68, 0.1))',
            color: 'var(--text-error, #ef4444)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px'
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: 600 }}>Unexpected Component Error</h3>
          <p style={{ margin: '0 0 24px 0', fontSize: '14px', lineHeight: 1.5, color: 'var(--text-secondary, #64748b)' }}>
            We've encountered an issue while rendering this section. You can try reloading it. 
            {this.state.error && (
                <span style={{ 
                    display: 'block', 
                    marginTop: '12px', 
                    padding: '12px', 
                    fontSize: '11px', 
                    fontFamily: 'monospace', 
                    background: 'var(--bg-canvas, #f8fafc)', 
                    borderRadius: '8px', 
                    color: 'var(--text-muted, #94a3b8)',
                    wordBreak: 'break-all'
                }}>
                    {this.state.error.message}
                </span>
            )}
          </p>
          <button
            onClick={this.handleRetry}
            style={{
              padding: '10px 20px',
              background: 'var(--accent-primary, #3b82f6)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            onMouseDown={(e) => e.currentTarget.style.transform = 'translateY(1px)'}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
