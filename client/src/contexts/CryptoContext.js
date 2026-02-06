import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

const CryptoContext = createContext();

export const useCrypto = () => {
  const context = useContext(CryptoContext);
  if (!context) {
    throw new Error('useCrypto must be used within a CryptoProvider');
  }
  return context;
};

export const CryptoProvider = ({ children }) => {
  const [cryptos, setCryptos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('http://localhost:3456');
    setSocket(newSocket);

    // Fetch initial crypto data
    fetchCryptos();

    // Set up real-time updates every 60 seconds (1 minute)
    const interval = setInterval(fetchCryptos, 60000);

    return () => {
      newSocket.close();
      clearInterval(interval);
    };
  }, []);

  const fetchCryptos = async (limit = 50) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/crypto/top?limit=${limit}`);
      setCryptos(response.data);
    } catch (error) {
      console.error('Error fetching crypto data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCrypto = async (id) => {
    try {
      const response = await axios.get(`/api/crypto/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching crypto:', error);
      return null;
    }
  };

  const formatPrice = (price, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: price < 1 ? 6 : 2,
      maximumFractionDigits: price < 1 ? 6 : 2
    }).format(price);
  };

  const formatPercentage = (percentage) => {
    return `${percentage > 0 ? '+' : ''}${percentage.toFixed(2)}%`;
  };

  const formatMarketCap = (marketCap) => {
    if (marketCap >= 1e12) {
      return `$${(marketCap / 1e12).toFixed(2)}T`;
    } else if (marketCap >= 1e9) {
      return `$${(marketCap / 1e9).toFixed(2)}B`;
    } else if (marketCap >= 1e6) {
      return `$${(marketCap / 1e6).toFixed(2)}M`;
    } else {
      return `$${marketCap.toLocaleString()}`;
    }
  };

  const getTrustScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getEVIColor = (evi) => {
    if (evi >= 80) return 'text-red-600';
    if (evi >= 60) return 'text-orange-600';
    if (evi >= 40) return 'text-yellow-600';
    return 'text-green-600';
  };

  const value = {
    cryptos,
    loading,
    socket,
    fetchCryptos,
    getCrypto,
    formatPrice,
    formatPercentage,
    formatMarketCap,
    getTrustScoreColor,
    getEVIColor
  };

  return (
    <CryptoContext.Provider value={value}>
      {children}
    </CryptoContext.Provider>
  );
};