"use client";

import { useEffect, useMemo, useState } from "react";
import { CircleMarker, MapContainer, TileLayer, Tooltip } from "react-leaflet";

function MetricTooltip({ marker }) {
  return (
    <div className="min-w-48 rounded-2xl border border-[rgba(2,16,21,0.12)] bg-white px-3 py-2 text-[11px] text-[#0d1c1a] shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
      <p className="mb-2 text-xs font-semibold text-[#07131a]">{marker.name}</p>
      <div className="space-y-0.5 text-[#3d4d4b]">
        <p>Users: {marker.metrics.totalUsers.toLocaleString()}</p>
        <p>Meters: {marker.metrics.totalMeters.toLocaleString()}</p>
        <p>
          Consumption: {marker.metrics.totalConsumption.toLocaleString()} m3
        </p>
        <p>
          New Users (Month): {marker.metrics.newUsersThisMonth.toLocaleString()}
        </p>
      </div>
    </div>
  );
}

export default function WoredaLeafletMap({ center, markers }) {
  const [mounted, setMounted] = useState(false);
  const [activeKey, setActiveKey] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const mapMarkers = useMemo(() => markers || [], [markers]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl">
      {mounted && (
        <MapContainer
          center={center}
          zoom={12}
          scrollWheelZoom
          preferCanvas
          className="h-full w-full"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />

          {mapMarkers.map((marker) => {
            const isActive = activeKey === marker.key;

            return (
              <CircleMarker
                key={marker.key}
                center={marker.point}
                radius={isActive ? 10 : 8}
                eventHandlers={{
                  mouseover: () => setActiveKey(marker.key),
                  mouseout: () => setActiveKey(""),
                }}
                pathOptions={{
                  color: "#ffffff",
                  weight: 1,
                  fillColor: isActive ? "#0072FF" : "#1D9E75",
                  fillOpacity: 0.9,
                }}
              >
                <Tooltip direction="top" offset={[0, -6]} opacity={1}>
                  <MetricTooltip marker={marker} />
                </Tooltip>
              </CircleMarker>
            );
          })}
        </MapContainer>
      )}
    </div>
  );
}
