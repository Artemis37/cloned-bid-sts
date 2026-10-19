import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'sonner';
import './styles/app.css';
import './styles/gallery.css';
import AuctionPage from './AuctionPage.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuctionPage />
    <Toaster position="top-right" richColors />
  </React.StrictMode>,
);
