"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

export default function SubcityAdminForm({
  onSubmit,
  defaultValues,
  loading,
  subcities = [],
  onValidationError,
}) {
  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    reset,
    formState: { errors },
  } = useForm();
  const [passwordValue, setPasswordValue] = useState("");

  const passwordChecks = [
    {
      label: "8 characters",
      ok: passwordValue.length >= 8,
    },
    {
      label: "Uppercase letter",
      ok: /[A-Z]/.test(passwordValue),
    },
    {
      label: "Lowercase letter",
      ok: /[a-z]/.test(passwordValue),
    },
    {
      label: "Number",
      ok: /\d/.test(passwordValue),
    },
    {
      label: "Special character",
      ok: /[^A-Za-z0-9]/.test(passwordValue),
    },
  ];

  const getPasswordStrength = (password) => {
    if (!password) {
      return { label: "Weak", percent: 0, color: "bg-[rgba(226,75,74,0.35)]" };
    }

    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 1) {
      return { label: "Weak", percent: 33, color: "bg-[#E24B4A]" };
    }

    if (score <= 3) {
      return { label: "Medium", percent: 66, color: "bg-[#f59e0b]" };
    }

    return { label: "Strong", percent: 100, color: "bg-[#1D9E75]" };
  };

  const passwordStrength = getPasswordStrength(passwordValue);

  const normalizePhoneE164 = (rawValue) => {
    const value = String(rawValue || "").replace(/[^\d+]/g, "");

    if (value.startsWith("+251")) {
      return `+251${value.slice(4).replace(/\D/g, "").slice(0, 9)}`;
    }

    if (value.startsWith("251")) {
      return `+251${value.slice(3).replace(/\D/g, "").slice(0, 9)}`;
    }

    const localDigits = value.replace(/\D/g, "").replace(/^0+/, "");
    return `+251${localDigits.slice(0, 9)}`;
  };

  const normalizeNationalId = (rawValue) =>
    String(rawValue || "")
      .replace(/\D/g, "")
      .slice(0, 12);

  useEffect(() => {
    if (defaultValues) {
      reset({
        fullName: defaultValues.fullName,
        email: defaultValues.email,
        phoneNumber: defaultValues.phoneE164,
        nationalId: defaultValues.nationalId,
        subcityId: defaultValues.subCity?.id,
      });
    } else {
      reset({});
    }
  }, [defaultValues, reset]);

  return (
    <form
      autoComplete="off"
      onSubmit={handleSubmit(onSubmit, onValidationError)}
    >
      <FormField label="Full name" error={errors.fullName?.message}>
        <Input
          placeholder="e.g. Selam Girma"
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
          placeholder="admin@aquaconnect.com"
          autoComplete="off"
          error={errors.email}
          {...register("email", {
            required: "Email is required.",
            pattern: { value: /\S+@\S+\.\S+/, message: "Enter a valid email." },
            onChange: (event) => {
              const sanitized = String(event?.target?.value || "").replace(
                /\s+/g,
                "",
              );
              setValue("email", sanitized, { shouldValidate: true });
            },
          })}
        />
      </FormField>

      <FormField label="Phone number" error={errors.phoneNumber?.message}>
        <Input
          placeholder="+251912345678"
          error={errors.phoneNumber}
          {...register("phoneNumber", {
            required: "Phone number is required.",
            pattern: {
              value: /^\+251(?:9\d{8}|7\d{8}|11\d{7})$/,
              message:
                "Must start with +251 followed by 9, 7, or 11 and be 13 digits.",
            },
            onChange: (event) => {
              setValue(
                "phoneNumber",
                normalizePhoneE164(event?.target?.value),
                {
                  shouldValidate: true,
                },
              );
            },
          })}
        />
      </FormField>

      <FormField label="National ID" error={errors.nationalId?.message}>
        <Input
          placeholder="12 character ID"
          error={errors.nationalId}
          {...register("nationalId", {
            required: "National ID is required.",
            pattern: {
              value: /^\d{12}$/,
              message: "National ID must be exactly 12 digits.",
            },
            onChange: (event) => {
              setValue(
                "nationalId",
                normalizeNationalId(event?.target?.value),
                {
                  shouldValidate: true,
                },
              );
            },
          })}
        />
      </FormField>

      {!defaultValues && (
        <>
          <FormField label="Password" error={errors.password?.message}>
            <Input
              type="password"
              placeholder="Min 8 chars, uppercase, number, special"
              autoComplete="new-password"
              error={errors.password}
              {...register("password", {
                required: "Password is required.",
                minLength: { value: 8, message: "At least 8 characters." },
                onChange: (event) => {
                  const sanitized = String(event?.target?.value || "").replace(
                    /\s+/g,
                    "",
                  );
                  setValue("password", sanitized, { shouldValidate: true });
                  setPasswordValue(sanitized);
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
            <div className="mt-2">
              <div className="h-1.5 w-full rounded-full bg-[rgba(232,244,240,0.12)] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${passwordStrength.color}`}
                  style={{ width: `${passwordStrength.percent}%` }}
                />
              </div>
              <p className="mt-1 text-[10px] text-[rgba(232,244,240,0.55)]">
                Password strength: {passwordStrength.label}
              </p>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                {passwordChecks.map((rule) => (
                  <p
                    key={rule.label}
                    className={`text-[10px] ${
                      rule.ok
                        ? "text-[#7ce4be]"
                        : "text-[rgba(232,244,240,0.45)]"
                    }`}
                  >
                    {rule.ok ? "✓" : "•"} {rule.label}
                  </p>
                ))}
              </div>
            </div>
          </FormField>

          <FormField
            label="Confirm password"
            error={errors.confirmPassword?.message}
          >
            <Input
              type="password"
              placeholder="Re-enter password"
              autoComplete="new-password"
              error={errors.confirmPassword}
              {...register("confirmPassword", {
                required: "Please confirm the password.",
                validate: (value) =>
                  value === getValues("password") || "Passwords do not match.",
              })}
            />
          </FormField>
        </>
      )}

      <FormField label="Subcity" error={errors.subcityId?.message}>
        <Select
          error={errors.subcityId}
          {...register("subcityId", { required: "Please select a subcity." })}
        >
          <option value="">Select subcity</option>
          {subcities.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      </FormField>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#1D9E75] text-[#020f1a] font-syne font-bold py-3 rounded-xl
          hover:bg-[#5DCAA5] transition-all disabled:opacity-60 disabled:cursor-not-allowed text-sm mt-2"
      >
        {loading
          ? defaultValues
            ? "Updating..."
            : "Creating..."
          : defaultValues
            ? "Update Admin"
            : "Create Admin"}
      </button>
    </form>
  );
}
