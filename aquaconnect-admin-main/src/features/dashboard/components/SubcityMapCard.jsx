"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { apiRequest } from "@/services/apiClient";
import { superAdminService } from "@/features/super-admin/services/superAdmin.service";

const SubcityLeafletMap = dynamic(
  () => import("@/features/dashboard/components/SubcityLeafletMap"),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full bg-[rgba(2,15,26,0.55)] animate-pulse" />
    ),
  },
);

const BASE_CENTER = [9.03, 38.74]; // Addis Ababa center

function hashString(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function deriveSubcityPoint(name, index) {
  const centerLat = BASE_CENTER[0];
  const centerLng = BASE_CENTER[1];
  const centerLatRad = (centerLat * Math.PI) / 180;

  const hash = hashString(String(name || "subcity"));
  const angleDeg = (hash % 360) + index * 29;
  const angleRad = (angleDeg * Math.PI) / 180;

  // Spread points around city center in a stable way.
  const radiusKm = 2 + (hash % 900) / 100; // 2km - 11km
  const latOffset = (radiusKm / 111) * Math.cos(angleRad);
  const lngOffset =
    (radiusKm / (111 * Math.max(0.2, Math.cos(centerLatRad)))) *
    Math.sin(angleRad);

  return [centerLat + latOffset, centerLng + lngOffset];
}

function normalizeRows(result) {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.data)) return result.data;
  return [];
}

function readSubcityIdFromUser(user) {
  return String(
    user?.subCityId || user?.subCity?.id || user?.subCity?._id || "",
  );
}

function readSubcityIdFromMeter(meter) {
  return String(
    meter?.subCityId ||
      meter?.subCity?.id ||
      meter?.subCity?._id ||
      meter?.customer?.subCityId ||
      meter?.customer?.subCity?.id ||
      meter?.customer?.subCity?._id ||
      "",
  );
}

function readSubcityIdFromBill(bill) {
  return String(
    bill?.subCityId ||
      bill?.subCity?.id ||
      bill?.subCity?._id ||
      bill?.customer?.subCityId ||
      bill?.customer?.subCity?.id ||
      bill?.customer?.subCity?._id ||
      "",
  );
}

export default function SubcityMapCard({ subcityCount }) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [subcities, setSubcities] = useState([]);
  const [users, setUsers] = useState([]);
  const [meters, setMeters] = useState([]);
  const [bills, setBills] = useState([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let active = true;

    const loadSubcities = async () => {
      setLoading(true);
      setError("");
      try {
        const [subcitiesResult, usersResult, metersResult, billsResult] =
          await Promise.allSettled([
            apiRequest("/super-admin/subcities/active", { useAuth: true }),
            superAdminService.getAllUsers(),
            superAdminService.getMeters(),
            superAdminService.getBills(),
          ]);

        if (!active) return;

        const subcityRows =
          subcitiesResult.status === "fulfilled"
            ? normalizeRows(subcitiesResult.value)
            : [];
        const userRows =
          usersResult.status === "fulfilled"
            ? normalizeRows(usersResult.value)
            : [];
        const meterRows =
          metersResult.status === "fulfilled"
            ? normalizeRows(metersResult.value)
            : [];
        const billRows =
          billsResult.status === "fulfilled"
            ? normalizeRows(billsResult.value)
            : [];

        setSubcities(subcityRows);
        setUsers(userRows);
        setMeters(meterRows);
        setBills(billRows);

        const allFailed =
          subcitiesResult.status === "rejected" &&
          usersResult.status === "rejected" &&
          metersResult.status === "rejected" &&
          billsResult.status === "rejected";

        if (allFailed) {
          const reason =
            subcitiesResult.reason ||
            usersResult.reason ||
            metersResult.reason ||
            billsResult.reason;
          setError(
            reason?.message || "Unable to load subcity metrics for the map",
          );
        }
      } catch (err) {
        if (!active) return;
        setError(err?.message || "Unable to load subcities for the map");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    void loadSubcities();
    return () => {
      active = false;
    };
  }, []);

  const metricsBySubcityId = useMemo(() => {
    const byId = new Map();

    for (const user of users) {
      const subcityId = readSubcityIdFromUser(user);
      if (!subcityId) continue;
      if (!byId.has(subcityId)) {
        byId.set(subcityId, {
          totalUsers: 0,
          totalMeters: 0,
          totalConsumption: 0,
        });
      }
      byId.get(subcityId).totalUsers += 1;
    }

    for (const meter of meters) {
      const subcityId = readSubcityIdFromMeter(meter);
      if (!subcityId) continue;
      if (!byId.has(subcityId)) {
        byId.set(subcityId, {
          totalUsers: 0,
          totalMeters: 0,
          totalConsumption: 0,
        });
      }
      byId.get(subcityId).totalMeters += 1;
    }

    for (const bill of bills) {
      const subcityId = readSubcityIdFromBill(bill);
      if (!subcityId) continue;
      if (!byId.has(subcityId)) {
        byId.set(subcityId, {
          totalUsers: 0,
          totalMeters: 0,
          totalConsumption: 0,
        });
      }
      byId.get(subcityId).totalConsumption += Number(bill?.consumption || 0);
    }

    return byId;
  }, [users, meters, bills]);

  // Prepare markers for the map
  const markers = useMemo(() => {
    return (subcities || []).map((subcity, idx) => ({
      key: subcity.id || subcity._id || subcity.name || idx,
      point: deriveSubcityPoint(subcity.name, idx),
      name: subcity.name,
      metrics: {
        totalUsers: Number(
          metricsBySubcityId.get(String(subcity.id || subcity._id || ""))
            ?.totalUsers || 0,
        ),
        totalMeters: Number(
          metricsBySubcityId.get(String(subcity.id || subcity._id || ""))
            ?.totalMeters || 0,
        ),
        totalConsumption: Number(
          metricsBySubcityId.get(String(subcity.id || subcity._id || ""))
            ?.totalConsumption || 0,
        ),
      },
    }));
  }, [metricsBySubcityId, subcities]);

  return (
    <div className="rounded-xl border border-[rgba(29,158,117,0.12)] bg-[#0e1a1a] p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-semibold text-[#e8f4f0]">Subcity Map</h3>
        {typeof subcityCount === "number" && (
          <span className="rounded-full bg-[#1D9E75] bg-opacity-20 px-3 py-1 text-xs font-medium text-[#7ce4be]">
            {subcityCount} subcit{subcityCount === 1 ? "y" : "ies"}
          </span>
        )}
      </div>

      {error && (
        <div className="mb-3 rounded-lg border border-[rgba(226,75,74,0.35)] bg-[rgba(226,75,74,0.08)] px-3 py-2 text-xs text-[#ff9c9b]">
          {error}
        </div>
      )}

      {loading || !mounted ? (
        <div className="h-90 rounded-xl border border-[rgba(29,158,117,0.08)] bg-[rgba(2,15,26,0.55)] animate-pulse" />
      ) : (
        <div className="h-90 rounded-xl overflow-hidden border border-[rgba(29,158,117,0.12)]">
          <SubcityLeafletMap center={BASE_CENTER} markers={markers} />
        </div>
      )}

      <p className="mt-3 text-[10px] text-[rgba(232,244,240,0.35)]">
        Marker positions are generated from subcity names for consistent visual
        placement.
      </p>
    </div>
  );
}
