import React from "react";
import ReactDOM from "react-dom/client";

import "./index.css";   // ✅ important (keep this)
import App from "./App"; // ✅ safer than alias for root files

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
