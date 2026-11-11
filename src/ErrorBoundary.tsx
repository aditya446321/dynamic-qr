import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { error: Error | null };

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[KinetiQR] Unhandled route render error', {
      page: window.location.pathname,
      message: error.message,
      stack: error.stack,
      componentStack: info.componentStack,
    });
  }

  private async copyDetails() {
    const error = this.state.error;
    const details = [
      'KinetiQR error report',
      'Page: ' + window.location.pathname,
      'Message: ' + (error?.message || 'Unknown error'),
      'Stack: ' + (error?.stack || 'No stack available'),
    ].join('\n\n');
    try {
      await navigator.clipboard.writeText(details);
    } catch {
      const field = document.createElement('textarea');
      field.value = details;
      field.setAttribute('readonly', '');
      field.style.position = 'fixed';
      field.style.opacity = '0';
      document.body.appendChild(field);
      field.select();
      document.execCommand('copy');
      field.remove();
    }
  }

  render() {
    if (this.state.error) {
      return <main className="kq-error-screen" role="alert">
        <div className="kq-error-card">
          <span className="kq-error-eyebrow">KINETIQR WORKSPACE</span>
          <h1>Something went wrong</h1>
          <p>This page hit an unexpected error. Your account data has not been changed by this screen.</p>
          <button type="button" className="primary-button" onClick={() => void this.copyDetails()}>Copy error details</button>
          <button type="button" className="secondary-button" onClick={() => window.location.reload()}>Reload page</button>
        </div>
      </main>;
    }
    return this.props.children;
  }
}
