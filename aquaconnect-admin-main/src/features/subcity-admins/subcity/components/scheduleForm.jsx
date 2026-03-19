"use client";

import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

const DAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const TIME_12H_PATTERN = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i;

const to24Hour = (time12h) => {
  const text = String(time12h || "")
    .trim()
    .toUpperCase();
  if (!TIME_12H_PATTERN.test(text)) {
    return null;
  }

  const [timePart, period] = text.split(/\s+/);
  const [hourText, minuteText] = timePart.split(":");
  let hours = Number(hourText);
  const minutes = Number(minuteText);

  if (period === "AM") {
    hours = hours === 12 ? 0 : hours;
  } else {
    hours = hours === 12 ? 12 : hours + 12;
  }

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

const to12Hour = (time24h) => {
  const raw = String(time24h || "").trim();
  if (!raw.includes(":")) {
    return raw;
  }

  const [hourText, minuteText] = raw.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return raw;
  }

  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${String(displayHour).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${period}`;
};

const dayTimeToMinutes = (day, time) => {
  const dayIndex = DAYS.indexOf(String(day || "").toUpperCase());
  const normalized = to24Hour(time);
  if (dayIndex < 0 || !normalized || !normalized.includes(":")) {
    return null;
  }

  const [hoursText, minutesText] = normalized.split(":");
  const hours = Number(hoursText);
  const minutes = Number(minutesText);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  return dayIndex * 24 * 60 + hours * 60 + minutes;
};

export default function ScheduleForm({
  onSubmit,
  defaultValues,
  loading,
  woredas = [],
}) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "scheduleBlocks",
  });

  useEffect(() => {
    if (defaultValues) {
      reset({
        woredaId: defaultValues.woreda?.id,
        day: defaultValues.day,
        startTime: to12Hour(defaultValues.startTime),
        endTime: to12Hour(defaultValues.endTime),
        note: defaultValues.note,
      });
      return;
    }

    reset({
      woredaIds: [],
      scheduleBlocks: [
        {
          startDay: "MONDAY",
          endDay: "TUESDAY",
          startTime: "12:00 AM",
          endTime: "12:00 PM",
          note: "",
        },
      ],
    });
  }, [defaultValues, reset]);

  const selectedWoredaIds = watch("woredaIds") || [];

  const toggleArrayValue = (field, value) => {
    const currentValues = watch(field) || [];
    const nextValues = currentValues.includes(value)
      ? currentValues.filter((item) => item !== value)
      : [...currentValues, value];

    setValue(field, nextValues, { shouldValidate: true, shouldDirty: true });
  };

  const preparePayload = (values) => {
    if (defaultValues) {
      return {
        ...values,
        startTime: to24Hour(values.startTime) || "",
        endTime: to24Hour(values.endTime) || "",
      };
    }

    const blocks = (values.scheduleBlocks || []).map((block) => ({
      ...block,
      startTime: to24Hour(block.startTime) || "",
      endTime: to24Hour(block.endTime) || "",
    }));

    return {
      ...values,
      scheduleBlocks: blocks,
    };
  };

  return (
    <form onSubmit={handleSubmit((values) => onSubmit(preparePayload(values)))}>
      {!defaultValues ? (
        <FormField label="Woreda" error={errors.woredaIds?.message}>
          <div className="space-y-2">
            <p className="text-[10px] text-[rgba(232,244,240,0.45)]">
              Select one or more woredas under this subcity.
            </p>
            <input
              type="hidden"
              {...register("woredaIds", {
                validate: (value) =>
                  Array.isArray(value) && value.length > 0
                    ? true
                    : "Please select at least one woreda.",
              })}
            />
            <div className="grid grid-cols-1 gap-2 max-h-44 overflow-y-auto pr-1">
              {woredas.map((w) => {
                const checked = selectedWoredaIds.includes(w.id);
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => toggleArrayValue("woredaIds", w.id)}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left text-xs transition-all ${checked ? "border-[#1D9E75] bg-[rgba(29,158,117,0.12)] text-[#e8f4f0]" : "border-[rgba(29,158,117,0.08)] bg-[rgba(29,158,117,0.03)] text-[rgba(232,244,240,0.7)]"}`}
                  >
                    <span>{w.name}</span>
                    <span className="text-[10px]">
                      {checked ? "Selected" : "Add"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </FormField>
      ) : (
        <FormField label="Woreda" error={errors.woredaId?.message}>
          <Select
            error={errors.woredaId}
            {...register("woredaId", { required: "Please select a woreda." })}
          >
            <option value="">Select woreda</option>
            {woredas.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </Select>
        </FormField>
      )}

      {!defaultValues ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-[#e8f4f0]">
                Schedule Blocks
              </h3>
              <p className="text-[10px] text-[rgba(232,244,240,0.45)]">
                Add one or more blocks. Each block can span multiple days.
              </p>
              <p className="text-[10px] text-[rgba(232,244,240,0.4)] mt-1">
                Time format uses 12-hour clock (example: 12:00 AM, 03:00 PM).
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                append({
                  startDay: "MONDAY",
                  endDay: "TUESDAY",
                  startTime: "12:00 AM",
                  endTime: "12:00 PM",
                  note: "",
                })
              }
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[#03121c] bg-[#1D9E75] hover:bg-[#5DCAA5] transition-all"
            >
              + Add Schedule
            </button>
          </div>

          <div className="space-y-4 max-h-136 overflow-y-auto pr-1">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="rounded-2xl border border-[rgba(29,158,117,0.08)] bg-[rgba(29,158,117,0.03)] p-4 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#e8f4f0]">
                      Schedule {index + 1}
                    </p>
                    <p className="text-[10px] text-[rgba(232,244,240,0.45)]">
                      Example: From Monday 12:00 to Tuesday 03:00
                    </p>
                  </div>
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="text-[10px] text-[#ff9c9b] hover:text-[#ff6b6b]"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FormField
                    label="From day"
                    error={errors.scheduleBlocks?.[index]?.startDay?.message}
                  >
                    <Select
                      error={errors.scheduleBlocks?.[index]?.startDay}
                      {...register(`scheduleBlocks.${index}.startDay`, {
                        required: "Start day is required.",
                      })}
                    >
                      {DAYS.map((d) => (
                        <option key={d} value={d}>
                          {d.charAt(0) + d.slice(1).toLowerCase()}
                        </option>
                      ))}
                    </Select>
                  </FormField>

                  <FormField
                    label="To day"
                    error={errors.scheduleBlocks?.[index]?.endDay?.message}
                  >
                    <Select
                      error={errors.scheduleBlocks?.[index]?.endDay}
                      {...register(`scheduleBlocks.${index}.endDay`, {
                        required: "End day is required.",
                      })}
                    >
                      {DAYS.map((d) => (
                        <option key={d} value={d}>
                          {d.charAt(0) + d.slice(1).toLowerCase()}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    label="From time"
                    error={errors.scheduleBlocks?.[index]?.startTime?.message}
                  >
                    <Input
                      placeholder="hh:mm AM/PM"
                      error={errors.scheduleBlocks?.[index]?.startTime}
                      {...register(`scheduleBlocks.${index}.startTime`, {
                        required: "Start time is required.",
                        validate: (v) =>
                          TIME_12H_PATTERN.test(String(v || "").trim()) ||
                          "Use 12-hour format (e.g. 12:00 AM).",
                      })}
                    />
                  </FormField>
                  <FormField
                    label="To time"
                    error={errors.scheduleBlocks?.[index]?.endTime?.message}
                  >
                    <Input
                      placeholder="hh:mm AM/PM"
                      error={errors.scheduleBlocks?.[index]?.endTime}
                      {...register(`scheduleBlocks.${index}.endTime`, {
                        required: "End time is required.",
                        validate: (v, values) => {
                          if (!TIME_12H_PATTERN.test(String(v || "").trim())) {
                            return "Use 12-hour format (e.g. 03:00 PM).";
                          }

                          const currentBlock = values?.scheduleBlocks?.[index];
                          const startTotalMinutes = dayTimeToMinutes(
                            currentBlock?.startDay,
                            currentBlock?.startTime,
                          );
                          const endTotalMinutes = dayTimeToMinutes(
                            currentBlock?.endDay,
                            v,
                          );

                          if (
                            startTotalMinutes === null ||
                            endTotalMinutes === null
                          ) {
                            return true;
                          }

                          return (
                            endTotalMinutes > startTotalMinutes ||
                            "To day/time must be after from day/time."
                          );
                        },
                      })}
                    />
                  </FormField>
                </div>

                <FormField
                  label="Note (optional)"
                  error={errors.scheduleBlocks?.[index]?.note?.message}
                >
                  <Input
                    placeholder="e.g. Monday evening supply"
                    {...register(`scheduleBlocks.${index}.note`)}
                  />
                </FormField>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <FormField label="Day of week" error={errors.day?.message}>
          <Select
            error={errors.day}
            {...register("day", { required: "Please select a day." })}
          >
            <option value="">Select day</option>
            {DAYS.map((d) => (
              <option key={d} value={d}>
                {d.charAt(0) + d.slice(1).toLowerCase()}
              </option>
            ))}
          </Select>
        </FormField>
      )}

      {defaultValues && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Start time" error={errors.startTime?.message}>
              <Input
                placeholder="hh:mm AM/PM"
                error={errors.startTime}
                {...register("startTime", {
                  required: "Start time is required.",
                  validate: (v) =>
                    TIME_12H_PATTERN.test(String(v || "").trim()) ||
                    "Use 12-hour format (e.g. 12:00 AM).",
                })}
              />
            </FormField>
            <FormField label="End time" error={errors.endTime?.message}>
              <Input
                placeholder="hh:mm AM/PM"
                error={errors.endTime}
                {...register("endTime", {
                  required: "End time is required.",
                  validate: (v) =>
                    (TIME_12H_PATTERN.test(String(v || "").trim()) &&
                      TIME_12H_PATTERN.test(
                        String(watch("startTime") || "").trim(),
                      ) &&
                      (to24Hour(v) || "") >
                        (to24Hour(watch("startTime")) || "")) ||
                    "End time must be after start time.",
                })}
              />
            </FormField>
          </div>

          <FormField label="Note (optional)" error={errors.note?.message}>
            <Input
              placeholder="e.g. Morning water supply"
              {...register("note")}
            />
          </FormField>
        </>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#1D9E75] text-[#020f1a] font-syne font-bold py-3 rounded-xl hover:bg-[#5DCAA5] transition-all disabled:opacity-60 text-sm mt-2"
      >
        {loading
          ? "Saving..."
          : defaultValues
            ? "Update Schedule"
            : "Create Schedule"}
      </button>
    </form>
  );
}
