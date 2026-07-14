"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapPicker.css';

// Fix for default marker icon in Leaflet + Next.js
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface MapSectionProps {
  onAddressSelect: (address: any) => void;
  selectedZoneId: string;
  onZoneValidate: (isValid: boolean, zoneId: string) => void;
}

const CHENNAI_CENTER: [number, number] = [13.0827, 80.2707];

const ZONES = [
  { id: "zone-1", name: "Central Chennai", radius: 5000, color: "#4F46E5" },
  { id: "zone-2", name: "Greater Chennai", radius: 20000, color: "#10B981" },
  { id: "zone-3", name: "Outskirts", radius: 50000, color: "#F59E0B" },
];

function LocationMarker({ position, setPosition, setAddress, onMarkerMove }: any) {
  const map = useMap();

  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      onMarkerMove(lat, lng);
    },
  });

  useEffect(() => {
    if (position) {
      map.flyTo(position, map.getZoom());
    }
  }, [position, map]);

  return position === null ? null : (
    <Marker 
      position={position} 
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target;
          const { lat, lng } = marker.getLatLng();
          setPosition([lat, lng]);
          onMarkerMove(lat, lng);
        }
      }}
    />
  );
}

const MapSection: React.FC<MapSectionProps> = ({ onAddressSelect, selectedZoneId, onZoneValidate }) => {
  const [position, setPosition] = useState<[number, number]>(CHENNAI_CENTER);
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);

  const selectedZone = useMemo(() => ZONES.find(z => z.id === selectedZoneId), [selectedZoneId]);

  const validateZone = useCallback((lat: number, lng: number) => {
    if (!selectedZone) return;
    
    // Distance calculation using Haversine formula (or simplified for small distances)
    const R = 6371e3; // metres
    const φ1 = CHENNAI_CENTER[0] * Math.PI/180;
    const φ2 = lat * Math.PI/180;
    const Δφ = (lat-CHENNAI_CENTER[0]) * Math.PI/180;
    const Δλ = (lng-CHENNAI_CENTER[1]) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distanceSize = R * c;

    const isValid = distanceSize <= selectedZone.radius;
    onZoneValidate(isValid, selectedZoneId);
  }, [selectedZone, onZoneValidate]);

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=en`);
      const data = await response.json();

      if (data && data.display_name) {
        const addrStr = data.display_name;
        setAddress(addrStr);
        
        // Extract components for our structure
        const addr = data.address || {};
        onAddressSelect({
          street: addrStr,
          city: addr.city || addr.town || addr.village || addr.suburb || "",
          state: addr.state || "",
          zipcode: addr.postcode || "",
          country: addr.country || "India",
          lat: lat,
          lng: lng
        });
        validateZone(lat, lng);
      }
    } catch (error) {
      console.error("Geocoding error:", error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&accept-language=en`);
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const newLat = parseFloat(lat);
        const newLon = parseFloat(lon);
        setPosition([newLat, newLon]);
        setAddress(display_name);
        
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${newLat}&lon=${newLon}&accept-language=en`);
        const revData = await res.json();

        const addr = revData.address || {};

        onAddressSelect({
          street: display_name,
          city: addr.city || addr.town || addr.village || addr.suburb || "",
          state: addr.state || "",
          zipcode: addr.postcode || "",
          country: addr.country || "India",
          lat: newLat,
          lng: newLon
        });
        validateZone(newLat, newLon);
      } else {
        alert("Location not found.");
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setSearching(false);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition([latitude, longitude]);
        reverseGeocode(latitude, longitude);
        setLoading(false);
      },
      () => setLoading(false),
      { enableHighAccuracy: true }
    );
  };

  // Removed auto-detection on mount as per user request
  // Location is now only detected when the "Use GPS" button is clicked.

  return (
    <div className="map-picker-container dark:bg-slate-900 dark:border-white/5">
      <div className="map-search-info">
        <div className="map-search-bar">
          <input 
            className="dark:bg-slate-800 dark:text-white dark:border-white/10"
            type="text" 
            placeholder="Search for your delivery address..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSearch();
              }
            }}
            disabled={searching}
          />
          <button type="button" onClick={handleSearch} disabled={searching} className="bg-primary hover:bg-primary/80">
            {searching ? "..." : "🔍"}
          </button>
        </div>

        <div className="address-and-gps">
          <p className="selected-address dark:bg-primary/5 dark:text-gray-300 dark:border-primary">
            {loading ? "Detecting location..." : (address || "Select your location on the map...")}
          </p>
          <button type="button" className="gps-btn bg-primary" onClick={getCurrentLocation} title="Use GPS" disabled={loading}>
            {loading ? "⌛" : "🎯"}
          </button>
        </div>
      </div>
      
      <div className="map-wrapper border-2 border-white/5 rounded-2xl overflow-hidden shadow-inner">
        <MapContainer center={position} zoom={13} style={{ height: '300px', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker 
            position={position} 
            setPosition={setPosition} 
            setAddress={setAddress} 
            onMarkerMove={(lat: number, lng: number) => reverseGeocode(lat, lng)}
          />
          {selectedZone && (
            <Circle
              center={CHENNAI_CENTER}
              radius={selectedZone.radius}
              pathOptions={{
                fillColor: selectedZone.color,
                fillOpacity: 0.1,
                color: selectedZone.color,
                weight: 2,
                opacity: 0.5
              }}
            />
          )}
        </MapContainer>
      </div>
    </div>
  );
};

export default MapSection;
