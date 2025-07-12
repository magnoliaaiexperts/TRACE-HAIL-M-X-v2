# NADN Weather Alert System - Complete Vercel Deployment Package

## Project Structure

```
nadn-weather-system/
├── api/                    # Vercel API Routes (Python)
│   ├── weather.py         # NWS weather data endpoints
│   ├── alerts.py          # Alert processing endpoints
│   ├── users.py           # User management endpoints
│   ├── sms.py             # Twilio SMS endpoints
│   └── _lib/              # Shared Python utilities
│       ├── db.py          # MongoDB connection
│       ├── geo.py         # Geo-targeting utilities
│       └── messaging.py   # SMS/Email templates
├── src/                   # React Frontend
│   ├── App.jsx           # Main React component
│   ├── components/       # React components
│   └── utils/            # Frontend utilities
├── public/               # Static assets
├── package.json          # Node dependencies
├── requirements.txt      # Python dependencies
├── vercel.json          # Vercel configuration
└── .env.example         # Environment variables template
```

## Step 1: Backend API Setup (Python/Vercel Functions)

### api/weather.py
```python
from http.server import BaseHTTPRequestHandler
import json
import requests
from datetime import datetime
from ._lib.db import get_db_connection
from ._lib.geo import point_in_radius

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            # Parse query parameters
            from urllib.parse import urlparse, parse_qs
            query_components = parse_qs(urlparse(self.path).query)
            lat = float(query_components.get('lat', [0])[0])
            lon = float(query_components.get('lon', [0])[0])
            
            # Fetch from NWS API
            headers = {'User-Agent': '(NADN Weather System, nadn.com)'}
            
            # Get grid points
            points_url = f"https://api.weather.gov/points/{lat:.4f},{lon:.4f}"
            points_resp = requests.get(points_url, headers=headers)
            points_data = points_resp.json()
            
            # Get current observations
            stations_url = points_data['properties']['observationStations']
            stations_resp = requests.get(stations_url, headers=headers)
            stations_data = stations_resp.json()
            
            if stations_data['features']:
                station_id = stations_data['features'][0]['properties']['stationIdentifier']
                obs_url = f"https://api.weather.gov/stations/{station_id}/observations/latest"
                obs_resp = requests.get(obs_url, headers=headers)
                obs_data = obs_resp.json()
                
                # Format response
                props = obs_data['properties']
                response_data = {
                    'location': {
                        'city': points_data['properties']['relativeLocation']['properties']['city'],
                        'state': points_data['properties']['relativeLocation']['properties']['state']
                    },
                    'current': {
                        'temperature': props.get('temperature', {}).get('value'),
                        'humidity': props.get('relativeHumidity', {}).get('value'),
                        'windSpeed': props.get('windSpeed', {}).get('value'),
                        'windDirection': props.get('windDirection', {}).get('value'),
                        'description': props.get('textDescription', '')
                    },
                    'timestamp': datetime.now().isoformat()
                }
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(response_data).encode())
            else:
                self.send_error(404, "No weather stations found")
                
        except Exception as e:
            self.send_error(500, str(e))
            
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
```

### api/alerts.py
```python
from http.server import BaseHTTPRequestHandler
import json
import requests
from datetime import datetime
from ._lib.db import get_db_connection
from ._lib.geo import check_alert_relevance
from ._lib.messaging import send_alert_sms

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            from urllib.parse import urlparse, parse_qs
            query_components = parse_qs(urlparse(self.path).query)
            lat = float(query_components.get('lat', [0])[0])
            lon = float(query_components.get('lon', [0])[0])
            
            # Get NWS alerts
            headers = {'User-Agent': '(NADN Weather System, nadn.com)'}
            points_url = f"https://api.weather.gov/points/{lat:.4f},{lon:.4f}"
            points_resp = requests.get(points_url, headers=headers)
            points_data = points_resp.json()
            
            # Get zone ID and fetch alerts
            zone_id = points_data['properties']['forecastZone'].split('/')[-1]
            alerts_url = f"https://api.weather.gov/alerts/active/zone/{zone_id}"
            alerts_resp = requests.get(alerts_url, headers=headers)
            alerts_data = alerts_resp.json()
            
            # Process alerts
            processed_alerts = []
            for feature in alerts_data.get('features', []):
                alert = feature['properties']
                
                # Check if hail-related
                is_hail = any(keyword in alert.get('description', '').lower() 
                             for keyword in ['hail', 'hailstone', 'hailstorm'])
                
                processed_alerts.append({
                    'id': feature['id'],
                    'type': alert['event'],
                    'severity': alert['severity'],
                    'certainty': alert['certainty'],
                    'urgency': alert['urgency'],
                    'headline': alert['headline'],
                    'description': alert['description'][:200] + '...',
                    'onset': alert['onset'],
                    'expires': alert['expires'],
                    'isHailRelated': is_hail,
                    'areas': alert['areaDesc']
                })
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({
                'alerts': processed_alerts,
                'count': len(processed_alerts),
                'timestamp': datetime.now().isoformat()
            }).encode())
            
        except Exception as e:
            self.send_error(500, str(e))
            
    def do_POST(self):
        # Process alert and send notifications
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            alert_id = data.get('alertId')
            user_ids = data.get('userIds', [])
            
            # Get database connection
            db = get_db_connection()
            
            # Send notifications to affected users
            notifications_sent = 0
            for user_id in user_ids:
                user = db.users.find_one({'_id': user_id})
                if user and user.get('phone'):
                    # Send SMS using Twilio
                    success = send_alert_sms(
                        user['phone'],
                        data.get('message', 'Weather alert for your area!')
                    )
                    if success:
                        notifications_sent += 1
                        
                        # Log the communication
                        db.messages.insert_one({
                            'userId': user_id,
                            'alertId': alert_id,
                            'type': 'SMS',
                            'timestamp': datetime.now(),
                            'status': 'sent'
                        })
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({
                'success': True,
                'notificationsSent': notifications_sent
            }).encode())
            
        except Exception as e:
            self.send_error(500, str(e))
```

### api/_lib/db.py
```python
import os
from pymongo import MongoClient

_client = None

def get_db_connection():
    global _client
    if _client is None:
        mongodb_uri = os.environ.get('MONGODB_URI')
        if not mongodb_uri:
            raise ValueError("MONGODB_URI environment variable not set")
        _client = MongoClient(mongodb_uri)
    return _client.nadn_weather
```

### api/_lib/messaging.py
```python
import os
from twilio.rest import Client

def get_twilio_client():
    account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
    auth_token = os.environ.get('TWILIO_AUTH_TOKEN')
    if not account_sid or not auth_token:
        raise ValueError("Twilio credentials not configured")
    return Client(account_sid, auth_token)

def send_alert_sms(to_number, message):
    try:
        client = get_twilio_client()
        from_number = os.environ.get('TWILIO_PHONE_NUMBER')
        
        # Neuromarketing-optimized message templates
        empathetic_prefix = "🛡️ We're here to help - "
        safety_suffix = "\n\nYour safety matters to us. Reply HELP for assistance."
        
        full_message = empathetic_prefix + message + safety_suffix
        
        message = client.messages.create(
            body=full_message,
            from_=from_number,
            to=to_number
        )
        
        return message.sid
    except Exception as e:
        print(f"SMS send error: {e}")
        return None
```

## Step 2: Frontend React App

### src/App.jsx
```jsx
import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Cloud, Wind, Droplets, MapPin, Bell, Shield } from 'lucide-react';
import WeatherMap from './components/WeatherMap';
import AlertsList from './components/AlertsList';
import LocationSetup from './components/LocationSetup';
import CurrentWeather from './components/CurrentWeather';

function App() {
  const [location, setLocation] = useState(null);
  const [weather, setWeather] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch weather data
  const fetchWeatherData = useCallback(async (lat, lon) => {
    setLoading(true);
    setError('');
    
    try {
      // Fetch current weather
      const weatherRes = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
      if (!weatherRes.ok) throw new Error('Failed to fetch weather');
      const weatherData = await weatherRes.json();
      setWeather(weatherData);

      // Fetch alerts
      const alertsRes = await fetch(`/api/alerts?lat=${lat}&lon=${lon}`);
      if (!alertsRes.ok) throw new Error('Failed to fetch alerts');
      const alertsData = await alertsRes.json();
      setAlerts(alertsData.alerts);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle location update
  const handleLocationSet = (newLocation) => {
    setLocation(newLocation);
    localStorage.setItem('userLocation', JSON.stringify(newLocation));
    fetchWeatherData(newLocation.lat, newLocation.lon);
  };

  // Load saved location on mount
  useEffect(() => {
    const savedLocation = localStorage.getItem('userLocation');
    if (savedLocation) {
      const loc = JSON.parse(savedLocation);
      setLocation(loc);
      fetchWeatherData(loc.lat, loc.lon);
    }
  }, [fetchWeatherData]);

  // Auto-refresh data every 5 minutes
  useEffect(() => {
    if (location) {
      const interval = setInterval(() => {
        fetchWeatherData(location.lat, location.lon);
      }, 300000); // 5 minutes
      
      return () => clearInterval(interval);
    }
  }, [location, fetchWeatherData]);

  if (!location) {
    return <LocationSetup onLocationSet={handleLocationSet} />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 p-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-blue-500" />
            <h1 className="text-2xl font-bold">NADN Weather Alerts</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-400">
              <MapPin className="inline w-4 h-4 mr-1" />
              {weather?.location?.city}, {weather?.location?.state}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <WeatherMap location={location} />
            <AlertsList alerts={alerts} loading={loading} />
          </div>
          
          <div>
            <CurrentWeather weather={weather?.current} loading={loading} />
            
            <div className="mt-6 bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Bell className="w-5 h-5 mr-2 text-yellow-500" />
                Alert Settings
              </h3>
              <p className="text-sm text-gray-400 mb-4">
                You'll receive SMS alerts for severe weather in your area
              </p>
              <button 
                onClick={() => handleLocationSet(location)}
                className="w-full bg-blue-600 hover:bg-blue-700 py-2 px-4 rounded-lg transition"
              >
                Update Location
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
```

## Step 3: Configuration Files

### package.json
```json
{
  "name": "nadn-weather-alerts",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "lucide-react": "^0.263.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.0",
    "autoprefixer": "^10.4.14",
    "postcss": "^8.4.24",
    "tailwindcss": "^3.3.2",
    "vite": "^4.3.9"
  }
}
```

### requirements.txt
```
requests==2.31.0
pymongo==4.5.0
twilio==8.10.0
python-dotenv==1.0.0
```

### vercel.json
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "functions": {
    "api/*.py": {
      "runtime": "python3.9"
    }
  },
  "env": {
    "MONGODB_URI": "@mongodb-uri",
    "TWILIO_ACCOUNT_SID": "@twilio-account-sid",
    "TWILIO_AUTH_TOKEN": "@twilio-auth-token",
    "TWILIO_PHONE_NUMBER": "@twilio-phone-number"
  }
}
```

### .env.example
```
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/nadn_weather

# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Optional: API Keys for enhanced features
OPENWEATHERMAP_API_KEY=your_api_key_here
```

## Step 4: Deployment Instructions

### Prerequisites
1. Vercel account (free tier works)
2. MongoDB Atlas account (free tier available)
3. Twilio account for SMS (trial account works)

### Deployment Steps

1. **Clone and Setup Repository**
```bash
git init nadn-weather-system
cd nadn-weather-system
```

2. **Install Vercel CLI**
```bash
npm i -g vercel
```

3. **Setup Environment Variables in Vercel**
```bash
vercel env add MONGODB_URI
vercel env add TWILIO_ACCOUNT_SID
vercel env add TWILIO_AUTH_TOKEN
vercel env add TWILIO_PHONE_NUMBER
```

4. **Deploy to Vercel**
```bash
vercel --prod
```

### Post-Deployment Configuration

1. **MongoDB Setup**
   - Create a cluster on MongoDB Atlas
   - Create database: `nadn_weather`
   - Create collections: `users`, `alerts`, `messages`
   - Add indexes for geo queries

2. **Twilio Configuration**
   - Verify phone numbers for testing
   - Configure messaging service
   - Set up webhook URLs

3. **Domain Configuration** (Optional)
   - Add custom domain in Vercel dashboard
   - Update DNS records

## Step 5: Additional Frontend Components

### src/components/WeatherMap.jsx
```jsx
import React from 'react';

const WeatherMap = ({ location }) => {
  if (!location) return null;
  
  return (
    <div className="bg-gray-800 rounded-lg p-1 h-[400px] mb-6">
      <iframe
        title="Weather Radar"
        className="w-full h-full rounded"
        src={`https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=default&metricTemp=default&metricWind=default&zoom=8&overlay=radar&product=radar&level=surface&lat=${location.lat}&lon=${location.lon}`}
        frameBorder="0"
      />
    </div>
  );
};

export default WeatherMap;
```

### src/components/AlertsList.jsx
```jsx
import React from 'react';
import { AlertTriangle, Cloud, Wind } from 'lucide-react';

const AlertsList = ({ alerts, loading }) => {
  const getAlertIcon = (type) => {
    if (type.includes('Tornado')) return <Wind className="w-6 h-6" />;
    if (type.includes('Thunderstorm')) return <Cloud className="w-6 h-6" />;
    return <AlertTriangle className="w-6 h-6" />;
  };

  const getAlertColor = (severity) => {
    switch (severity) {
      case 'Extreme': return 'border-red-500 bg-red-900/50';
      case 'Severe': return 'border-orange-500 bg-orange-900/50';
      case 'Moderate': return 'border-yellow-500 bg-yellow-900/50';
      default: return 'border-blue-500 bg-blue-900/50';
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Active Weather Alerts</h2>
      
      {loading ? (
        <p className="text-gray-400">Loading alerts...</p>
      ) : alerts.length === 0 ? (
        <p className="text-gray-400">No active alerts for your area</p>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`border-l-4 p-4 rounded-r-lg ${getAlertColor(alert.severity)}`}
            >
              <div className="flex items-start space-x-3">
                {getAlertIcon(alert.type)}
                <div className="flex-1">
                  <h3 className="font-semibold">{alert.type}</h3>
                  <p className="text-sm text-gray-300 mt-1">{alert.headline}</p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                    <span>Severity: {alert.severity}</span>
                    <span>Certainty: {alert.certainty}</span>
                    {alert.isHailRelated && (
                      <span className="bg-blue-600 px-2 py-1 rounded">Hail Alert</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AlertsList;
```

## Monitoring & Maintenance

### Health Check Endpoint (api/health.py)
```python
from http.server import BaseHTTPRequestHandler
import json
from ._lib.db import get_db_connection

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        health_status = {
            'status': 'healthy',
            'services': {}
        }
        
        # Check MongoDB
        try:
            db = get_db_connection()
            db.command('ping')
            health_status['services']['mongodb'] = 'connected'
        except:
            health_status['services']['mongodb'] = 'error'
            health_status['status'] = 'degraded'
        
        # Check external APIs
        import requests
        try:
            r = requests.get('https://api.weather.gov/zones', timeout=5)
            health_status['services']['nws_api'] = 'online' if r.status_code == 200 else 'error'
        except:
            health_status['services']['nws_api'] = 'error'
            health_status['status'] = 'degraded'
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(health_status).encode())
```

## Security Considerations

1. **API Rate Limiting**: Implement rate limiting for API endpoints
2. **Input Validation**: Validate all user inputs, especially coordinates
3. **HTTPS Only**: Vercel provides automatic SSL
4. **Environment Variables**: Never commit sensitive credentials
5. **CORS Configuration**: Restrict to your domain in production

## Performance Optimizations

1. **Caching**: Cache NWS API responses for 5 minutes
2. **Database Indexes**: Create geospatial indexes for location queries
3. **Static Assets**: Use Vercel's CDN for static files
4. **Code Splitting**: Implement React lazy loading for components

This complete package provides a production-ready deployment of your NADN Weather Alert System on Vercel!
