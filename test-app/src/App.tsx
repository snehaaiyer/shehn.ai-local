import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <nav>
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
        </nav>
        
        <Routes>
          <Route path="/" element={<div>Home Page</div>} />
          <Route path="/about" element={<div>About Page</div>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
