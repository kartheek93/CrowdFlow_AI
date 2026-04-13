import React from 'react';
import { GoogleMap, useJsApiLoader, OverlayView } from '@react-google-maps/api';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "dummy_key_for_submission"; 
// The system will work in "Development purposes only" if the key is invalid, which is perfect for hackathon demos.

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '1rem'
};

export default function MapContainer({ data }: { data: any }) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY
  });

  if (!data || !data.coords) return <div className="p-6 text-app-muted flex items-center justify-center h-full glass-panel">Connecting to Geo-Satellites...</div>;

  const center = {
    lat: data.coords.lat,
    lng: data.coords.lng
  };

  const getMarkerColor = (level: string) => {
    if (level === "High") return "rgba(239, 68, 68, 0.8)";
    if (level === "Medium") return "rgba(245, 158, 11, 0.8)";
    return "rgba(16, 185, 129, 0.8)";
  };

  const locs = Object.keys(data.wait_times);
  const offset = 0.001; 
  const mathPositions: any = {
    0: { lat: center.lat + offset, lng: center.lng },
    1: { lat: center.lat - offset, lng: center.lng },
    2: { lat: center.lat, lng: center.lng + offset },
    3: { lat: center.lat, lng: center.lng - offset },
    4: { lat: center.lat + offset, lng: center.lng + offset },
    5: { lat: center.lat - offset, lng: center.lng - offset }
  };

  return (
    <div className="glass-panel p-2 h-[calc(100vh-140px)] w-full">
      {!isLoaded ? (
        <div className="flex items-center justify-center h-full">Loading Maps API...</div>
      ) : (
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={16}
          options={{
            styles: [
              { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
              { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
              { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
              { featureType: "water", stylers: [{ color: "#17263c" }] }
            ],
            mapTypeControl: false,
            streetViewControl: false
          }}
        >
          {locs.map((locKey, i) => {
            const locData = data.wait_times[locKey];
            const pos = mathPositions[i % 6];
            return (
              <OverlayView
                key={locKey}
                position={pos}
                mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
              >
                <div 
                  className="flex flex-col items-center -translate-x-1/2 -translate-y-1/2"
                >
                   <div 
                     className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold border-2 border-white shadow-xl animate-pulse"
                     style={{backgroundColor: getMarkerColor(locData.level)}}
                   >
                     {locData.time}m
                   </div>
                   <div className="mt-1 bg-slate-900/80 px-2 py-0.5 rounded text-xs font-semibold backdrop-blur whitespace-nowrap">
                     {locKey}
                   </div>
                </div>
              </OverlayView>
            )
          })}
        </GoogleMap>
      )}
    </div>
  );
}
