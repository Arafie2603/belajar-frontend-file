import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";


const App: React.FC = () => {
  return (
    <Router>
      <nav className="flex justify-center space-x-4 bg-gray-800 p-4">
        <Link className="text-white hover:underline" to="/">Home</Link>
        <Link className="text-white hover:underline" to="/about">About</Link>
        <Link className="text-white hover:underline" to="/contact">Contact</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </Router>
  );
};

export default App;
