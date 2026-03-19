"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import {
  OFFICER_TYPE_OPTIONS,
  getOfficerTypeSelectLabel,
} from "@/features/woreda/constants/officerTypes";

const EMPTY_FORM_VALUES = {
  fullName: "",
  email: "",
  phoneNumber: "",
  nationalId: "",
  fieldOfficerType: "",
  password: "",
};

export default function OfficerForm({
  onSubmit,
  defaultValues,
  loading,
  typeOptions = OFFICER_TYPE_OPTIONS,
  strictValidation = false,
  onValidationError,
}) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: EMPTY_FORM_VALUES,
    shouldUnregister: true,
  });

  const isEditMode = Boolean(defaultValues?.id);

  const normalizePhoneInput = (rawValue) => {
    const source = String(rawValue || "");
    const digits = source.replace(/\D/g, "");
    const rest = digits.startsWith("251") ? digits.slice(3) : digits;

    return `+251${rest}`.slice(0, 13);
  };

  const normalizeNationalId = (rawValue) => {
    return String(rawValue || "")
      .replace(/\D/g, "")
      .slice(0, 12);
  };

  useEffect(() => {
    const nextValues = defaultValues
      ? {
          fullName: defaultValues.fullName ?? "",
          email: defaultValues.email ?? "",
          phoneNumber: defaultValues.phoneE164 ?? "+251",
          nationalId: defaultValues.nationalId ?? "",
          fieldOfficerType: defaultValues.fieldOfficerType ?? "",
          password: "",
        }
      : { ...EMPTY_FORM_VALUES, phoneNumber: "+251" };

    reset(nextValues);
  }, [defaultValues, reset]);

  useEffect(() => {
    if (typeof onValidationError === "function" && Object.keys(errors).length) {
      onValidationError(errors);
    }
  }, [errors, onValidationError]);

  const passwordValue = watch("password", "");

  const passwordStrength = useMemo(() => {
    if (isEditMode) {
      return { score: 0, percent: 0, label: "", colorClass: "" };
    }

    let score = 0;
    if (passwordValue.length >= 8) score += 1;
    if (/[A-Z]/.test(passwordValue) && /[a-z]/.test(passwordValue)) score += 1;
    if (/[0-9]/.test(passwordValue)) score += 1;
    if (/[!@#$%^&*]/.test(passwordValue)) score += 1;

    const percent = score === 0 ? 0 : Math.round((score / 4) * 100);

    if (score <= 1) {
      return {
        score,
        percent,
        label: "Weak",
        colorClass: "bg-[#b83a3a]",
      };
    }

    if (score <= 2) {
      return {
        score,
        percent,
        label: "Fair",
        colorClass: "bg-[#d88a2b]",
      };
    }

    if (score <= 3) {
      return {
        score,
        percent,
        label: "Good",
        colorClass: "bg-[#a8cc3a]",
      };
    }

    return {
      score,
      percent,
      label: "Strong",
      colorClass: "bg-[#1D9E75]",
    };
  }, [isEditMode, passwordValue]);

  const submitForm = (data) => {
    return onSubmit({
      ...data,
      phoneNumber: data.phoneNumber?.trim() || "",
    });
  };

  return (
    <form onSubmit={handleSubmit(submitForm)}>
      <FormField label="Full name" error={errors.fullName?.message}>
        <Input
          autoComplete="off"
          placeholder="Abebe Kebede"
          error={errors.fullName}
          {...register("fullName", {
            required: "Full name is required.",
            validate: (v) =>
              v.trim().split(/\s+/).length >= 2 ||
              "Include first and last name.",
          })}
        />
      </FormField>

      <FormField label="Email address" error={errors.email?.message}>
        <Input
          type="email"
          autoComplete="off"
          placeholder="abebe@company.com"
          error={errors.email}
          {...register("email", {
            required: "Email is required.",
            pattern: strictValidation
              ? {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.com$/i,
                  message: "Email must end with .com.",
                }
              : {
                  value: /\S+@\S+\.\S+/,
                  message: "Enter a valid email.",
                },
          })}
        />
      </FormField>

      <FormField label="Phone number" error={errors.phoneNumber?.message}>
        <Input
          autoComplete="off"
          placeholder="+251912345678"
          maxLength={13}
          error={errors.phoneNumber}
          {...register("phoneNumber", {
            required: "Phone number is required.",
            onChange: (event) => {
              const normalized = normalizePhoneInput(event.target.value);
              setValue("phoneNumber", normalized, { shouldValidate: true });
            },
            pattern: {
              value: /^\+251\d{9}$/,
              message:
                "Phone number must start with +251 and be 13 characters.",
            },
          })}
        />
      </FormField>

      <FormField label="National ID" error={errors.nationalId?.message}>
        <Input
          autoComplete="off"
          placeholder="123456789012"
          maxLength={12}
          error={errors.nationalId}
          {...register("nationalId", {
            required: "National ID is required.",
            onChange: (event) => {
              const normalized = normalizeNationalId(event.target.value);
              setValue("nationalId", normalized, { shouldValidate: true });
            },
            pattern: {
              value: /^\d{12}$/,
              message: "National ID must be exactly 12 digits.",
            },
          })}
        />
      </FormField>

      {!isEditMode && (
        <FormField label="Password" error={errors.password?.message}>
          <Input
            type="password"
            autoComplete="new-password"
            placeholder="Abc@1234"
            error={errors.password}
            {...register("password", {
              required: "Password is required.",
              minLength: {
                value: 8,
                message: "Password must be at least 8 characters.",
              },
              validate: {
                upper: (v) => /[A-Z]/.test(v) || "Must contain uppercase.",
                lower: (v) => /[a-z]/.test(v) || "Must contain lowercase.",
                number: (v) => /[0-9]/.test(v) || "Must contain a number.",
                special: (v) =>
                  /[!@#$%^&*]/.test(v) || "Must contain a special character.",
              },
            })}
          />

          {passwordValue ? (
            <div className="mt-2">
              <div className="h-1.5 w-full rounded-full bg-[rgba(232,244,240,0.1)] overflow-hidden">
                <div
                  className={`h-full transition-all ${passwordStrength.colorClass}`}
                  style={{ width: `${passwordStrength.percent}%` }}
                />
              </div>
              <p className="mt-1 text-[10px] text-[rgba(232,244,240,0.5)]">
                Strength: {passwordStrength.label}
              </p>
            </div>
          ) : null}
        </FormField>
      )}

      <FormField label="Officer type" error={errors.fieldOfficerType?.message}>
        <Select
          error={errors.fieldOfficerType}
          {...register("fieldOfficerType", {
            required: "Please select an officer type.",
          })}
        >
          <option value="">Select type</option>
          {typeOptions.map((typeOption) => (
            <option key={typeOption.value} value={typeOption.value}>
              {getOfficerTypeSelectLabel(typeOption.value)}
            </option>
          ))}
        </Select>
      </FormField>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#1D9E75] text-[#020f1a] font-syne font-bold py-3 rounded-xl hover:bg-[#5DCAA5] transition-all disabled:opacity-60 text-sm mt-2"
      >
        {loading
          ? "Saving..."
          : isEditMode
            ? "Update Officer"
            : "Create Officer"}
      </button>
    </form>
  );
}
