import { Component } from "react";

// Last line of defence: a render fault shows a recoverable message instead of a blank page.
export default class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error("UI error:", error, info?.componentStack); }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="error-card card" style={{ margin: "80px auto", maxWidth: 520 }}>
        <h3>Something went wrong displaying this page</h3>
        <p>{String(this.state.error?.message || this.state.error)}</p>
        <button type="button" className="btn btn-dark" onClick={() => window.location.reload()}>Reload</button>
      </div>
    );
  }
}
