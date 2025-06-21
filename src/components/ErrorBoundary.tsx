// components/ErrorBoundary.tsx
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4">
          <h1 className="text-xl font-bold text-red-600">Something went wrong.</h1>
          <p>Please refresh the page or contact support.</p>
          <details className="mt-4 whitespace-pre-wrap">
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.error?.stack}
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}
