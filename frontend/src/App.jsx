import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CartSlideOver from './components/CartSlideOver';
import Home from './pages/Home';
import { useStore } from './context/store';
import { fetchConfig } from './services/api';
import ScrollToTop from './components/ScrollToTop';

function App() {
  const { setStoreStatus } = useStore();

  useEffect(() => {
    fetchConfig().then(config => {
      const status = config.estado_local || config.ESTADO_LOCAL;
      if (status) setStoreStatus(String(status).toUpperCase());
    }).catch(console.error);
  }, []);

  return (
    <Router>
      <ScrollToTop />
      
      {/* Banner quitado de aquí, ahora vive en Home */}

      <div className="min-h-screen flex flex-col bg-gray-50 relative">
        <Navbar />
        <CartSlideOver />

        <div className="flex-grow pt-16">
          <Routes>
            <Route path="/" element={<Home />} />
          </Routes>
        </div>

        {/* Footer Global (Solo aquí) */}
        <Footer />
      </div>
    </Router>
  );
}

export default App;