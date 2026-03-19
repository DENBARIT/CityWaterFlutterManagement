"use client";

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
      </div>
    </div>
  );
}

export default function SubcityLeafletMap({ center, markers }) {
  return (
    <MapContainer
      center={center}
      zoom={11}
      scrollWheelZoom
      className="h-full w-full"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />

      {markers.map((marker) => (
        <CircleMarker
          key={marker.key}
          center={marker.point}
          radius={9}
          pathOptions={{
            color: "#b9ffe6",
            weight: 1,
            fillColor: "#1D9E75",
            fillOpacity: 0.8,
          }}
        >
          <Tooltip direction="top" offset={[0, -6]} opacity={1}>
            <MetricTooltip marker={marker} />
          </Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
