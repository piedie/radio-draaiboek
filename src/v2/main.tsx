import React from "react";
import ReactDOM from "react-dom/client";

function V2App() {
  return (
    <div style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 32, fontWeight: 700 }}>Draaiboek v2</h1>
      <p>Hier bouwen we de nieuwe, bredere UI met programma’s, notities en admin.</p>
      <p>
        <a href="/" style={{ textDecoration: "underline" }}>Terug naar v1</a>
      </p>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <V2App />
  </React.StrictMode>
);
