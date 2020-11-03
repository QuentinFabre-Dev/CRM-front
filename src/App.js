import React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import WithAuth from './components/withAuth';
import Home from './views/Home'
import Commercial from './views/Commercial'
import CommercialAddPc from './views/Commercial_add_pc'
import CommercialViewPc from './views/Commercial_view_pc'
import Login from './views/Login'
import Navbar from './views/Navbar'
import './scss/App.css';

function App() {
  return (
    <div className="App">
        <Router>
          <Navbar />
          <Route exact path="/" component={WithAuth(Home)}/>
          <Route exact path="/commercial" component={WithAuth(Commercial)}/>
          <Route exact path="/commercial/add/pc" component={CommercialAddPc}/>
          <Route exact path="/commercial/pc/view" component={CommercialViewPc}/>
          <Route exact path="/login" component={Login}/>
      </Router>
    </div>
  );
}

export default App;
