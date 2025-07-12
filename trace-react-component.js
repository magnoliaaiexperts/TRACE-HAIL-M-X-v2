import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AlertTriangle, Phone, MessageSquare, Mail, Cloud, Thermometer, Droplets, Wind, Zap, Compass, Sun, Cloudy, CloudRain, CloudSun, Share2, Settings, Bot, LogOut, MapPin, Bell, Shield, Activity, CheckCircle, XCircle } from 'lucide-react';

// --- Core Components ---

// SEO-Optimized Logo Component
const TraceLogo = () => (
  <div className="flex items-center space-x-2" aria-label="T.R.A.C.E. System Logo">
    <Zap className="w-7 h-7 text-blue-400" />
    <span className="text-2xl font-bold text-gray-100 tracking-wider">
      T.R.A.C.E.
    </span>
  </div>
);

// Interactive Weather Map Component
const WeatherMap = ({ location }) => (
  <div className="bg-gray-800 rounded-lg shadow-lg p-1 h-[350px] md:h-[400px] lg:h-[450px]">
    <iframe
      key={location ? `${location.lat}-${location.lon}` : 'default'}
      title="Live Weather Map"
      className="w-full h-full rounded-md"
      src={`https://embed.windy.com/embed.html?type=map&location=coordinates&lat=${location?.lat || 30.224}&lon=${location?.lon || -92.019}&zoom=8&level=surface&overlay=radar&product=radar&menu=&message=true&marker=&calendar=now&pressure=&type=map&location=coordinates&metricWind=mph&metricTemp=%C2%B0F&radarRange=-1`}
      frameBorder="0"
    ></iframe>
  </div>
);

// Weather Icon Helper
const getWeatherIcon = (description) => {
  if (!description) return <Cloudy className="w-12 h-12 md:w-16 md:h-16" />;
  const desc = description.toLowerCase();
  if (desc.includes('rain') || desc.includes('shower')) return <CloudRain className="w-12 h-12 md:w-16 md:h-16 text-blue-300" />;
  if (desc.includes('sunny') || desc.includes('clear')) return <Sun className="w-12 h-12 md:w-16 md:h-16 text-yellow-300" />;
  if (desc.includes('partly cloudy')) return <CloudSun className="w-12 h-12 md:w-16 md:h-16 text-gray-300" />;
  if (desc.includes('cloudy') || desc.includes('overcast')) return <Cloudy className="w-12 h-12 md:w-16 md:h-16 text-gray-400" />;
  return <Cloud className="w-12 h-12 md:w-16 md:h-16" />;
};

// Current Weather Display Component
const CurrentWeatherDisplay = ({ weather, locationName }) => {
  if (!weather) return <div className="bg-gray-800 rounded-lg shadow-lg p-6 flex justify-center items-center h-full"><p className="text-gray-400">Loading current conditions...</p></div>;
  const { temp, app_temp, wind_spd, wind_cdir, precip, rh, description } = weather;
  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-4 md:p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-100">Current Conditions - {locationName || 'Loading...'}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-gray-300">
        <div className="flex flex-col items-center justify-center bg-gray-700/50 p-3 rounded-lg col-span-2 sm:col-span-1">
          {getWeatherIcon(description)}
          <p className="text-base md:text-lg font-bold text-center text-gray-100 mt-2">{description}</p>
        </div>
        <div className="flex flex-col items-center justify-center bg-gray-700/50 p-3 rounded-lg">
          <Thermometer className="w-6 h-6 md:w-8 md:h-8 mb-2 text-red-400" />
          <span className="text-4xl md:text-5xl font-bold text-blue-300">{temp}°F</span>
          <p className="text-xs md:text-sm">Feels like {app_temp}°F</p>
        </div>
        <div className="flex flex-col items-center justify-center bg-gray-700/50 p-3 rounded-lg">
          <Compass className="w-6 h-6 md:w-8 md:h-8 mb-2 text-cyan-400" />
          <p className="text-xl md:text-2xl font-bold">{wind_spd} mph</p>
          <p className="text-sm">{wind_cdir}</p>
        </div>
        <div className="flex flex-col items-center justify-center bg-gray-700/50 p-3 rounded-lg">
          <Droplets className="w-6 h-6 md:w-8 md:h-8 mb-2 text-blue-400" />
          <p className="text-xl md:text-2xl font-bold">{precip.toFixed(2)}"</p>
          <p className="text-sm">Precip / hr</p>
        </div>
        <div className="flex flex-col items-center justify-center bg-gray-700/50 p-3 rounded-lg col-span-2 sm:col-span-2">
          <Droplets className="w-6 h-6 md:w-8 md:h-8 mb-2 text-cyan-300" />
          <p className="text-3xl md:text-4xl font-bold">{rh}%</p>
          <p className="text-sm">Humidity</p>
        </div>
      </div>
    </div>
  );
};

// Location Setup Component
const LocationSetup = ({ onLocationSet }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [manualLoading, setManualLoading] = useState(false);
  const [error, setError] = useState('');
  const [manualLocation, setManualLocation] = useState('');

  const handleLocationClick = () => {
    setIsLoading(true);
    setError('');
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser. Please enter your location manually.");
      setIsLoading(false);
      return;
    }
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
      setError("Could not get location in time. Please try again or enter it manually.");
    }, 10000);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timeoutId);
        const { latitude, longitude } = position.coords;
        onLocationSet({ lat: latitude, lon: longitude });
      },
      (err) => {
        clearTimeout(timeoutId);
        setIsLoading(false);
        setError("Location access denied. Please enable it in browser settings or enter manually.");
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  const handleManualSearch = async (e) => {
    e.preventDefault();
    if (!manualLocation) {
      setError("Please enter a city, state, or zip code.");
      return;
    }
    setManualLoading(true);
    setError('');
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(manualLocation)}&format=json&limit=1`);
      if (!response.ok) throw new Error("Geocoding service failed.");
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        onLocationSet({ lat: parseFloat(lat), lon: parseFloat(lon) });
      } else {
        setError("Could not find that location. Please try again.");
        setManualLoading(false);
      }
    } catch (e) {
      setError("Failed to fetch location data. Please check your connection.");
      setManualLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-90 flex justify-center items-center z-50 p-4">
      <div className="bg-gray-800 p-8 rounded-lg shadow-2xl text-center w-full max-w-md">
        <div className="mb-6">
          <Shield className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Welcome to T.R.A.C.E.</h2>
          <p className="text-gray-400">Trust-based Rapid Alert Communication Engine</p>
        </div>
        <p className="mb-6 text-gray-300">To provide personalized weather alerts, please share your location.</p>
        <button 
          onClick={handleLocationClick} 
          className="w-full p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md disabled:bg-blue-800 disabled:cursor-not-allowed flex justify-center items-center" 
          disabled={isLoading}
        >
          <MapPin className="w-5 h-5 mr-2" />
          {isLoading ? 'Getting Location...' : 'Use My Current Location'}
        </button>
        <div className="my-6 flex items-center">
          <div className="flex-grow border-t border-gray-600"></div>
          <span className="flex-shrink mx-4 text-gray-500">OR</span>
          <div className="flex-grow border-t border-gray-600"></div>
        </div>
        <form onSubmit={handleManualSearch}>
          <p className="mb-2 text-gray-400">Enter your location manually:</p>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={manualLocation} 
              onChange={(e) => setManualLocation(e.target.value)} 
              placeholder="e.g., Lafayette, LA or 70501" 
              className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" 
            />
            <button 
              type="submit" 
              className="p-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors shadow-md disabled:bg-gray-700 disabled:cursor-not-allowed" 
              disabled={manualLoading}
            >
              {manualLoading ? '...' : 'Search'}
            </button>
          </div>
        </form>
        {error && <p className="text-red-400 mt-4 text-sm">{error}</p>}
      </div>
    </div>
  );
};

// Main Application Component
const App = () => {
  // Application state
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [currentWeather, setCurrentWeather] = useState(null);
  const [systemStatus, setSystemStatus] = useState({ nws: 'online', twilio: 'online', database: 'online', alerts: 'online' });
  const [selectedAgent, setSelectedAgent] = useState('HAIL-M');
  const [communicationLogs, setCommunicationLogs] = useState([]);
  const processedAlerts = useRef(new Set());
  
  const [location, setLocation] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [isLocationSet, setIsLocationSet] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [notificationSettings, setNotificationSettings] = useState({
    'Tornado Warning': true,
    'Severe Thunderstorm Warning': true,
    'Flash Flood Warning': true,
    'Hurricane Warning': true,
  });

  // Check for saved location on mount
  useEffect(() => {
    const savedLocation = localStorage.getItem('traceUserLocation');
    if (savedLocation) {
      const loc = JSON.parse(savedLocation);
      setLocation(loc);
      setIsLocationSet(true);
    }
  }, []);

  // Handle location setting
  const handleLocationSet = (loc) => {
    setLocation(loc);
    setIsLocationSet(true);
    localStorage.setItem('traceUserLocation', JSON.stringify(loc));
  };

  // Trigger alert handler
  const handleTriggerAlert = useCallback((alertType, agent = selectedAgent) => {
    const uniqueId = `${Date.now()}-${Math.random()}`;
    const newLog = { 
      id: uniqueId, 
      agent: agent, 
      action: alertType, 
      timestamp: new Date().toLocaleTimeString(), 
      status: 'Processing' 
    };
    setCommunicationLogs(prev => [newLog, ...prev.slice(0, 19)]);
    
    // Simulate sending notification
    setTimeout(() => {
      setCommunicationLogs(prev => 
        prev.map(log => log.id === uniqueId ? { ...log, status: 'Sent' } : log)
      );
    }, 1500);
  }, [selectedAgent]);

  // Auto-trigger alerts based on settings
  useEffect(() => {
    activeAlerts.forEach(alert => {
      if (notificationSettings[alert.type] && !processedAlerts.current.has(alert.id)) {
        let agent = 'HAIL-M';
        if (alert.type.includes('Tornado')) agent = 'TORNADO-M';
        if (alert.type.includes('Flood')) agent = 'FLOOD-M';
        handleTriggerAlert(`Auto-SMS: ${alert.type}`, agent);
        processedAlerts.current.add(alert.id);
      }
    });
  }, [activeAlerts, notificationSettings, handleTriggerAlert]);

  // Fetch weather data
  const fetchAllData = useCallback(async (loc) => {
    if (!loc) return;
    setErrorMessage('');
    setIsLoading(true);
    
    try {
      // For Vercel deployment, use the API routes
      const baseUrl = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000';
      
      // Fetch weather data
      const weatherRes = await fetch(`${baseUrl}/api/weather?lat=${loc.lat}&lon=${loc.lon}`);
      if (!weatherRes.ok) throw new Error('Weather service unavailable');
      const weatherData = await weatherRes.json();
      
      setLocationName(weatherData.location ? 
        `${weatherData.location.city}, ${weatherData.location.state}` : 
        'Unknown Location'
      );
      
      // Format weather data
      if (weatherData.current) {
        const curr = weatherData.current;
        setCurrentWeather({
          temp: curr.temperature !== null ? Math.round(curr.temperature * 9/5 + 32) : 'N/A',
          app_temp: curr.temperature !== null ? Math.round(curr.temperature * 9/5 + 32) : 'N/A',
          wind_spd: curr.windSpeed !== null ? Math.round(curr.windSpeed * 2.237) : 0,
          wind_cdir: curr.windDirection ? getCardinalDirection(curr.windDirection) : 'N/A',
          precip: 0,
          rh: curr.humidity || 50,
          description: curr.description || 'No data'
        });
      }

      // Fetch alerts
      const alertsRes = await fetch(`${baseUrl}/api/alerts?lat=${loc.lat}&lon=${loc.lon}`);
      if (!alertsRes.ok) throw new Error('Alert service unavailable');
      const alertsData = await alertsRes.json();
      
      setActiveAlerts(alertsData.alerts || []);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setErrorMessage('Unable to load weather data. Please check your connection.');
      
      // Set mock data for demo purposes
      setCurrentWeather({
        temp: 75,
        app_temp: 78,
        wind_spd: 12,
        wind_cdir: 'NW',
        precip: 0.05,
        rh: 65,
        description: 'Partly Cloudy'
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Helper function for wind direction
  const getCardinalDirection = (degrees) => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 
                       'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    return directions[Math.round((degrees % 360) / 22.5)];
  };

  // Fetch data when location changes
  useEffect(() => {
    if (location) {
      fetchAllData(location);
      const interval = setInterval(() => fetchAllData(location), 300000); // 5 minutes
      return () => clearInterval(interval);
    }
  }, [location, fetchAllData]);

  // Handle alert sharing
  const handleShare = (alert) => {
    const shareText = `Weather Alert: ${alert.type} in ${alert.location || locationName}. Severity: ${alert.severity}. Stay safe! - via T.R.A.C.E.`;
    navigator.clipboard.writeText(shareText).then(() => {
      handleTriggerAlert(`Shared Alert: ${alert.type}`, 'User Action');
    });
  };

  // Sign out handler
  const handleSignOut = () => {
    localStorage.removeItem('traceUserLocation');
    setLocation(null);
    setIsLocationSet(false);
  };

  // Agent profiles configuration
  const agentProfiles = {
    'HAIL-M': { 
      name: 'HAIL-M', 
      icon: <Cloud className="w-5 h-5" />, 
      color: 'bg-blue-600', 
      description: 'Hail damage assessment', 
      channels: ['SMS', 'Voice', 'Email'] 
    },
    'TORNADO-M': { 
      name: 'TORNADO-M', 
      icon: <Wind className="w-5 h-5" />, 
      color: 'bg-red-600', 
      description: 'Emergency tornado alerts', 
      channels: ['SMS', 'Emergency Calls'] 
    },
    'FLOOD-M': { 
      name: 'FLOOD-M', 
      icon: <Droplets className="w-5 h-5" />, 
      color: 'bg-cyan-600', 
      description: 'Flood warnings & recovery', 
      channels: ['WhatsApp', 'Email'] 
    },
    'HEAT-M': { 
      name: 'HEAT-M', 
      icon: <Thermometer className="w-5 h-5" />, 
      color: 'bg-orange-600', 
      description: 'Extreme heat wellness checks', 
      channels: ['Voice', 'Mobile App'] 
    }
  };

  if (!isLocationSet) {
    return <LocationSetup onLocationSet={handleLocationSet} />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 p-2 sm:p-4 md:p-6 font-sans">
      <div className="max-w-8xl mx-auto">
        <header className="bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-lg p-4 mb-6 flex justify-between items-center">
          <TraceLogo />
          {errorMessage && <div className="text-red-400 text-sm text-center flex-1 mx-4">{errorMessage}</div>}
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-4">
              {Object.entries(systemStatus).map(([service, status]) => (
                <div key={service} className="flex items-center space-x-2" title={`${service} is ${status}`}>
                  <div className={`w-3 h-3 rounded-full ${status === 'online' ? 'bg-green-400' : 'bg-red-500'}`}></div>
                  <span className="text-sm font-medium capitalize hidden lg:block">{service}</span>
                </div>
              ))}
            </div>
            <button 
              onClick={handleSignOut} 
              className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-2 px-3 rounded-lg transition-colors" 
              title="Log Out"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Log Out</span>
            </button>
          </div>
        </header>

        <main className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-1/3 flex-shrink-0 space-y-6">
            <section className="bg-gray-800 rounded-lg shadow-lg p-4 md:p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-100">Alert Profiles</h2>
              <div className="space-y-3">
                {Object.entries(agentProfiles).map(([key, agent]) => (
                  <div 
                    key={key} 
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedAgent === key ? 'border-blue-500 bg-gray-700/50' : 'border-gray-700 hover:border-gray-600'
                    }`} 
                    onClick={() => setSelectedAgent(key)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${agent.color} text-white`}>
                        {agent.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-100">{agent.name}</h3>
                        <p className="text-sm text-gray-400 mb-2">{agent.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {agent.channels.map((channel) => (
                            <span key={channel} className="px-2 py-1 bg-gray-600 text-gray-200 text-xs rounded-full">
                              {channel}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            
            <section className="bg-gray-800 rounded-lg shadow-lg p-4 md:p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-100">Notification Preferences</h2>
              <div className="space-y-3">
                {Object.entries(notificationSettings).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-gray-300">{key}</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={value} 
                        onChange={() => setNotificationSettings(prev => ({...prev, [key]: !prev[key]}))} 
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="w-full lg:w-2/3 space-y-6">
            <CurrentWeatherDisplay weather={currentWeather} locationName={locationName} />
            <WeatherMap location={location} />
            <section className="bg-gray-800 rounded-lg shadow-lg p-4 md:p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-100">Active Weather Alerts</h2>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Activity className="w-6 h-6 animate-spin text-blue-400 mr-2" />
                    <p className="text-gray-400">Loading alerts...</p>
                  </div>
                ) : activeAlerts.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No active alerts for your area.</p>
                ) : (
                  activeAlerts.map((alert) => (
                    <div 
                      key={alert.id} 
                      className={`border-l-4 p-4 rounded-r-lg ${
                        alert.type.includes('Tornado') ? 'border-red-500 bg-red-900/50 text-red-200' : 
                        alert.type.includes('Flood') ? 'border-cyan-500 bg-cyan-900/50 text-cyan-200' :
                        'border-yellow-500 bg-yellow-900/50 text-yellow-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {alert.type.includes('Tornado') ? <Wind className="w-5 h-5" /> : 
                           alert.type.includes('Flood') ? <Droplets className="w-5 h-5" /> : 
                           <Zap className="w-5 h-5" />}
                          <div>
                            <p className="font-semibold text-gray-100 capitalize">{alert.type}</p>
                            <p className="text-sm text-gray-300">
                              {alert.headline || `Severity: ${alert.severity || 'Unknown'}`}
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleShare(alert)} 
                          className="flex items-center space-x-2 px-3 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-500 transition-colors"
                        >
                          <Share2 size={16}/>
                          <span>Share</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </main>

        <footer className="mt-6">
          <section className="bg-gray-800 rounded-lg shadow-lg p-4 md:p-6">
            <h3 className="text-xl font-semibold mb-3 text-gray-100">Communication Log</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
              {communicationLogs.length === 0 ? (
                <p className="text-gray-400 text-center py-4">No recent communications</p>
              ) : (
                communicationLogs.map((log) => (
                  <div key={log.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-blue-400">{log.agent}</span>
                      <span className="text-sm text-gray-300 flex items-center gap-2">
                        {log.action.includes('Auto') ? <Bot size={16} className="text-yellow-400"/> : ''}
                        {log.action.includes('Share') ? <Share2 size={16}/> : ''}
                        {log.action}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 mt-2 sm:mt-0">
                      <span className="text-xs text-gray-400">{log.timestamp}</span>
                      <span className={`px-3 py-1 text-xs rounded-full font-semibold ${
                        log.status === 'Processing' ? 'bg-yellow-400/20 text-yellow-300' : 'bg-green-400/20 text-green-300'
                      }`}>
                        {log.status === 'Processing' ? <Activity className="inline w-3 h-3 mr-1" /> : <CheckCircle className="inline w-3 h-3 mr-1" />}
                        {log.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </footer>
      </div>
    </div>
  );
};

export default App;
        