import React from "react";
import { Routes, Route } from "react-router-dom";
import MainPage from "./MainPage";
import About from "./About";
import Header from "./Header";
import Footer from "./Footer";
import MangerProduct from "./MangerProduct";
import Sales from "./Sales";
import Reports from "./Reports";
import Arrangement from "./Arrangement";
import Messege from "./Messege";
import EditPost from "./EditPost";
import MessagesRequest from "./MessagesRequest";
import Login from "./Login";
import Register from "./Register";
import EmployeeManager from "./EmployeeManager"; // ✅ הוספה
import UpdateProducts from "./UpdateProducts";
import ManageEmployeeRequests from "./ManageEmployeeRequests"; // ← ייבוא הקומפוננטה החדשה






function MyRoutes() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/main-page" element={<MainPage />} />
        <Route path="/about" element={<About />} />
        <Route path="/manger-product" element={<MangerProduct />} />
        <Route
          path="/employee-manager/requests"
          element={<ManageEmployeeRequests />}
        />
        <Route path="/sales" element={<Sales />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/arrangement" element={<Arrangement />} />
        <Route path="/messege" element={<Messege />} />
        <Route path="/editpost/:id" element={<EditPost />} />
        <Route path="/register" element={<Register />} />
        <Route path="/manager-products-low" element={<MangerProduct />} />
        <Route path="/employee-manager" element={<EmployeeManager />} />{" "}
        <Route path="/update-products" element={<UpdateProducts />} />
        <Route
          path="/main-page/messages-requests"
          element={<MessagesRequest />}
        />
        {/* ✅ הנתיב החדש */}
      </Routes>
      <Footer />
    </>
  );
}

export default MyRoutes;
