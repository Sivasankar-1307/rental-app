"use client";

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom icons
const agentIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/854/854866.png', // Delivery van icon
  iconSize: [45, 45],
  iconAnchor: [22, 45],
  popupAnchor: [0, -45],
});

const customerIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png', // Home icon
  iconSize: [35, 35],
  iconAnchor: [17, 35],
  popupAnchor: [0, -35],
});

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function TrackingMap({ 
    agentPos, 
    customerPos, 
    agentName 
}: { 
    agentPos: [number, number], 
    customerPos: [number, number],
    agentName: string
}) {
  return (
    <div style={{ height: '400px', width: '100%', borderRadius: '24px', overflow: 'hidden' }} className="border border-white/10 shadow-2xl">
        <MapContainer center={agentPos} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={agentPos} icon={agentIcon}>
            <Popup>
            <div className="text-center font-bold">
                <p style={{ color: "#6366f1" }}>{agentName}</p>
                <p className="text-xs">Out for Delivery</p>
            </div>
            </Popup>
        </Marker>
        <Marker position={customerPos} icon={customerIcon}>
            <Popup>
                <p className="font-bold">Delivery Location</p>
            </Popup>
        </Marker>
        <MapUpdater center={agentPos} />
        </MapContainer>
    </div>
  );
}
