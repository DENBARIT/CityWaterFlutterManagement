"use client";

import { useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useTariff } from "@/features/billing/hooks/useBilling";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";

const DEFAULT_TIER_BLOCKS = [
  { fromM3: 0, toM3: 7, pricePerM3: 1.75 },
  { fromM3: 8, toM3: 20, pricePerM3: 3.8 },
  { fromM3: 21, toM3: 40, pricePerM3: 4.75 },
  { fromM3: 41, toM3: 100, pricePerM3: 14.57 },
  { fromM3: 101, toM3: 300, pricePerM3: 19.42 },
  { fromM3: 301, toM3: 500, pricePerM3: 24.28 },
  { fromM3: 501, toM3: "", pricePerM3: 26.71 },
];

const CUSTOMER_TARIFF_TYPES = [
  { value: "RESIDENTIAL", label: "Residential" },
  { value: "COMMERCIAL", label: "Commercial" },
  { value: "GOVERNMENTAL", label: "Governmental" },
];

const customerTypeLabel = (value) =>
  CUSTOMER_TARIFF_TYPES.find((item) => item.value === value)?.label ||
  "Residential";

const formatRange = (block) => {
  if (block?.toM3 === null || block?.toM3 === undefined || block?.toM3 === "") {
    return `> ${block?.fromM3 ?? 0} m3`;
  }
  return `${block?.fromM3 ?? 0} - ${block?.toM3} m3`;
};

const buildDefaultEffectiveFrom = () => {
  const date = new Date();
  const localISO = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
  return localISO;
};

const toFormTariff = (tariff = null) => {
  if (!tariff) {
    return {
      id: "",
      name: "",
      customerType: "RESIDENTIAL",
      effectiveFrom: buildDefaultEffectiveFrom(),
      latePenaltyPerDayPercent: 0,
      blocks: DEFAULT_TIER_BLOCKS,
    };
  }

  return {
    id: tariff.id,
    name: tariff.name || "",
    customerType: String(tariff.customerType || "RESIDENTIAL").toUpperCase(),
    effectiveFrom: new Date(tariff.effectiveFrom).toISOString().slice(0, 16),
    latePenaltyPerDayPercent: Number(tariff.latePenaltyPerDayPercent || 0),
    blocks: (Array.isArray(tariff.blocks) ? tariff.blocks : []).map(
      (block) => ({
        fromM3: block.fromM3,
        toM3: block.toM3 ?? "",
        pricePerM3: Number(block.pricePerM3),
      }),
    ),
  };
};

const validateBlocks = (blocks) => {
  const normalized = (Array.isArray(blocks) ? blocks : [])
    .map((block) => ({
      fromM3: Number(block.fromM3),
      toM3:
        block.toM3 === "" || block.toM3 === null || block.toM3 === undefined
          ? null
          : Number(block.toM3),
      pricePerM3: Number(block.pricePerM3),
    }))
    .sort((a, b) => a.fromM3 - b.fromM3);

  if (!normalized.length) {
    return { ok: false, message: "At least one tier is required." };
  }

  if (normalized[0].fromM3 !== 0) {
    return { ok: false, message: "The first tier must start at 0 m3." };
  }

  let previousTo = null;
  for (let i = 0; i < normalized.length; i += 1) {
    const tier = normalized[i];

    if (!Number.isInteger(tier.fromM3) || tier.fromM3 < 0) {
      return {
        ok: false,
        message: "Each from value must be a non-negative integer.",
      };
    }

    if (
      tier.toM3 !== null &&
      (!Number.isInteger(tier.toM3) || tier.toM3 < tier.fromM3)
    ) {
      return {
        ok: false,
        message: "Each to value must be empty or greater than/equal to from.",
      };
    }

    if (!Number.isFinite(tier.pricePerM3) || tier.pricePerM3 <= 0) {
      return { ok: false, message: "Each tier must have a positive price." };
    }

    if (previousTo === null && i > 0) {
      return {
        ok: false,
        message: "No tiers are allowed after an open-ended tier.",
      };
    }

    if (previousTo !== null && tier.fromM3 !== previousTo + 1) {
      return {
        ok: false,
        message: "Tier ranges must be continuous (no gaps/overlaps).",
      };
    }

    previousTo = tier.toM3;
  }

  return { ok: true, blocks: normalized };
};

export default function TariffPage() {
  const [selectedTariffType, setSelectedTariffType] = useState("RESIDENTIAL");
  const { tariffs, effectiveTariff, loading, saveTariff } =
    useTariff(selectedTariffType);
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formError, setFormError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    control,
    getValues,
  } = useForm({
    defaultValues: toFormTariff(null),
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "blocks",
  });

  const sortedTariffs = useMemo(
    () =>
      [...tariffs]
        .filter(
          (tariff) =>
            String(tariff.customerType || "RESIDENTIAL").toUpperCase() ===
            selectedTariffType,
        )
        .sort((a, b) => new Date(b.effectiveFrom) - new Date(a.effectiveFrom)),
    [selectedTariffType, tariffs],
  );

  const openCreateModal = () => {
    setIsEditing(false);
    setFormError("");
    reset(toFormTariff(null));
    setModalOpen(true);
  };

  const openEditModal = (tariff) => {
    setIsEditing(true);
    setFormError("");
    reset(toFormTariff(tariff));
    setModalOpen(true);
  };

  const onSubmit = async (data) => {
    const validation = validateBlocks(data.blocks);
    if (!validation.ok) {
      setFormError(validation.message);
      return;
    }

    try {
      setFormError("");
      await saveTariff({
        id: data.id || undefined,
        name: data.name,
        customerType: data.customerType,
        effectiveFrom: data.effectiveFrom,
        latePenaltyPerDayPercent: Number(data.latePenaltyPerDayPercent || 0),
        blocks: validation.blocks,
      });
      reset(toFormTariff(null));
      setModalOpen(false);
      setIsEditing(false);
    } catch (err) {
      setFormError(err?.message || "Unable to save tariff.");
    }
  };

  const addTierRow = () => {
    const blocks = getValues("blocks") || [];
    const last = blocks[blocks.length - 1];
    const fromM3 =
      last && last.toM3 !== "" && last.toM3 !== null && last.toM3 !== undefined
        ? Number(last.toM3) + 1
        : blocks.length
          ? Number(last?.fromM3 || 0) + 1
          : 0;

    append({ fromM3, toM3: "", pricePerM3: "" });
  };

  return (
    <div className="text-[#e8f4f0]">
      {/* Current Tariff Hero */}
      <div className="bg-[#05141f] border border-[rgba(29,158,117,0.12)] rounded-2xl p-8 mb-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_80%_50%,rgba(29,158,117,0.06),transparent)]" />
        <div className="relative flex items-center justify-between flex-wrap gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-[rgba(29,158,117,0.1)] border border-[rgba(29,158,117,0.2)] rounded-full px-3 py-1 text-[10px] text-[#1D9E75] mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1D9E75] animate-pulse" />
              {customerTypeLabel(selectedTariffType)} tariff
            </div>
            {effectiveTariff ? (
              <>
                <div className="flex items-baseline gap-2 mb-2">
                  {effectiveTariff.blocks?.length ? (
                    <span className="font-syne text-4xl font-extrabold text-[#1D9E75] tracking-tight">
                      {effectiveTariff.blocks.length} tier
                      {effectiveTariff.blocks.length > 1 ? "s" : ""} active
                    </span>
                  ) : (
                    <span className="font-syne text-4xl font-extrabold text-[#1D9E75] tracking-tight">
                      Tier data unavailable
                    </span>
                  )}
                </div>
                <p className="text-xs text-[rgba(232,244,240,0.4)]">
                  Effective from{" "}
                  <span className="text-[#e8f4f0]">
                    {new Date(effectiveTariff.effectiveFrom).toLocaleDateString(
                      "en-GB",
                      {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      },
                    )}
                  </span>
                </p>
                <p className="text-xs text-[rgba(232,244,240,0.4)] mt-1">
                  Late penalty rate{" "}
                  <span className="text-[#EF9F27]">
                    {Number(
                      effectiveTariff.latePenaltyPerDayPercent || 0,
                    ).toFixed(2)}
                    %
                  </span>
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(effectiveTariff.blocks || []).map((block) => (
                    <span
                      key={block.id || `${block.fromM3}-${block.toM3}`}
                      className="text-[10px] px-2.5 py-1 rounded-full border border-[rgba(29,158,117,0.22)] bg-[rgba(29,158,117,0.08)] text-[#9be5c9]"
                    >
                      {formatRange(block)} @{" "}
                      {Number(block.pricePerM3).toFixed(2)}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <>
                <p className="text-xs text-[rgba(232,244,240,0.4)] mb-2">
                  Managing {customerTypeLabel(selectedTariffType).toLowerCase()}{" "}
                  customers only.
                </p>
                <p className="text-sm text-[rgba(232,244,240,0.4)]">
                  No active tariff found.
                </p>
              </>
            )}
          </div>
          <div className="flex gap-2">
            {effectiveTariff ? (
              <button
                onClick={() => openEditModal(effectiveTariff)}
                className="bg-[rgba(29,158,117,0.14)] border border-[rgba(29,158,117,0.28)] text-[#9be5c9] font-syne font-bold px-6 py-3.5 rounded-xl hover:bg-[rgba(29,158,117,0.24)] transition-all hover:-translate-y-0.5 text-sm"
              >
                Edit Active Tariff
              </button>
            ) : null}
            <button
              onClick={openCreateModal}
              className="bg-[#1D9E75] text-[#020f1a] font-syne font-bold px-8 py-3.5 rounded-xl hover:bg-[#5DCAA5] transition-all hover:-translate-y-0.5 text-sm"
            >
              + Create New Tariff
            </button>
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {CUSTOMER_TARIFF_TYPES.map((type) => {
          const isActive = selectedTariffType === type.value;
          return (
            <button
              key={type.value}
              type="button"
              onClick={() => setSelectedTariffType(type.value)}
              className={`rounded-full px-4 py-2 text-[11px] font-semibold tracking-wide transition-colors ${
                isActive
                  ? "bg-[#1D9E75] text-[#020f1a]"
                  : "border border-[rgba(29,158,117,0.22)] text-[#9be5c9] hover:bg-[rgba(29,158,117,0.12)]"
              }`}
            >
              {type.label}
            </button>
          );
        })}
      </div>

      {/* Tariff History */}
      <div className="bg-[#05141f] border border-[rgba(29,158,117,0.08)] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[rgba(29,158,117,0.08)]">
          <h2 className="font-syne font-bold text-sm tracking-tight">
            {customerTypeLabel(selectedTariffType)} Tariff History
          </h2>
          <p className="text-[10px] text-[rgba(232,244,240,0.3)] mt-0.5">
            {sortedTariffs.length} tariffs set
          </p>
        </div>
        <div className="px-6 py-4 overflow-x-auto">
          {loading && !tariffs.length ? (
            <p className="text-xs text-[rgba(232,244,240,0.5)]">
              Loading tariffs...
            </p>
          ) : (
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-[rgba(29,158,117,0.06)]">
                  {[
                    "Name",
                    "Type",
                    "Tiers",
                    "Effective From",
                    "Set On",
                    "Status",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left text-[rgba(232,244,240,0.3)] font-medium pb-3 pr-4 uppercase tracking-wider text-[10px]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedTariffs.map((t) => {
                  const isActive = effectiveTariff?.id === t.id;
                  const isFuture = new Date(t.effectiveFrom) > new Date();
                  return (
                    <tr
                      key={t.id}
                      className="border-b border-[rgba(29,158,117,0.04)] hover:bg-[rgba(29,158,117,0.03)] transition-colors"
                    >
                      <td className="py-3 pr-4 text-[rgba(232,244,240,0.75)]">
                        {t.name || `Tariff v${t.version}`}
                      </td>
                      <td className="py-3 pr-4 text-[rgba(232,244,240,0.55)]">
                        {customerTypeLabel(t.customerType)}
                      </td>
                      <td className="py-3 pr-4 text-[rgba(232,244,240,0.55)]">
                        <div className="flex flex-col gap-1">
                          {(t.blocks || []).slice(0, 2).map((block) => (
                            <span
                              key={block.id || `${block.fromM3}-${block.toM3}`}
                            >
                              {formatRange(block)} @{" "}
                              {Number(block.pricePerM3).toFixed(2)}
                            </span>
                          ))}
                          {(t.blocks || []).length > 2 ? (
                            <span className="text-[10px] text-[rgba(232,244,240,0.35)]">
                              +{t.blocks.length - 2} more tier(s)
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-[rgba(232,244,240,0.6)]">
                        {new Date(t.effectiveFrom).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 pr-4 text-[rgba(232,244,240,0.4)]">
                        {new Date(t.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3">
                        {isActive ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] bg-[rgba(29,158,117,0.12)] text-[#1D9E75] font-medium">
                            Active
                          </span>
                        ) : isFuture ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] bg-[rgba(239,159,39,0.12)] text-[#EF9F27]">
                            Scheduled
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] bg-[rgba(232,244,240,0.05)] text-[rgba(232,244,240,0.3)]">
                            Expired
                          </span>
                        )}
                      </td>
                      <td className="py-3">
                        <button
                          type="button"
                          onClick={() => openEditModal(t)}
                          className="px-2.5 py-1 rounded-full text-[10px] border border-[rgba(29,158,117,0.24)] text-[#9be5c9] hover:bg-[rgba(29,158,117,0.12)] transition-colors"
                        >
                          Edit tiers
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Set Tariff Modal */}
      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          reset(toFormTariff(null));
          setFormError("");
          setIsEditing(false);
        }}
        title={isEditing ? "Update Tariff Tiers" : "Create Tiered Tariff"}
        fullPage
      >
        <p className="text-xs text-[rgba(232,244,240,0.4)] font-light mb-5 leading-relaxed">
          Configure tier ranges and ETB per m3 for the selected customer type.
          You can add new ranges, remove ranges, or replace all tiers for a new
          tariff version.
        </p>
        {formError ? (
          <div className="mb-4 text-xs text-[#f09595] bg-[rgba(240,149,149,0.12)] border border-[rgba(240,149,149,0.35)] rounded-lg px-3 py-2">
            {formError}
          </div>
        ) : null}
        <form onSubmit={handleSubmit(onSubmit)}>
          <input type="hidden" {...register("id")} />
          <FormField label="Tariff name" error={errors.name?.message}>
            <Input
              placeholder="e.g. Tiered Tariff 2026"
              error={errors.name}
              {...register("name")}
            />
          </FormField>
          <FormField label="Customer type" error={errors.customerType?.message}>
            <select
              className="w-full rounded-xl border border-[rgba(29,158,117,0.16)] bg-[#071621] px-4 py-3 text-sm text-[#e8f4f0] outline-none transition focus:border-[#1D9E75]"
              {...register("customerType", {
                required: "Customer type is required.",
              })}
            >
              {CUSTOMER_TARIFF_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </FormField>
          <FormField
            label="Effective from"
            error={errors.effectiveFrom?.message}
          >
            <Input
              type="datetime-local"
              error={errors.effectiveFrom}
              {...register("effectiveFrom", {
                required: "Effective date is required.",
              })}
            />
          </FormField>
          <FormField
            label="Late penalty rate (%)"
            error={errors.latePenaltyPerDayPercent?.message}
          >
            <Input
              type="number"
              min={0}
              step="0.01"
              error={errors.latePenaltyPerDayPercent}
              {...register("latePenaltyPerDayPercent", {
                valueAsNumber: true,
                min: { value: 0, message: "Must be >= 0" },
              })}
            />
          </FormField>

          <div className="mb-4 border border-[rgba(29,158,117,0.16)] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[rgba(29,158,117,0.1)] bg-[rgba(29,158,117,0.05)] flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-widest text-[rgba(232,244,240,0.55)]">
                Tier Ranges
              </p>
              <button
                type="button"
                onClick={addTierRow}
                className="text-[10px] px-2.5 py-1 rounded-full border border-[rgba(29,158,117,0.26)] text-[#9be5c9] hover:bg-[rgba(29,158,117,0.12)] transition-colors"
              >
                + Add range
              </button>
            </div>

            <div className="px-4 py-3 space-y-3">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end"
                >
                  <FormField
                    label={`From m3 (Tier ${index + 1})`}
                    error={errors.blocks?.[index]?.fromM3?.message}
                  >
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      error={errors.blocks?.[index]?.fromM3}
                      {...register(`blocks.${index}.fromM3`, {
                        required: "Required",
                        valueAsNumber: true,
                        min: { value: 0, message: "Must be >= 0" },
                      })}
                    />
                  </FormField>

                  <FormField
                    label="To m3 (leave blank for open end)"
                    error={errors.blocks?.[index]?.toM3?.message}
                  >
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      error={errors.blocks?.[index]?.toM3}
                      {...register(`blocks.${index}.toM3`, {
                        setValueAs: (value) =>
                          value === "" ? "" : Number(value),
                        validate: (value) => {
                          if (
                            value === "" ||
                            value === null ||
                            value === undefined
                          ) {
                            return true;
                          }
                          const from = Number(
                            getValues(`blocks.${index}.fromM3`),
                          );
                          return Number(value) >= from || "Must be >= from m3";
                        },
                      })}
                    />
                  </FormField>

                  <FormField
                    label="Price (ETB / m3)"
                    error={errors.blocks?.[index]?.pricePerM3?.message}
                  >
                    <Input
                      type="number"
                      min={0.01}
                      step="0.01"
                      error={errors.blocks?.[index]?.pricePerM3}
                      {...register(`blocks.${index}.pricePerM3`, {
                        required: "Required",
                        valueAsNumber: true,
                        min: { value: 0.01, message: "Must be > 0" },
                      })}
                    />
                  </FormField>

                  <button
                    type="button"
                    disabled={fields.length <= 1}
                    onClick={() => remove(index)}
                    className="mb-4 px-2.5 py-2 rounded-lg text-[11px] border border-[rgba(240,149,149,0.35)] text-[#f6b3b3] hover:bg-[rgba(240,149,149,0.12)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[rgba(239,159,39,0.08)] border border-[rgba(239,159,39,0.2)] rounded-xl p-3 mb-5">
            <p className="text-[10px] text-[#EF9F27] leading-relaxed">
              Setting a tariff with a past date will activate it immediately and
              close the current active tariff.
            </p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1D9E75] text-[#020f1a] font-syne font-bold py-3 rounded-xl hover:bg-[#5DCAA5] transition-all disabled:opacity-60 disabled:cursor-not-allowed text-sm"
          >
            {loading
              ? isEditing
                ? "Updating Tariff..."
                : "Creating Tariff..."
              : isEditing
                ? "Update Tariff"
                : "Create Tariff"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
