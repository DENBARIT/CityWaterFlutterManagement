export const OFFICER_TYPE_OPTIONS = [
  {
    value: "INSTALLER_METER_ASSIGNMENT",
    label: "Installers - Meter Number Assignment",
    shortLabel: "Installers",
  },
  {
    value: "TECHNICIAN",
    label: "Technician",
    shortLabel: "Technician",
  },
  {
    value: "PIPELINE_REPAIR",
    label: "Pipeline Repair Officer",
    shortLabel: "Pipeline Repair",
  },
  {
    value: "DRIVER",
    label: "Driver",
    shortLabel: "Driver",
  },
  {
    value: "EXCAVATION_CREW",
    label: "Excavation Crew",
    shortLabel: "Excavation",
  },
  {
    value: "LEAK_DETECTION_TEAM",
    label: "Leak Detection Team",
    shortLabel: "Leak Detection",
  },
  {
    value: "BILLING_OFFICER",
    label: "Billing Officer",
    shortLabel: "Billing",
  },
  {
    value: "COMPLAINT_OFFICER",
    label: "Complaint Officer",
    shortLabel: "Complaint",
  },
];

const TYPE_MAP = OFFICER_TYPE_OPTIONS.reduce((acc, item) => {
  acc[item.value] = item;
  return acc;
}, {});

export function getOfficerTypeLabel(type) {
  return TYPE_MAP[type]?.shortLabel || type || "Unknown";
}

export function getOfficerTypeSelectLabel(type) {
  return TYPE_MAP[type]?.label || type || "Unknown";
}
