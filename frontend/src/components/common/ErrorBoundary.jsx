import React from "react";
import { AlertCircle, RefreshCcw } from "lucide-react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 p-6 text-center">
          <div className="mb-4 rounded-full bg-red-100 p-4 text-red-600">
            <AlertCircle size={40} />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Component Crashed</h2>
          <p className="mt-2 max-w-md text-sm text-slate-500">
            {this.state.error?.message || "Unknown error occurred"}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-bold text-white shadow-lg transition hover:bg-slate-800 active:scale-95"
          >
            <RefreshCcw size={16} />
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
