import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";

// simple error boundary
class ErrorBoundary extends React.Component {
  constructor(props){ super(props); this.state = { hasError:false, err:null }; }
  static getDerivedStateFromError(err){ return { hasError:true, err }; }
  componentDidCatch(err, info){ console.error("ErrorBoundary caught:", err, info); }
  render(){
    if (this.state.hasError){
      return (
        <div style={{padding:24,fontFamily:"system-ui"}}>
          <h2>Something went wrong.</h2>
          <p style={{color:"#555"}}>Please try going back to Explore or reloading.</p>
          <div style={{display:"flex",gap:8,marginTop:8}}>
            <a href="/explore" style={{padding:"8px 12px",border:"1px solid #e2e8f0",borderRadius:8,textDecoration:"none"}}>Go to Explore</a>
            <button onClick={()=>location.reload()} style={{padding:"8px 12px",borderRadius:8,border:"none",background:"#0056A8",color:"#fff"}}>Reload</button>
          </div>
          <pre style={{marginTop:16,background:"#f8fafc",padding:12,borderRadius:8,overflow:"auto"}}>
            {String(this.state.err)}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>
);
