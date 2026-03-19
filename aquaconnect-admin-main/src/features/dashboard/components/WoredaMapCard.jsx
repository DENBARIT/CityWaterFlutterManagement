"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { superAdminService } from "@/features/super-admin/services/superAdmin.service";

const WoredaLeafletMap = dynamic(
  () => import("@/features/dashboard/components/WoredaLeafletMap"),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full bg-[rgba(2,15,26,0.55)] animate-pulse" />
    ),
  },
);

const BASE_CENTER = [9.03, 38.74];

function hashString(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function deriveWoredaPoint(subcityName, woredaName, index) {
  const centerLat = BASE_CENTER[0];
  const centerLng = BASE_CENTER[1];
  const centerLatRad = (centerLat * Math.PI) / 180;

  const key = `${subcityName || "subcity"}-${woredaName || "woreda"}`;
  const hash = hashString(key);
  const angleDeg = (hash % 360) + index * 19;
  const angleRad = (angleDeg * Math.PI) / 180;

  const radiusKm = 1.2 + (hash % 780) / 140; // 1.2km - 6.8km
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

function monthMatches(dateLike, now) {
  if (!dateLike) return false;
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return false;
  return (
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

function readWoredaIdFromUser(user) {
  return String(user?.woredaId || user?.woreda?.id || user?.woreda?._id || "");
}

function readWoredaIdFromMeter(meter) {
  return String(
    meter?.woredaId ||
      meter?.customer?.woredaId ||
      meter?.customer?.woreda?.id ||
      meter?.customer?.woreda?._id ||
      "",
  );
}

function readWoredaIdFromBill(bill) {
  return String(
    bill?.woredaId ||
      bill?.customer?.woredaId ||
      bill?.customer?.woreda?.id ||
      bill?.customer?.woreda?._id ||
      "",
  );
}

export default function WoredaMapCard({ woredas = [], subcities = [] }) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [meters, setMeters] = useState([]);
  const [bills, setBills] = useState([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let active = true;

    const loadMetrics = async () => {
      setLoading(true);
      setError("");
      try {
        const [usersResult, metersResult, billsResult] =
          await Promise.allSettled([
            superAdminService.getAllUsers(),
            superAdminService.getMeters(),
            superAdminService.getBills(),
          ]);

        if (!active) return;

        setUsers(
          usersResult.status === "fulfilled"
            ? normalizeRows(usersResult.value)
            : [],
        );
        setMeters(
          metersResult.status === "fulfilled"
            ? normalizeRows(metersResult.value)
            : [],
        );
        setBills(
          billsResult.status === "fulfilled"
            ? normalizeRows(billsResult.value)
            : [],
        );

        const allFailed =
          usersResult.status === "rejected" &&
          metersResult.status === "rejected" &&
          billsResult.status === "rejected";

        if (allFailed) {
          const reason =
            usersResult.reason || metersResult.reason || billsResult.reason;
          setError(reason?.message || "Unable to load woreda metrics for map");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadMetrics();
    return () => {
      active = false;
    };
  }, []);

  const subcityNameById = useMemo(() => {
    const byId = new Map();
    for (const subcity of subcities) {
      byId.set(String(subcity?.id || ""), String(subcity?.name || ""));
    }
    return byId;
  }, [subcities]);

  const metricsByWoredaId = useMemo(() => {
    const byId = new Map();
    const now = new Date();

    for (const user of users) {
      const woredaId = readWoredaIdFromUser(user);
      if (!woredaId) continue;
      if (!byId.has(woredaId)) {
        byId.set(woredaId, {
          totalUsers: 0,
          totalMeters: 0,
          totalConsumption: 0,
          newUsersThisMonth: 0,
        });
      }
      const row = byId.get(woredaId);
      row.totalUsers += 1;
      if (monthMatches(user?.createdAt, now)) {
        row.newUsersThisMonth += 1;
      }
    }

    for (const meter of meters) {
      const woredaId = readWoredaIdFromMeter(meter);
      if (!woredaId) continue;
      if (!byId.has(woredaId)) {
        byId.set(woredaId, {
          totalUsers: 0,
          totalMeters: 0,
          totalConsumption: 0,
          newUsersThisMonth: 0,
        });
      }
      byId.get(woredaId).totalMeters += 1;
    }

    for (const bill of bills) {
      const woredaId = readWoredaIdFromBill(bill);
      if (!woredaId) continue;
      if (!byId.has(woredaId)) {
        byId.set(woredaId, {
          totalUsers: 0,
          totalMeters: 0,
          totalConsumption: 0,
          newUsersThisMonth: 0,
        });
      }
      byId.get(woredaId).totalConsumption += Number(bill?.consumption || 0);
    }

    return byId;
  }, [users, meters, bills]);

  const markers = useMemo(() => {
    return woredas.map((woreda, index) => {
      const woredaId = String(woreda?.id || woreda?._id || "");
      const subcityName =
        subcityNameById.get(String(woreda?.subCityId || "")) || "";
      const metrics = metricsByWoredaId.get(woredaId) || {
        totalUsers: 0,
        totalMeters: 0,
        totalConsumption: 0,
        newUsersThisMonth: 0,
      };

      return {
        key: woredaId || `${woreda?.name || "woreda"}-${index}`,
        point: deriveWoredaPoint(subcityName, woreda?.name, index),
        name: woreda?.name || `Woreda ${index + 1}`,
        metrics: {
          totalUsers: Number(metrics.totalUsers || 0),
          totalMeters: Number(metrics.totalMeters || 0),
          totalConsumption: Number(metrics.totalConsumption || 0),
          newUsersThisMonth: Number(metrics.newUsersThisMonth || 0),
        },
      };
    });
  }, [metricsByWoredaId, subcityNameById, woredas]);

  return (
    <div className="mb-4 rounded-xl border border-[rgba(29,158,117,0.12)] bg-[#0e1a1a] p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-base font-semibold text-[#e8f4f0]">Woreda Map</h3>
        <span className="rounded-full bg-[#1D9E75] bg-opacity-20 px-3 py-1 text-xs font-medium text-[#7ce4be]">
          {woredas.length} woreda{woredas.length === 1 ? "" : "s"}
        </span>
      </div>

      <p className="mb-3 text-[11px] text-[rgba(232,244,240,0.55)]">
        Hover a woreda marker to view users, total meters, total consumption,
        and new users this month.
      </p>

      {error && (
        <div className="mb-3 rounded-lg border border-[rgba(226,75,74,0.35)] bg-[rgba(226,75,74,0.08)] px-3 py-2 text-xs text-[#ff9c9b]">
          {error}
        </div>
      )}

      {loading || !mounted ? (
        <div className="h-90 rounded-xl border border-[rgba(29,158,117,0.08)] bg-[rgba(2,15,26,0.55)] animate-pulse" />
      ) : (
        <div className="h-90 overflow-hidden rounded-xl border border-[rgba(29,158,117,0.12)]">
          <WoredaLeafletMap center={BASE_CENTER} markers={markers} />
        </div>
      )}
    </div>
  );
}
