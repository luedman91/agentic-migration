/**
 * ============================================================================
 * Production React Error Boundary Component
 * ============================================================================
 * 
 * Feature Description:
 * Catches JavaScript errors anywhere in their child component tree, logs the
 * stack trace to the centralized logging engine, and displays a fallback UI
 * instead of unmounting the whole tree to a blank white screen.
 * 
 * Use Cases:
 * 1. Catching unexpected rendering errors in complex modal trees (such as the
 *    Files & Guide explorer or Integration Test wizard) to prevent white screens.
 * 2. Allowing users to recover instantly via "Try Again" or "Reset to Default State".
 * 3. Providing detailed technical error diagnostic cards that can be inspected
 *    or copied for bug reports.
 * ============================================================================
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCw, Home, ShieldAlert } from 'lucide-react';
import { logClientEvent } from '../utils/logger';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  /**
   * Updates state so the next render will show the fallback UI.
   *
   * @param error - The error thrown during rendering
   * @returns Partial state update
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  /**
   * Catches errors from child components and logs them to the centralized logger.
   *
   * @param error - The caught error instance
   * @param errorInfo - React component stack trace information
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    logClientEvent(
      'ERROR',
      `[ErrorBoundary] Caught render failure: ${error.message}`,
      errorInfo.componentStack || undefined
    );
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  /**
   * Resets error state to attempt re-rendering the children.
   */
  handleRetry = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-[300px] w-full p-6 flex items-center justify-center bg-slate-950/90 text-slate-100 rounded-2xl border border-rose-900/60 shadow-2xl">
          <div className="max-w-xl w-full bg-slate-900 border border-rose-800/80 rounded-xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-950/80 text-rose-400 border border-rose-800 rounded-lg">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-mono">
                  {this.props.fallbackTitle || 'Component Render Recovery'}
                </h3>
                <p className="text-xs text-slate-400">
                  An unexpected error was intercepted safely before causing a blank page.
                </p>
              </div>
            </div>

            {this.state.error && (
              <div className="p-3 bg-slate-950 border border-rose-950 rounded-lg text-xs font-mono text-rose-300 overflow-x-auto whitespace-pre-wrap">
                {this.state.error.message}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={this.handleRetry}
                className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Try Again</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
