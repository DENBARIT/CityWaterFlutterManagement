"use client";

import { useEffect, useMemo, useState } from "react";
import { superAdminService } from "@/features/super-admin/services/superAdmin.service";

export default function DashboardReadingsPage() {
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [windowStatus, setWindowStatus] = useState(null);
  const [windowHistory, setWindowHistory] = useState([]);
  const [scheduleForm, setScheduleForm] = useState({
    startDate: "",
    closeDate: "",
  });
  const [openingWindow, setOpeningWindow] = useState(false);
  const [expiringWindow, setExpiringWindow] = useState(false);
  const [scheduleMessage, setScheduleMessage] = useState("");

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      setLoading(true);
      setLoadError("");
      try {
        const [rows, status, history] = await Promise.all([
          superAdminService.getReadings(),
          superAdminService.getOcrWindowStatus(),
          superAdminService.getOcrWindowHistory(12),
        ]);
        if (!active) return;
        setReadings(Array.isArray(rows) ? rows : []);
        setWindowStatus(status || null);
        setWindowHistory(Array.isArray(history) ? history : []);
      } catch (error) {
        if (!active) return;
        setLoadError(
          error?.message ||
            "Unable to load readings right now. Please refresh and try again.",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadData();
    return () => {
      active = false;
    };
  }, []);

  const refreshWindowStatus = async () => {
    const [status, history] = await Promise.all([
      superAdminService.getOcrWindowStatus(),
      superAdminService.getOcrWindowHistory(12),
    ]);
    setWindowStatus(status || null);
    setWindowHistory(Array.isArray(history) ? history : []);
  };

  const handleOpenOcrWindow = async (event) => {
    event.preventDefault();
    setScheduleMessage("");

    if (!scheduleForm.startDate || !scheduleForm.closeDate) {
      setScheduleMessage("Please select both start date and close date.");
      return;
    }

    const start = new Date(`${scheduleForm.startDate}T00:00:00`);
    const close = new Date(`${scheduleForm.closeDate}T23:59:59`);

    if (Number.isNaN(start.getTime()) || Number.isNaN(close.getTime())) {
      setScheduleMessage("Invalid schedule dates.");
      return;
    }

    if (close <= start) {
      setScheduleMessage("Close date must be after start date.");
      return;
    }

    setOpeningWindow(true);
    try {
      const result = await superAdminService.openOcrWindow({
        startDate: start.toISOString(),
        closeDate: close.toISOString(),
      });
      await refreshWindowStatus();
      setScheduleMessage(
        result?.message || "OCR window schedule has been created successfully.",
      );
    } catch (error) {
      setScheduleMessage(
        error?.message || "Unable to open OCR window. Please try again.",
      );
    } finally {
      setOpeningWindow(false);
    }
  };

  const handleExpireOcrWindow = async () => {
    setScheduleMessage("");

    if (!windowStatus?.isOpen && !windowStatus?.isScheduled) {
      setScheduleMessage("There is no active OCR window to expire.");
      return;
    }

    setExpiringWindow(true);
    try {
      const result = await superAdminService.expireOcrWindow();
      await refreshWindowStatus();
      setScheduleMessage(result?.message || "OCR window expired successfully.");
    } catch (error) {
      setScheduleMessage(
        error?.message || "Unable to expire OCR window. Please try again.",
      );
    } finally {
      setExpiringWindow(false);
    }
  };

  const statusBadge = useMemo(() => {
    if (!windowStatus?.isConfigured) {
      return { label: "Not Configured", color: "text-amber-300" };
    }
    if (windowStatus.isOpen) {
      return { label: "Open", color: "text-[#35d59a]" };
    }
    if (windowStatus.isScheduled) {
      return { label: "Scheduled", color: "text-sky-300" };
    }
    return { label: "Closed", color: "text-rose-300" };
  }, [windowStatus]);

  const formattedWindowRange = useMemo(() => {
    if (!windowStatus?.startDate || !windowStatus?.closeDate) {
      return "No active OCR window schedule.";
    }

    const startGregorian =
      windowStatus?.startDateDual?.gregorian ||
      new Date(windowStatus.startDate).toLocaleDateString();
    const startEthiopian =
      windowStatus?.startDateDual?.ethiopianAm ||
      windowStatus?.startDateDual?.ethiopianEn ||
      "-";
    const closeGregorian =
      windowStatus?.closeDateDual?.gregorian ||
      new Date(windowStatus.closeDate).toLocaleDateString();
    const closeEthiopian =
      windowStatus?.closeDateDual?.ethiopianAm ||
      windowStatus?.closeDateDual?.ethiopianEn ||
      "-";

    return `Open: ${startGregorian} / ${startEthiopian} | Close: ${closeGregorian} / ${closeEthiopian}`;
  }, [windowStatus]);

  const statusPillClass = (statusTag) => {
    if (statusTag === "ACTIVE") {
      return "bg-[rgba(29,158,117,0.16)] text-[#35d59a]";
    }
    if (statusTag === "SCHEDULED") {
      return "bg-[rgba(56,189,248,0.14)] text-sky-300";
    }
    return "bg-[rgba(244,63,94,0.15)] text-rose-300";
  };

  const thisMonthCount = useMemo(
    () =>
      readings.filter((reading) => {
        const readingDate = new Date(reading.readingDate);
        const now = new Date();
        return (
          readingDate.getMonth() === now.getMonth() &&
          readingDate.getFullYear() === now.getFullYear()
        );
      }).length,
    [readings],
  );

  return (
    <div className="text-[#e8f4f0]">
      {loadError && (
        <div className="mb-4 rounded-xl border border-[rgba(226,75,74,0.35)] bg-[#2a1211] px-4 py-3 text-xs text-[#ff9c9b]">
          {loadError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          ["Total Readings", readings.length, "submitted via OCR"],
          ["This Month", thisMonthCount, "current month"],
          [
            "Bills Generated",
            readings.filter((r) => r.bill).length,
            "linked bills",
          ],
        ].map(([label, value, sub]) => (
          <div
            key={label}
            className="bg-[#05141f] border border-[rgba(29,158,117,0.08)] rounded-xl p-5"
          >
            <p className="text-[10px] uppercase tracking-widest text-[rgba(232,244,240,0.35)] mb-2">
              {label}
            </p>
            <p className="font-syne text-3xl font-bold tracking-tight">
              {value}
            </p>
            <p className="text-[10px] text-[#1D9E75] mt-1">{sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-[#05141f] border border-[rgba(29,158,117,0.08)] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(29,158,117,0.08)]">
          <div>
            <h2 className="font-syne font-bold text-sm tracking-tight">
              OCR Window
            </h2>
            <p className="text-[10px] text-[rgba(232,244,240,0.3)] mt-0.5">
              {readings.length} readings found
            </p>
          </div>
          <div className="text-right">
            <p className={`text-xs font-semibold ${statusBadge.color}`}>
              {statusBadge.label}
            </p>
            <p className="text-[10px] text-[rgba(232,244,240,0.35)] mt-1">
              {formattedWindowRange}
            </p>
          </div>
        </div>

        <form
          onSubmit={handleOpenOcrWindow}
          className="px-6 py-4 border-b border-[rgba(29,158,117,0.08)]"
        >
          <p className="text-xs text-[rgba(232,244,240,0.75)] mb-3">
            Schedule OCR opening window for all customer mobile apps.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <label className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-widest text-[rgba(232,244,240,0.35)]">
                Start Date
              </span>
              <input
                type="date"
                value={scheduleForm.startDate}
                onChange={(event) =>
                  setScheduleForm((prev) => ({
                    ...prev,
                    startDate: event.target.value,
                  }))
                }
                className="h-10 rounded-lg px-3 bg-[#071b29] border border-[rgba(29,158,117,0.14)] text-sm text-[#e8f4f0]"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-widest text-[rgba(232,244,240,0.35)]">
                Closing Date
              </span>
              <input
                type="date"
                value={scheduleForm.closeDate}
                onChange={(event) =>
                  setScheduleForm((prev) => ({
                    ...prev,
                    closeDate: event.target.value,
                  }))
                }
                className="h-10 rounded-lg px-3 bg-[#071b29] border border-[rgba(29,158,117,0.14)] text-sm text-[#e8f4f0]"
              />
            </label>

            <button
              type="submit"
              disabled={openingWindow}
              className="h-10 rounded-lg bg-[#1D9E75] text-[#032015] text-sm font-semibold disabled:opacity-60"
            >
              {openingWindow ? "Opening..." : "Open OCR Window"}
            </button>

            <button
              type="button"
              onClick={handleExpireOcrWindow}
              disabled={
                expiringWindow ||
                (!windowStatus?.isOpen && !windowStatus?.isScheduled)
              }
              className="h-10 rounded-lg border border-[rgba(226,75,74,0.35)] bg-[rgba(226,75,74,0.1)] text-[#ff9c9b] text-sm font-semibold disabled:opacity-50"
            >
              {expiringWindow ? "Expiring..." : "Expire OCR Window"}
            </button>
          </div>

          {scheduleMessage ? (
            <p className="text-xs mt-3 text-[rgba(232,244,240,0.65)]">
              {scheduleMessage}
            </p>
          ) : null}
        </form>

        <div className="px-6 py-4 overflow-x-auto">
          {loading ? (
            <p className="text-xs text-[rgba(232,244,240,0.45)]">
              Loading OCR readings...
            </p>
          ) : !readings.length ? (
            <p className="text-xs text-[rgba(232,244,240,0.45)]">
              No OCR readings found.
            </p>
          ) : (
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-[rgba(29,158,117,0.06)]">
                  {["Meter", "Customer", "Reading", "Bill Amount", "Date"].map(
                    (header) => (
                      <th
                        key={header}
                        className="text-left text-[rgba(232,244,240,0.3)] font-medium pb-3 pr-4 uppercase tracking-wider text-[10px]"
                      >
                        {header}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {readings.map((reading) => (
                  <tr
                    key={reading.id}
                    className="border-b border-[rgba(29,158,117,0.04)] hover:bg-[rgba(29,158,117,0.03)] transition-colors"
                  >
                    <td className="py-3 pr-4 text-[rgba(232,244,240,0.85)]">
                      {reading.meter?.meterNumber || "—"}
                    </td>
                    <td className="py-3 pr-4 text-[rgba(232,244,240,0.55)]">
                      {reading.createdBy?.fullName || "Unknown"}
                    </td>
                    <td className="py-3 pr-4 text-[rgba(232,244,240,0.55)]">
                      {reading.readingValue}
                    </td>
                    <td className="py-3 pr-4 text-[rgba(232,244,240,0.55)]">
                      {reading.bill?.amount ?? "—"}
                    </td>
                    <td className="py-3 text-[rgba(232,244,240,0.45)]">
                      {new Date(reading.readingDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="px-6 py-4 border-t border-[rgba(29,158,117,0.08)] overflow-x-auto">
          <div className="mb-3">
            <h3 className="font-syne font-bold text-sm tracking-tight">
              OCR Window Recordings
            </h3>
            <p className="text-[10px] text-[rgba(232,244,240,0.35)] mt-0.5">
              Opening date, closing date, and status tag history
            </p>
          </div>

          {!windowHistory.length ? (
            <p className="text-xs text-[rgba(232,244,240,0.45)]">
              No OCR window recordings found.
            </p>
          ) : (
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-[rgba(29,158,117,0.06)]">
                  {["Month", "Opening Date", "Closing Date", "Tag"].map(
                    (header) => (
                      <th
                        key={header}
                        className="text-left text-[rgba(232,244,240,0.3)] font-medium pb-3 pr-4 uppercase tracking-wider text-[10px]"
                      >
                        {header}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {windowHistory.map((item) => {
                  const openingGregorian =
                    item?.openingDateDual?.gregorian ||
                    new Date(item.openingDate).toLocaleDateString();
                  const openingEthiopian =
                    item?.openingDateDual?.ethiopianAm ||
                    item?.openingDateDual?.ethiopianEn ||
                    "-";
                  const closingGregorian =
                    item?.closingDateDual?.gregorian ||
                    new Date(item.closingDate).toLocaleDateString();
                  const closingEthiopian =
                    item?.closingDateDual?.ethiopianAm ||
                    item?.closingDateDual?.ethiopianEn ||
                    "-";

                  return (
                    <tr
                      key={item.id}
                      className="border-b border-[rgba(29,158,117,0.04)] hover:bg-[rgba(29,158,117,0.03)] transition-colors"
                    >
                      <td className="py-3 pr-4 text-[rgba(232,244,240,0.85)]">
                        {String(item.month).padStart(2, "0")}/{item.year}
                      </td>
                      <td className="py-3 pr-4 text-[rgba(232,244,240,0.55)]">
                        <div>{openingGregorian}</div>
                        <div className="text-[10px] text-[rgba(232,244,240,0.35)]">
                          {openingEthiopian}
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-[rgba(232,244,240,0.55)]">
                        <div>{closingGregorian}</div>
                        <div className="text-[10px] text-[rgba(232,244,240,0.35)]">
                          {closingEthiopian}
                        </div>
                      </td>
                      <td className="py-3 text-[rgba(232,244,240,0.45)]">
                        <span
                          className={`px-2 py-1 rounded-full text-[10px] font-semibold ${statusPillClass(item.statusTag)}`}
                        >
                          {item.statusTag}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
