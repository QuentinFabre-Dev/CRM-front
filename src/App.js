import React from 'react';
import { BrowserRouter, Route } from "react-router-dom";

import Home from './views/Home'
import Commercial from './views/Commercial'
import Navbar from './views/Navbar'
import './scss/App.css';

function App() {
  return (
    <div className="App">
        <BrowserRouter>
        <Navbar />
        <Route exact path="/" component={Home}/>
        <Route exact path="/commercial" component={Commercial}/>
      </BrowserRouter>
    </div>
  );
}

export default App;
