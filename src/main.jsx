import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

class BootError extends React.Component {
  constructor(props) {
    super(props);
    this.state = { err: null };
  }
  static getDerivedStateFromError(err) {
    return { err };
  }
  render() {
    if (this.state.err) {
      return (
        <div dir="rtl" style={{ minHeight: "100vh", display: "grid", placeItems: "center", fontFamily: "Cairo, sans-serif", padding: 24, background: "#fbf6ec", color: "#2b2320", textAlign: "center" }}>
          <div>
            <p style={{ fontWeight: 800, fontSize: 18 }}>حصلت حاجة وحشة والصفحة وقعت.</p>
            <p style={{ color: "#8a7f70", fontSize: 14 }}>{String(this.state.err.message || this.state.err)}</p>
            <button type="button" onClick={() => window.location.reload()} style={{ marginTop: 12, background: "#c0392b", color: "#fff", border: "none", borderRadius: 12, padding: "10px 18px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>جرّب تاني</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BootError>
      <App />
    </BootError>
  </React.StrictMode>
);
