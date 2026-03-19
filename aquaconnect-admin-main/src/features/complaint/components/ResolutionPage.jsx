"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { getJwtPayload } from "@/services/apiClient";
import { useComplaints } from "@/features/complaint/hooks/useComplaints";
import { superAdminService } from "@/features/super-admin/services/superAdmin.service";

const ACTIVE_STATUSES = ["OPEN", "IN_PROGRESS", "ESCALATED"];

export default function ResolutionPage() {
  const TOAST_DURATION_MS = 4000;
  const [authPayload, setAuthPayload] = useState({});
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    setAuthPayload(getJwtPayload() || {});
    setAuthReady(true);
  }, []);

  const payload = authPayload || {};
  const role = String(payload?.role || "").toUpperCase();
  const isSubcityComplaintOfficer = role === "SUBCITY_COMPLAINT_OFFICER";
  const isWoredaComplaintOfficer = role === "WOREDA_COMPLAINT_OFFICER";
  const isComplaintOfficer =
    isWoredaComplaintOfficer || isSubcityComplaintOfficer;

  const scopeArgs = isSubcityComplaintOfficer
    ? { scopeSubCityId: payload?.subCityId || "" }
    : { scopeWoredaId: payload?.woredaId || "" };

  const { allComplaints, loading, reloadComplaints } = useComplaints(scopeArgs);

  const [fieldOfficers, setFieldOfficers] = useState([]);
  const [selectedOfficerByComplaint, setSelectedOfficerByComplaint] = useState(
    {},
  );
  const [selectedTeamByComplaint, setSelectedTeamByComplaint] = useState({});
  const [solutionByComplaint, setSolutionByComplaint] = useState({});
  const [expandedComplaintIds, setExpandedComplaintIds] = useState({});
  const [submittingId, setSubmittingId] = useState("");
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  const [contactTarget, setContactTarget] = useState(null);
  const [contactSubject, setContactSubject] = useState("");
  const [contactMessage, setContactMessage] = useState("");

  const [contactAdminsTarget, setContactAdminsTarget] = useState(null);
  const [contactAdminsSubject, setContactAdminsSubject] = useState("");
  const [contactAdminsMessage, setContactAdminsMessage] = useState("");

  const [contactOfficerTarget, setContactOfficerTarget] = useState(null);
  const [contactOfficerSubject, setContactOfficerSubject] = useState("");
  const [contactOfficerMessage, setContactOfficerMessage] = useState("");

  const showToast = (type, message) => {
    if (!message) {
      return;
    }
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToast({ type, message });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, TOAST_DURATION_MS);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const complaints = useMemo(
    () => allComplaints.filter((item) => ACTIVE_STATUSES.includes(item.status)),
    [allComplaints],
  );

  useEffect(() => {
    const loadOfficers = async () => {
      if (!payload?.woredaId && !payload?.subCityId) {
        setFieldOfficers([]);
        return;
      }

      try {
        const rows = await superAdminService.getFieldOfficers({
          woredaId: isSubcityComplaintOfficer ? "" : payload.woredaId,
          subCityId: isSubcityComplaintOfficer ? payload.subCityId : "",
        });
        setFieldOfficers(Array.isArray(rows) ? rows : []);
      } catch {
        setFieldOfficers([]);
      }
    };

    void loadOfficers();
  }, [payload?.woredaId, payload?.subCityId, isSubcityComplaintOfficer]);

  const runAction = async (complaintId, action, successMessage) => {
    setSubmittingId(complaintId);
    try {
      await action();
      await reloadComplaints();
      showToast("success", successMessage || "Action completed successfully.");
    } catch (err) {
      showToast("error", err?.message || "Action failed.");
    } finally {
      setSubmittingId("");
    }
  };

  const assignFieldOfficer = async (complaintId) => {
    const fieldOfficerId = selectedOfficerByComplaint[complaintId] || "";
    if (!fieldOfficerId) {
      showToast("error", "Please select a field officer before assigning.");
      return;
    }

    await runAction(
      complaintId,
      () =>
        superAdminService.assignComplaintFieldOfficer(
          complaintId,
          fieldOfficerId,
        ),
      "Field officer assigned successfully.",
    );
  };

  const assignTeamAndPlan = async (
    complaintId,
    notifySubcityAdmins = false,
  ) => {
    const assignedTeam = String(
      selectedTeamByComplaint[complaintId] || "",
    ).trim();
    const highLevelSolution = String(
      solutionByComplaint[complaintId] || "",
    ).trim();

    if (!assignedTeam && !highLevelSolution) {
      showToast(
        "error",
        "Please provide assigned team or high-level solution details.",
      );
      return;
    }

    await runAction(
      complaintId,
      () =>
        superAdminService.updateComplaintResolutionPlan(complaintId, {
          assignedTeam,
          highLevelSolution,
          notifySubcityAdmins,
        }),
      notifySubcityAdmins
        ? "Resolution team assigned and subcity admins notified."
        : "Resolution team assigned successfully.",
    );
  };

  const markResolved = async (complaintId) => {
    await runAction(
      complaintId,
      () => superAdminService.updateComplaintStatus(complaintId, "RESOLVED"),
      "Complaint marked as resolved.",
    );
  };

  const escalate = async (complaintId) => {
    await runAction(
      complaintId,
      () =>
        superAdminService.escalateComplaint(
          complaintId,
          "Not resolved at woreda level. Escalated to subcity complaint officer.",
        ),
      "Complaint escalated to subcity complaint officer.",
    );
  };

  const sendContactMessage = async () => {
    if (!contactTarget) {
      return;
    }

    const subject = contactSubject.trim();
    const message = contactMessage.trim();

    if (!message) {
      showToast("error", "Please enter a message for the customer.");
      return;
    }

    await runAction(
      contactTarget.id,
      async () => {
        await superAdminService.contactComplaintCustomer(contactTarget.id, {
          subject,
          message,
          sendEmail: true,
          sendInApp: true,
        });
        setContactTarget(null);
        setContactSubject("");
        setContactMessage("");
      },
      "Message sent to customer successfully.",
    );
  };

  const sendSubcityAdminMessage = async () => {
    if (!contactAdminsTarget) {
      return;
    }

    const subject = contactAdminsSubject.trim();
    const message = contactAdminsMessage.trim();

    if (!message) {
      showToast("error", "Please enter a message for subcity admins.");
      return;
    }

    await runAction(
      contactAdminsTarget.id,
      async () => {
        await superAdminService.contactComplaintSubcityAdmins(
          contactAdminsTarget.id,
          {
            subject,
            message,
          },
        );
        setContactAdminsTarget(null);
        setContactAdminsSubject("");
        setContactAdminsMessage("");
      },
      "Message sent to subcity admins successfully.",
    );
  };

  const sendSubcityOfficerMessage = async () => {
    if (!contactOfficerTarget) {
      return;
    }

    const subject = contactOfficerSubject.trim();
    const message = contactOfficerMessage.trim();

    if (!message) {
      showToast("error", "Please enter a message for the complaint officer.");
      return;
    }

    await runAction(
      contactOfficerTarget.id,
      async () => {
        await superAdminService.contactComplaintSubcityOfficer(
          contactOfficerTarget.id,
          {
            subject,
            message,
          },
        );
        setContactOfficerTarget(null);
        setContactOfficerSubject("");
        setContactOfficerMessage("");
      },
      "Message sent to subcity complaint officer successfully.",
    );
  };

  return (
    <div className="text-[#e8f4f0] space-y-4">
      {!authReady && (
        <div className="rounded-xl border border-[rgba(29,158,117,0.2)] bg-[rgba(29,158,117,0.06)] px-4 py-3 text-xs text-[rgba(232,244,240,0.65)]">
          Loading resolution workspace...
        </div>
      )}

      {authReady && !isComplaintOfficer && (
        <div className="rounded-xl border border-[rgba(239,159,39,0.28)] bg-[rgba(239,159,39,0.08)] px-4 py-3 text-xs text-[#EF9F27]">
          Resolution actions are available for woreda and subcity complaint
          officers.
        </div>
      )}

      {toast && (
        <div
          className={`rounded-xl border px-4 py-3 text-xs ${toast.type === "success" ? "border-[rgba(29,158,117,0.28)] bg-[rgba(29,158,117,0.08)] text-[#5DCAA5]" : "border-[rgba(226,75,74,0.28)] bg-[rgba(226,75,74,0.08)] text-[#E24B4A]"}`}
        >
          {toast.message}
        </div>
      )}

      <div
        className={`bg-[#05141f] overflow-hidden ${
          isWoredaComplaintOfficer
            ? ""
            : "border border-[rgba(29,158,117,0.08)] rounded-2xl"
        }`}
      >
        <div className="px-6 py-4 border-b border-[rgba(29,158,117,0.08)]">
          <h2 className="font-syne font-bold text-sm tracking-tight">
            Resolution
          </h2>
          <p className="text-[10px] text-[rgba(232,244,240,0.35)] mt-1">
            Assign teams and officers, coordinate with subcity admins, resolve
            complaints, and notify customers when solved.
          </p>
        </div>

        <div
          className={`overflow-x-auto py-4 ${
            isWoredaComplaintOfficer ? "px-0" : "px-6"
          }`}
        >
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-[rgba(29,158,117,0.06)]">
                {[
                  "Complaint",
                  ...(isSubcityComplaintOfficer
                    ? ["From Woreda", "Escalated By"]
                    : []),
                  "Customer",
                  "Status",
                  "Team / Solution",
                  "Field Officer",
                  "Actions",
                ].map((header) => (
                  <th
                    key={header}
                    className="text-left text-[rgba(232,244,240,0.3)] font-medium pb-3 pr-4 uppercase tracking-wider text-[10px]"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {complaints.map((complaint) => {
                const disabled = submittingId === complaint.id || loading;
                const fullDescription = String(complaint.description || "");
                const descriptionExpanded =
                  expandedComplaintIds[complaint.id] === true;
                const descriptionIsLong = fullDescription.length > 180;
                const compactDescription = descriptionIsLong
                  ? `${fullDescription.slice(0, 180).trimEnd()}...`
                  : fullDescription;

                return (
                  <tr
                    key={complaint.id}
                    className="border-b border-[rgba(29,158,117,0.04)] align-top"
                  >
                    <td className="py-3 pr-4 max-w-80">
                      <p className="font-medium text-[rgba(232,244,240,0.85)] truncate">
                        {complaint.title}
                      </p>
                      <p className="text-[9px] text-[rgba(232,244,240,0.35)] mt-0.5 whitespace-pre-wrap wrap-break-word">
                        {descriptionExpanded
                          ? fullDescription
                          : compactDescription}
                      </p>
                      {descriptionIsLong && (
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedComplaintIds((prev) => ({
                              ...prev,
                              [complaint.id]: !descriptionExpanded,
                            }))
                          }
                          className="mt-1 text-[10px] font-semibold text-[#7ce4be] hover:text-[#9ef1cf]"
                        >
                          {descriptionExpanded ? "Read less" : "Read more"}
                        </button>
                      )}
                    </td>
                    {isSubcityComplaintOfficer && (
                      <td className="py-3 pr-4 text-[rgba(232,244,240,0.75)]">
                        {complaint.woreda?.name || "-"}
                      </td>
                    )}
                    {isSubcityComplaintOfficer && (
                      <td className="py-3 pr-4">
                        <p className="text-[rgba(232,244,240,0.75)]">
                          {complaint.escalatedBy?.fullName || "-"}
                        </p>
                        <p className="text-[9px] text-[rgba(232,244,240,0.35)] truncate max-w-52">
                          {complaint.escalationReason ||
                            "Escalated from woreda"}
                        </p>
                      </td>
                    )}
                    <td className="py-3 pr-4">
                      <p className="text-[rgba(232,244,240,0.75)]">
                        {complaint.submittedBy?.fullName || "Unknown"}
                      </p>
                      <p className="text-[9px] text-[rgba(232,244,240,0.35)]">
                        {complaint.submittedBy?.email || "No email"}
                      </p>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-[rgba(29,158,117,0.12)] text-[#1D9E75]">
                        {complaint.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4 min-w-72">
                      <input
                        value={selectedTeamByComplaint[complaint.id] || ""}
                        onChange={(e) =>
                          setSelectedTeamByComplaint((prev) => ({
                            ...prev,
                            [complaint.id]: e.target.value,
                          }))
                        }
                        className="w-full bg-[rgba(29,158,117,0.04)] border border-[rgba(29,158,117,0.1)] rounded-lg px-2 py-1.5 text-xs text-[#e8f4f0] mb-2"
                        placeholder="Assign team (e.g. Leak Detection Team)"
                      />
                      <textarea
                        value={solutionByComplaint[complaint.id] || ""}
                        onChange={(e) =>
                          setSolutionByComplaint((prev) => ({
                            ...prev,
                            [complaint.id]: e.target.value,
                          }))
                        }
                        rows={2}
                        className="w-full bg-[rgba(29,158,117,0.04)] border border-[rgba(29,158,117,0.1)] rounded-lg px-2 py-1.5 text-xs text-[#e8f4f0]"
                        placeholder="High-level solution plan"
                      />
                    </td>
                    <td className="py-3 pr-4 min-w-56">
                      <p className="text-[10px] text-[rgba(232,244,240,0.45)] mb-1">
                        Current:{" "}
                        {complaint.assignedFieldOfficer?.fullName ||
                          "Unassigned"}
                      </p>
                      <select
                        value={selectedOfficerByComplaint[complaint.id] || ""}
                        onChange={(e) =>
                          setSelectedOfficerByComplaint((prev) => ({
                            ...prev,
                            [complaint.id]: e.target.value,
                          }))
                        }
                        className="w-full bg-[rgba(29,158,117,0.04)] border border-[rgba(29,158,117,0.1)] rounded-lg px-2 py-1.5 text-xs text-[#e8f4f0]"
                      >
                        <option value="">Select field officer</option>
                        {fieldOfficers.map((officer) => (
                          <option key={officer.id} value={officer.id}>
                            {officer.fullName}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 pr-1 min-w-72">
                      <div className="flex flex-wrap gap-2">
                        <button
                          disabled={disabled || !isComplaintOfficer}
                          onClick={() =>
                            void assignTeamAndPlan(
                              complaint.id,
                              isSubcityComplaintOfficer,
                            )
                          }
                          className="px-3 py-1 rounded-lg text-[10px] bg-[rgba(29,158,117,0.08)] text-[#1D9E75] hover:bg-[rgba(29,158,117,0.18)] disabled:opacity-50"
                        >
                          Assign Team
                        </button>
                        <button
                          disabled={disabled || !isComplaintOfficer}
                          onClick={() => void assignFieldOfficer(complaint.id)}
                          className="px-3 py-1 rounded-lg text-[10px] bg-[rgba(55,138,221,0.12)] text-[#7fc3ff] hover:bg-[rgba(55,138,221,0.22)] disabled:opacity-50"
                        >
                          Assign Officer
                        </button>
                        <button
                          disabled={disabled || !isComplaintOfficer}
                          onClick={() => void markResolved(complaint.id)}
                          className="px-3 py-1 rounded-lg text-[10px] bg-[rgba(29,158,117,0.15)] text-[#5DCAA5] hover:bg-[rgba(29,158,117,0.24)] disabled:opacity-50"
                        >
                          Mark Resolved
                        </button>
                        <button
                          disabled={disabled || !isWoredaComplaintOfficer}
                          onClick={() => void escalate(complaint.id)}
                          className="px-3 py-1 rounded-lg text-[10px] bg-[rgba(239,159,39,0.12)] text-[#EF9F27] hover:bg-[rgba(239,159,39,0.22)] disabled:opacity-50"
                        >
                          Escalate
                        </button>
                        <button
                          disabled={disabled || !isComplaintOfficer}
                          onClick={() => {
                            setContactAdminsTarget(complaint);
                            setContactAdminsSubject(
                              `Complaint coordination needed: ${complaint.title}`,
                            );
                            setContactAdminsMessage("");
                          }}
                          className="px-3 py-1 rounded-lg text-[10px] bg-[rgba(239,159,39,0.12)] text-[#EF9F27] hover:bg-[rgba(239,159,39,0.22)] disabled:opacity-50"
                        >
                          Contact Subcity Admins
                        </button>
                        <button
                          disabled={disabled || !isComplaintOfficer}
                          onClick={() => {
                            setContactTarget(complaint);
                            setContactSubject(
                              `Regarding your complaint: ${complaint.title}`,
                            );
                            setContactMessage("");
                          }}
                          className="px-3 py-1 rounded-lg text-[10px] bg-[rgba(214,83,126,0.12)] text-[#D4537E] hover:bg-[rgba(214,83,126,0.22)] disabled:opacity-50"
                        >
                          Contact Customer
                        </button>
                        <button
                          disabled={disabled || !isComplaintOfficer}
                          onClick={() => {
                            setContactOfficerTarget(complaint);
                            setContactOfficerSubject(
                              `Update request on complaint: ${complaint.title}`,
                            );
                            setContactOfficerMessage("");
                          }}
                          className="px-3 py-1 rounded-lg text-[10px] bg-[rgba(129,106,245,0.16)] text-[#b7a8ff] hover:bg-[rgba(129,106,245,0.28)] disabled:opacity-50"
                        >
                          Message Subcity Officer
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {!complaints.length && (
            <p className="text-[11px] text-[rgba(232,244,240,0.35)] py-4">
              No active complaints found for resolution.
            </p>
          )}
        </div>
      </div>

      {contactTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-[#05141f] border border-[rgba(29,158,117,0.2)] rounded-2xl p-5">
            <h3 className="font-syne text-base font-bold mb-1">
              Contact Customer
            </h3>
            <p className="text-[11px] text-[rgba(232,244,240,0.45)] mb-4">
              Send both email and in-app notification to{" "}
              {contactTarget.submittedBy?.fullName || "customer"}.
            </p>

            <label className="block text-[10px] uppercase tracking-wider text-[rgba(232,244,240,0.45)] mb-1">
              Subject
            </label>
            <input
              value={contactSubject}
              onChange={(e) => setContactSubject(e.target.value)}
              className="w-full bg-[rgba(29,158,117,0.04)] border border-[rgba(29,158,117,0.1)] rounded-lg px-3 py-2 text-xs text-[#e8f4f0] mb-3"
            />

            <label className="block text-[10px] uppercase tracking-wider text-[rgba(232,244,240,0.45)] mb-1">
              Message
            </label>
            <textarea
              value={contactMessage}
              onChange={(e) => setContactMessage(e.target.value)}
              rows={6}
              className="w-full bg-[rgba(29,158,117,0.04)] border border-[rgba(29,158,117,0.1)] rounded-lg px-3 py-2 text-xs text-[#e8f4f0]"
              placeholder="Write your message to the customer..."
            />

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setContactTarget(null)}
                className="px-4 py-2 rounded-lg text-xs text-[rgba(232,244,240,0.7)] border border-[rgba(232,244,240,0.2)]"
              >
                Cancel
              </button>
              <button
                onClick={() => void sendContactMessage()}
                disabled={Boolean(submittingId)}
                className="px-4 py-2 rounded-lg text-xs bg-[#1D9E75] text-[#02131f] font-semibold hover:bg-[#5DCAA5] disabled:opacity-50"
              >
                {submittingId ? "Sending..." : "Send Message"}
              </button>
            </div>
          </div>
        </div>
      )}

      {contactAdminsTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-[#05141f] border border-[rgba(29,158,117,0.2)] rounded-2xl p-5">
            <h3 className="font-syne text-base font-bold mb-1">
              Contact Subcity Admins
            </h3>
            <p className="text-[11px] text-[rgba(232,244,240,0.45)] mb-4">
              Share high-level coordination updates for this complaint with
              subcity admins.
            </p>

            <label className="block text-[10px] uppercase tracking-wider text-[rgba(232,244,240,0.45)] mb-1">
              Subject
            </label>
            <input
              value={contactAdminsSubject}
              onChange={(e) => setContactAdminsSubject(e.target.value)}
              className="w-full bg-[rgba(29,158,117,0.04)] border border-[rgba(29,158,117,0.1)] rounded-lg px-3 py-2 text-xs text-[#e8f4f0] mb-3"
            />

            <label className="block text-[10px] uppercase tracking-wider text-[rgba(232,244,240,0.45)] mb-1">
              Message
            </label>
            <textarea
              value={contactAdminsMessage}
              onChange={(e) => setContactAdminsMessage(e.target.value)}
              rows={6}
              className="w-full bg-[rgba(29,158,117,0.04)] border border-[rgba(29,158,117,0.1)] rounded-lg px-3 py-2 text-xs text-[#e8f4f0]"
              placeholder="Write your coordination request..."
            />

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setContactAdminsTarget(null)}
                className="px-4 py-2 rounded-lg text-xs text-[rgba(232,244,240,0.7)] border border-[rgba(232,244,240,0.2)]"
              >
                Cancel
              </button>
              <button
                onClick={() => void sendSubcityAdminMessage()}
                disabled={Boolean(submittingId)}
                className="px-4 py-2 rounded-lg text-xs bg-[#EF9F27] text-[#02131f] font-semibold hover:bg-[#f3bb5d] disabled:opacity-50"
              >
                {submittingId ? "Sending..." : "Send to Admins"}
              </button>
            </div>
          </div>
        </div>
      )}

      {contactOfficerTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-[#05141f] border border-[rgba(29,158,117,0.2)] rounded-2xl p-5">
            <h3 className="font-syne text-base font-bold mb-1">
              Message Subcity Complaint Officer
            </h3>
            <p className="text-[11px] text-[rgba(232,244,240,0.45)] mb-4">
              Send an update request to the assigned or escalating subcity
              complaint officer.
            </p>

            <label className="block text-[10px] uppercase tracking-wider text-[rgba(232,244,240,0.45)] mb-1">
              Subject
            </label>
            <input
              value={contactOfficerSubject}
              onChange={(e) => setContactOfficerSubject(e.target.value)}
              className="w-full bg-[rgba(29,158,117,0.04)] border border-[rgba(29,158,117,0.1)] rounded-lg px-3 py-2 text-xs text-[#e8f4f0] mb-3"
            />

            <label className="block text-[10px] uppercase tracking-wider text-[rgba(232,244,240,0.45)] mb-1">
              Message
            </label>
            <textarea
              value={contactOfficerMessage}
              onChange={(e) => setContactOfficerMessage(e.target.value)}
              rows={6}
              className="w-full bg-[rgba(29,158,117,0.04)] border border-[rgba(29,158,117,0.1)] rounded-lg px-3 py-2 text-xs text-[#e8f4f0]"
              placeholder="Write your update request..."
            />

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setContactOfficerTarget(null)}
                className="px-4 py-2 rounded-lg text-xs text-[rgba(232,244,240,0.7)] border border-[rgba(232,244,240,0.2)]"
              >
                Cancel
              </button>
              <button
                onClick={() => void sendSubcityOfficerMessage()}
                disabled={Boolean(submittingId)}
                className="px-4 py-2 rounded-lg text-xs bg-[#816AF5] text-[#02131f] font-semibold hover:bg-[#9e8ef8] disabled:opacity-50"
              >
                {submittingId ? "Sending..." : "Send Message"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
