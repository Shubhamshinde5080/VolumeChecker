# VolumeChecker

This project provides a simple Bitcoin volume and price monitor using React on the frontend and Node.js on the backend. Data is streamed from Binance in real time and displayed with charts. Alerts are generated when trade volume rises 5% or more compared to the previous 5‑minute interval.

## Development

1. Install dependencies for both client and server:

```bash
npm install --prefix server
npm install --prefix client
```

2. Start the backend and frontend for development:

```bash
npm start --prefix server
npm start --prefix client
```

The frontend runs on `http://localhost:3000` and proxies API requests to the backend on port `3001`.

## Docker

To run everything with Docker:

```bash
docker-compose up --build
```

The React app will be available on port 80 and the server on port 3001.

### Network access

The server streams market data from Binance over WebSocket. If you run the
backend in an environment that blocks outbound WebSocket connections, it will
log `ENETUNREACH` errors and no data will be displayed. Ensure the environment
allows network egress to `stream.binance.com` when deploying.
