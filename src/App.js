import React from "react";
import { BrowserRouter } from "react-router-dom";
import MyRoutes from "./components/MyRoutes";
import { AuthProvider } from "./components/AuthContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <MyRoutes />
        </BrowserRouter>
      </AuthProvider>
      {/* זה חשוב: חייב להיות מחוץ ל־<BrowserRouter> */}
      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
}

export default App;
