import React from "react";
import { Outlet } from "react-router-dom";

const Login: React.FC = () => {
  return (
    <p className ="text-3xl font-extrabold">
      Welcome to E-Filing
      <Outlet/>
    </p>
  );
};

export default Login;
