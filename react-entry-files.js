// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// src/index.css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-gray-900 text-gray-100;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* Custom scrollbar */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    @apply bg-gray-800;
  }

  ::-webkit-scrollbar-thumb {
    @apply bg-gray-600 rounded-full;
  }

  ::-webkit-scrollbar-thumb:hover {
    @apply bg-gray-500;
  }
}

@layer components {
  /* Glassmorphism effect */
  .glass {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  /* Glow effect */
  .glow {
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
  }

  /* Pulse animation for alerts */
  .alert-pulse {
    animation: pulse-alert 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  @keyframes pulse-alert {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  /* Weather icon animations */
  .weather-icon {
    filter: drop-shadow(0 0 10px currentColor);
  }
}

@layer utilities {
  /* Text shadows for better readability */
  .text-shadow {
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  }

  .text-shadow-lg {
    text-shadow: 0 4px 8px rgba(0, 0, 0, 0.7);
  }

  /* Gradient text */
  .gradient-text {
    @apply bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent;
  }

  /* Neuromarketing-inspired gradients */
  .trust-gradient {
    @apply bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800;
  }

  .safety-gradient {
    @apply bg-gradient-to-br from-green-600 via-green-700 to-green-800;
  }

  .alert-gradient {
    @apply bg-gradient-to-br from-red-600 via-red-700 to-red-800;
  }

  .warning-gradient {
    @apply bg-gradient-to-br from-yellow-600 via-yellow-700 to-yellow-800;
  }
}

// index.html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    
    <!-- SEO Meta Tags -->
    <meta name="description" content="T.R.A.C.E. - Trust-based Rapid Alert Communication Engine. Real-time weather alerts with empathetic, neuromarketing-optimized messaging for your safety." />
    <meta name="keywords" content="weather alerts, emergency notifications, hail alerts, tornado warnings, NADN, T.R.A.C.E., weather safety" />
    <meta name="author" content="NADN Weather Systems" />
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://trace.nadn.com/" />
    <meta property="og:title" content="T.R.A.C.E. Weather Alert System" />
    <meta property="og:description" content="Real-time weather alerts with empathetic messaging for your safety" />
    <meta property="og:image" content="/og-image.jpg" />
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:url" content="https://trace.nadn.com/" />
    <meta property="twitter:title" content="T.R.A.C.E. Weather Alert System" />
    <meta property="twitter:description" content="Real-time weather alerts with empathetic messaging for your safety" />
    <meta property="twitter:image" content="/twitter-image.jpg" />
    
    <!-- PWA -->
    <link rel="manifest" href="/manifest.json" />
    <meta name="theme-color" content="#1a1a2e" />
    
    <!-- Apple Touch Icon -->
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
    
    <title>T.R.A.C.E. - Weather Alert System</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>

// public/manifest.json
{
  "name": "T.R.A.C.E. Weather Alert System",
  "short_name": "T.R.A.C.E.",
  "description": "Trust-based Rapid Alert Communication Engine for weather safety",
  "theme_color": "#1a1a2e",
  "background_color": "#0f0f23",
  "display": "standalone",
  "orientation": "portrait",
  "scope": "/",
  "start_url": "/",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}

// src/App.jsx
// This file contains the main React component from the previous artifact
// Copy the content from the "trace-react-component" artifact here

// src/components/LoadingSpinner.jsx
import React from 'react';
import { Activity } from 'lucide-react';

const LoadingSpinner = ({ message = "Loading..." }) => (
  <div className="flex flex-col items-center justify-center p-8">
    <Activity className="w-8 h-8 animate-spin text-blue-400 mb-4" />
    <p className="text-gray-400">{message}</p>
  </div>
);

export default LoadingSpinner;

// src/components/ErrorBoundary.jsx
import React from 'react';
import { AlertTriangle } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
            <p className="text-gray-400 mb-6">We're sorry, but an error occurred. Please refresh the page to try again.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

// src/utils/weatherUtils.js
export const formatTemperature = (celsius) => {
  if (celsius === null || celsius === undefined) return 'N/A';
  return Math.round(celsius * 9/5 + 32);
};

export const formatWindSpeed = (mps) => {
  if (mps === null || mps === undefined) return 'N/A';
  return Math.round(mps * 2.237);
};

export const getCardinalDirection = (degrees) => {
  if (degrees === null || degrees === undefined) return 'N/A';
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 
                     'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return directions[Math.round((degrees % 360) / 22.5)];
};

export const getAlertSeverityColor = (severity) => {
  const colors = {
    'Extreme': 'border-red-500 bg-red-900/50',
    'Severe': 'border-orange-500 bg-orange-900/50',
    'Moderate': 'border-yellow-500 bg-yellow-900/50',
    'Minor': 'border-blue-500 bg-blue-900/50'
  };
  return colors[severity] || 'border-gray-500 bg-gray-900/50';
};

export const isHailRelated = (alertText) => {
  const hailKeywords = ['hail', 'hailstone', 'hailstorm', 'ice pellets'];
  return hailKeywords.some(keyword => 
    alertText.toLowerCase().includes(keyword)
  );
};

// src/utils/api.js
const API_BASE_URL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000';

export const fetchWeatherData = async (lat, lon) => {
  const response = await fetch(`${API_BASE_URL}/api/weather?lat=${lat}&lon=${lon}`);
  if (!response.ok) throw new Error('Failed to fetch weather data');
  return response.json();
};

export const fetchAlerts = async (lat, lon) => {
  const response = await fetch(`${API_BASE_URL}/api/alerts?lat=${lat}&lon=${lon}`);
  if (!response.ok) throw new Error('Failed to fetch alerts');
  return response.json();
};

export const sendAlert = async (alertData) => {
  const response = await fetch(`${API_BASE_URL}/api/alerts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(alertData),
  });
  if (!response.ok) throw new Error('Failed to send alert');
  return response.json();
};

export const registerUser = async (userData) => {
  const response = await fetch(`${API_BASE_URL}/api/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });
  if (!response.ok) throw new Error('Failed to register user');
  return response.json();
};

export const checkSystemHealth = async () => {
  const response = await fetch(`${API_BASE_URL}/api/health`);
  if (!response.ok) throw new Error('Health check failed');
  return response.json();
};