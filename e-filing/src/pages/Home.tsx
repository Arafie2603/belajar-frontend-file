import React from "react";
import { Outlet } from "react-router-dom";

const Dashboard: React.FC = () => {
  return (
    <p className="text-3xl font-extrabold">
      Ini Dashboard
      <Outlet />
    </p>
  );
};

export default Dashboard;
