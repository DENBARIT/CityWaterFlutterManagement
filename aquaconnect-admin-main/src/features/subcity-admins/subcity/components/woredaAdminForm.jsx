"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

export default function WoredaAdminForm({
  onSubmit,
  defaultValues,
  loading,
  woredas = [],
}) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm();

  const passwordValue = watch("password") || "";

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

  useEffect(() => {
    defaultValues
      ? reset({
          fullName: defaultValues.fullName,
          email: defaultValues.email,
          phoneNumber: defaultValues.phoneE164,
          nationalId: defaultValues.nationalId,
          woredaId: defaultValues.woreda?.id,
          password: "",
        })
      : reset({
          fullName: "",
          email: "",
          phoneNumber: "",
          nationalId: "",
          woredaId: "",
          password: "",
        });
  }, [defaultValues, reset]);

  const normalizePhoneInput = (value) => {
    if (!value) {
      return "";
    }

    const digitsOnly = value.replace(/\D/g, "");
    const localDigits = digitsOnly.startsWith("251")
      ? digitsOnly.slice(3)
      : digitsOnly;
    return `+251${localDigits}`.slice(0, 13);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormField label="Full name" error={errors.fullName?.message}>
        <Input
          placeholder="e.g. Biruk Alemu"
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
          placeholder="admin@aquaconnect.com"
          error={errors.email}
          {...register("email", {
            required: "Email is required.",
            pattern: { value: /\S+@\S+\.\S+/, message: "Enter a valid email." },
          })}
        />
      </FormField>

      <FormField label="Phone number" error={errors.phoneNumber?.message}>
        <Input
          placeholder="+251XXXXXXXXX"
          maxLength={13}
          error={errors.phoneNumber}
          {...register("phoneNumber", {
            required: "Phone number is required.",
            onChange: (e) => {
              const normalized = normalizePhoneInput(e.target.value);
              setValue("phoneNumber", normalized, {
                shouldDirty: true,
                shouldValidate: true,
              });
            },
            onBlur: (e) => {
              const normalized = normalizePhoneInput(e.target.value);
              setValue("phoneNumber", normalized, {
                shouldDirty: true,
                shouldValidate: true,
              });
            },
            pattern: {
              value: /^\+251\d{9}$/,
              message: "Must start with +251 and be 13 characters.",
            },
          })}
          onFocus={(e) => {
            if (!e.target.value) {
              setValue("phoneNumber", "+251", {
                shouldDirty: true,
                shouldValidate: true,
              });
            }
          }}
        />
      </FormField>

      <FormField label="National ID" error={errors.nationalId?.message}>
        <Input
          placeholder="12 character ID"
          maxLength={12}
          error={errors.nationalId}
          {...register("nationalId", {
            required: "National ID is required.",
            validate: (v) =>
              v.length === 12 || "Must be exactly 12 characters.",
          })}
        />
      </FormField>

      {!defaultValues && (
        <FormField label="Password" error={errors.password?.message}>
          <>
            <Input
              type="password"
              autoComplete="new-password"
              placeholder="Min 8 chars, uppercase, number, special"
              error={errors.password}
              {...register("password", {
                required: "Password is required.",
                minLength: { value: 8, message: "At least 8 characters." },
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
              <div className="flex items-center justify-between text-[10px] text-[rgba(232,244,240,0.45)] mb-1">
                <span>Password strength</span>
                <span className="font-medium text-[rgba(232,244,240,0.7)]">
                  {passwordStrength.label}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-[rgba(232,244,240,0.08)] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${passwordStrength.color}`}
                  style={{ width: `${passwordStrength.percent}%` }}
                />
              </div>
            </div>
          </>
        </FormField>
      )}

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

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#1D9E75] text-[#020f1a] font-syne font-bold py-3 rounded-xl hover:bg-[#5DCAA5] transition-all disabled:opacity-60 text-sm mt-2"
      >
        {loading
          ? "Saving..."
          : defaultValues
            ? "Update Admin"
            : "Create Admin"}
      </button>
    </form>
  );
}
