import React, { useEffect, useState, useRef } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from 'chart.js';
import { io } from 'socket.io-client';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Tooltip, Legend);

const socket = io('/', { path: '/socket.io' });

export default function App() {
  const [history, setHistory] = useState([]);
  const [prices, setPrices] = useState([]);
  const [alertMsg, setAlertMsg] = useState('');

  const volumeChartRef = useRef();
  const priceChartRef = useRef();

  useEffect(() => {
    fetch('/api/historical')
      .then(res => res.json())
      .then(data => {
        setHistory(data.map(d => ({ time: new Date(d.time).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}), volume: d.volume })));
        setPrices(data.map(d => ({ time: new Date(d.time).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}), price: d.price })));
      })
      .catch(() => setAlertMsg('Failed to load historical data'));

    socket.on('trade', ({ price, volume }) => {
      setPrices(prev => [...prev.slice(-1439), { time: new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}), price }]);
      setHistory(prev => [...prev.slice(-1439), { time: new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}), volume }]);
    });

    socket.on('alert', ({ message }) => {
      setAlertMsg(message);
      setTimeout(() => setAlertMsg(""), 5000);
    });

    return () => {
      socket.off('trade');
      socket.off('alert');
    };
  }, []);

  const volumeData = {
    labels: history.map(d => d.time),
    datasets: [
      {
        label: 'Volume',
        data: history.map(d => d.volume),
        backgroundColor: 'rgba(75,192,192,0.5)'
      }
    ]
  };

  const priceData = {
    labels: prices.map(d => d.time),
    datasets: [
      {
        label: 'Price (USDT)',
        data: prices.map(d => d.price),
        borderColor: 'rgba(255,99,132,1)',
        backgroundColor: 'rgba(255,99,132,0.2)',
        fill: false
      }
    ]
  };

  return (
    <div>
      <h1>Bitcoin Volume & Price (24h)</h1>
      {alertMsg && <div className="alert">{alertMsg}</div>}
      <Bar ref={volumeChartRef} data={volumeData} options={{ responsive: true, maintainAspectRatio: false }} />
      <Line ref={priceChartRef} data={priceData} options={{ responsive: true, maintainAspectRatio: false }} />
    </div>
  );
}
