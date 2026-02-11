import React from 'react';

/**
 * Simple ErrorBoundary to prevent a single UI bug from blanking the entire app.
 * Keep it dependency-free and production-safe.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Always log, even in production
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', this.props.name || 'boundary', error, info);
    this.setState({ info });
  }

  render() {
    if (this.state.hasError) {
      const Fallback = this.props.fallback;
      if (Fallback) return typeof Fallback === 'function' ? <Fallback error={this.state.error} info={this.state.info} /> : Fallback;

      return (
        <div style={{ padding: 16, border: '1px solid #ef4444', background: '#fef2f2', color: '#991b1b', borderRadius: 8 }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>
            {this.props.title || 'Er ging iets mis in dit onderdeel.'}
          </div>
          <div style={{ fontSize: 12, opacity: 0.85 }}>
            Open de console voor details. Dit onderdeel is uitgeschakeld zodat de rest van de app blijft werken.
          </div>
          {this.props.showMessage !== false && this.state.error?.message && (
            <div style={{ marginTop: 8, fontFamily: 'monospace', fontSize: 12, whiteSpace: 'pre-wrap' }}>
              {this.state.error.message}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
