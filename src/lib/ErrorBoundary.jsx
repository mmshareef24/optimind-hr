import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Optionally log to monitoring service
    console.error('Runtime error caught by ErrorBoundary:', error, info);
  }

  render() {
    const { error } = this.state;
    if (error) {
      return (
        <div className="p-6">
          <h1 className="text-lg font-semibold mb-2">Something went wrong</h1>
          <p className="text-sm text-slate-700 mb-4">{String(error?.message || 'Unknown error')}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center rounded-md bg-emerald-600 px-3 py-1.5 text-white hover:bg-emerald-700"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}