import React, { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class CanvasErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.warn('Astrodynamics Visualizer Error Caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-[300px] rounded-xl bg-space-950/90 border border-amber-500/30 flex flex-col items-center justify-center p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
              WebGL Renderer Suspended
            </h4>
            <p className="text-xs text-slate-400 max-w-sm">
              Hardware acceleration or 3D context was temporarily unavailable. Telemetry calculations remain unaffected.
            </p>
          </div>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-space-900 hover:bg-space-850 border border-space-border text-xs font-mono text-orbit-cyan transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Re-initialize 3D Context</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

