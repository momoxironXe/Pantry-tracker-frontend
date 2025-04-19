"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    google: any;
  }
}

interface GoogleMapProps {
  zipCode: string;
  height?: string;
  width?: string;
}

export default function GoogleMap({
  zipCode,
  height = "300px",
  width = "100%",
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load Google Maps API script
    const loadGoogleMapsAPI = () => {
      const googleMapsScript = document.createElement("script");
      googleMapsScript.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
      googleMapsScript.async = true;
      googleMapsScript.defer = true;
      googleMapsScript.id = "google-maps-script";
      googleMapsScript.onload = initializeMap;
      googleMapsScript.onerror = () =>
        setError("Failed to load Google Maps API");
      document.head.appendChild(googleMapsScript);
    };

    // Initialize map once API is loaded
    const initializeMap = () => {
      if (!mapRef.current) return;

      // Use Geocoding API to convert ZIP code to coordinates
      const geocoder = new (window as any).google.maps.Geocoder();
      geocoder.geocode({ address: zipCode }, (results, status) => {
        if (status === "OK" && results && results[0]) {
          const location = results[0].geometry.location;
          const map = new (window as any).google.maps.Map(mapRef.current, {
            center: location,
            zoom: 13,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
          });

          // Add a marker for the ZIP code location
          new (window as any).google.maps.Marker({
            position: location,
            map,
            title: `ZIP Code: ${zipCode}`,
          });

          setIsLoading(false);
        } else {
          setError(`Could not find location for ZIP code: ${zipCode}`);
          setIsLoading(false);
        }
      });
    };

    // Check if Google Maps API is already loaded
    if (window.google && window.google.maps) {
      initializeMap();
    } else {
      // If not loaded, check if script is already being loaded
      const existingScript = document.getElementById("google-maps-script");
      if (!existingScript) {
        loadGoogleMapsAPI();
      } else {
        existingScript.addEventListener("load", initializeMap);
      }
    }

    return () => {
      const existingScript = document.getElementById("google-maps-script");
      if (existingScript) {
        existingScript.removeEventListener("load", initializeMap);
      }
    };
  }, [zipCode]);

  if (error) {
    return (
      <div
        style={{ height, width }}
        className="flex items-center justify-center bg-gray-100 rounded-lg border border-gray-200"
      >
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div
      style={{ height, width }}
      className="relative rounded-lg overflow-hidden border border-gray-200"
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 z-10">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent"></div>
        </div>
      )}
      <div ref={mapRef} style={{ height: "100%", width: "100%" }} />
    </div>
  );
}
