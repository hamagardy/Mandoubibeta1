import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./App.css";
import "./index.css"; // Import Tailwind CSS
import "@fortawesome/fontawesome-free/css/all.min.css";
<link
  href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css"
  rel="stylesheet"
/>;

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// ReactDOM.render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>,
//   document.getElementById('root')
// );
