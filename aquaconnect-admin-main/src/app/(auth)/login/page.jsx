"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLogin } from "@/features/auth/hooks/useLogin";
import { superAdminService } from "@/features/super-admin/services/superAdmin.service";
import dynamic from "next/dynamic";

const LoginForm = dynamic(
  () => import("@/features/auth/components/LoginForm"),
  { ssr: false },
);

const METRIC_CONFIG = [
  {
    key: "meters",
    durationMs: 1200,
    formatter: (value) => `${Math.round(value).toLocaleString()}+`,
    label: "Meters monitored",
  },
  {
    key: "users",
    durationMs: 1500,
    formatter: (value) => `${Math.round(value).toLocaleString()}+`,
    label: "Registered users",
  },
  {
    key: "subcities",
    durationMs: 1200,
    formatter: (value) => `${Math.round(value)}`,
    label: "Sub-cities covered",
  },
  {
    key: "monitoring",
    durationMs: 1300,
    formatter: (value) => `${Math.round(value)} active`,
    label: "Monitoring active",
  },
];

const DEFAULT_TARGETS = {
  meters: 0,
  users: 0,
  subcities: 0,
  monitoring: 0,
};

export default function LoginPage() {
  const searchParams = useSearchParams();
  const { error, unverifiedEmail, submitLogin } = useLogin();
  const router = useRouter();
  const showVerifiedToast = searchParams.get("verified") === "1";
  const [metricTargets, setMetricTargets] = useState(DEFAULT_TARGETS);
  const [metricValues, setMetricValues] = useState(DEFAULT_TARGETS);
  const metricValuesRef = useRef(DEFAULT_TARGETS);

  useEffect(() => {
    metricValuesRef.current = metricValues;
  }, [metricValues]);

  useEffect(() => {
    let stopped = false;
    let stream;

    const toTargets = (payload) => ({
      meters: Number(payload?.metersCount || 0),
      users: Number(payload?.usersCount || 0),
      subcities: Number(payload?.subCitiesCount || 0),
      monitoring: Number(payload?.monitoringActiveCount || 0),
    });

    const fetchStats = async () => {
      try {
        const payload = await superAdminService.getPublicStats({
          t: Date.now(),
        });

        if (stopped) {
          return;
        }

        setMetricTargets(toTargets(payload));
      } catch (_err) {
        // Keep the last known values when API is temporarily unreachable.
      }
    };

    const baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001";
    const streamUrl = `${baseUrl}/super-admin/public-stats/stream`;

    const startStream = () => {
      if (typeof window === "undefined" || typeof EventSource === "undefined") {
        return;
      }

      stream = new EventSource(streamUrl);

      stream.addEventListener("stats", (event) => {
        if (stopped) {
          return;
        }

        try {
          const payload = JSON.parse(event.data || "{}");
          setMetricTargets(toTargets(payload));
        } catch (_err) {
          // Ignore malformed event payloads.
        }
      });

      stream.onerror = () => {
        // EventSource will automatically reconnect; fetch once as fallback.
        fetchStats();
      };
    };

    fetchStats();
    startStream();

    return () => {
      stopped = true;
      if (stream) {
        stream.close();
      }
    };
  }, []);

  useEffect(() => {
    const startValues = { ...metricValuesRef.current };
    const startedAt = performance.now();
    let animationFrame = 0;

    const tick = (now) => {
      const elapsed = now - startedAt;
      const nextValues = {};
      let isDone = true;

      METRIC_CONFIG.forEach((metric) => {
        const from = Number(startValues[metric.key] || 0);
        const to = Number(metricTargets[metric.key] || 0);
        const progress = Math.min(elapsed / metric.durationMs, 1);
        nextValues[metric.key] = from + (to - from) * progress;
        if (progress < 1) {
          isDone = false;
        }
      });

      setMetricValues(nextValues);

      if (!isDone) {
        animationFrame = requestAnimationFrame(tick);
      }
    };

    animationFrame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [metricTargets]);

  const handleSubmit = async (formData) => {
    const result = await submitLogin(formData);
    if (result?.requiresEmailVerification && result?.email) {
      router.replace(`/verify-email?email=${encodeURIComponent(result.email)}`);
      return;
    }
    if (result.ok) {
      router.replace(result?.redirectPath || "/dashboard");
    }
  };

  return (
    <main className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-[#020f1a] text-[#e8f4f0]">
      <Link
        href="/"
        className="absolute top-5 right-5 z-20 inline-flex items-center gap-2 rounded-full border border-[rgba(29,158,117,0.24)] bg-[rgba(2,15,26,0.7)] px-3.5 py-1.5 text-xs text-[#5DCAA5] hover:text-[#e8f4f0] hover:border-[rgba(29,158,117,0.45)] transition-colors"
      >
        <span aria-hidden="true">←</span>
        Back to Home
      </Link>

      {/* LEFT PANEL */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_30%_40%,rgba(29,158,117,0.12),transparent)]" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(29,158,117,0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(29,158,117,0.05) 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />

        {/* Logo */}
        <Link
          href="/"
          className="relative font-syne font-extrabold text-xl text-[#1D9E75] hover:opacity-80 transition-opacity w-fit"
        >
          Aqua<span className="text-[#e8f4f0]">Connect</span>
        </Link>

        {/* Main */}
        <div className="relative flex-1 flex flex-col justify-center">
          <div className="inline-flex items-center gap-2 bg-[rgba(29,158,117,0.1)] border border-[rgba(29,158,117,0.2)] rounded-full px-4 py-1.5 text-xs text-[#5DCAA5] mb-8 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1D9E75] animate-pulse" />
            Admin Portal
          </div>
          <h2 className="font-syne text-5xl font-extrabold leading-tight tracking-tighter mb-5">
            Control every
            <br />
            drop of your
            <br />
            <em className="not-italic text-[#1D9E75]">water network</em>
          </h2>
          <p className="text-sm text-[rgba(232,244,240,0.45)] leading-relaxed max-w-sm mb-12 font-light">
            Full operational visibility across sub-cities, woredas, meters, and
            billing — all from one place.
          </p>
          <div className="grid grid-cols-2 divide-x divide-y divide-[rgba(29,158,117,0.08)] border border-[rgba(29,158,117,0.08)] rounded-2xl overflow-hidden max-w-sm">
            {METRIC_CONFIG.map((metric) => (
              <div key={metric.key} className="bg-[#020f1a] p-5">
                <div className="font-syne text-2xl font-bold text-[#1D9E75] tracking-tight">
                  {metric.formatter(metricValues[metric.key] || 0)}
                </div>
                <div className="text-xs text-[rgba(232,244,240,0.35)] mt-1">
                  {metric.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative text-xs text-[rgba(232,244,240,0.2)]">
          © 2026 AquaConnect. All rights reserved.
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="bg-[#05141f] border-l border-[rgba(29,158,117,0.08)] flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md">
          {showVerifiedToast ? (
            <p className="mb-4 text-xs text-[#9be5c9] bg-[rgba(29,158,117,0.12)] border border-[rgba(29,158,117,0.35)] rounded-lg px-3 py-2">
              Email verified. Please sign in.
            </p>
          ) : null}
          {error ? (
            <div className="mb-4 space-y-2">
              <p className="text-xs text-[#f09595] bg-[rgba(240,149,149,0.1)] border border-[rgba(240,149,149,0.35)] rounded-lg px-3 py-2">
                {error}
              </p>
              {unverifiedEmail ? (
                <Link
                  href={`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`}
                  className="inline-flex text-xs text-[#1D9E75] hover:text-[#5DCAA5] transition-colors"
                >
                  Verify this email now
                </Link>
              ) : null}
            </div>
          ) : null}
          <LoginForm onSubmit={handleSubmit} />
        </div>
      </div>
    </main>
  );
}
