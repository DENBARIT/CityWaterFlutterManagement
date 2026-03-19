"use client";

import { usePathname, useRouter } from "next/navigation";

export default function Topbar({ pageMeta = {}, onAction }) {
  const router = useRouter();
  const pathname = usePathname();
  const meta = pageMeta[pathname] ?? {
    title: "Dashboard",
    sub: "",
    action: "",
  };

  const handleAction = () => {
    if (typeof onAction === "function") {
      onAction();
      return;
    }

    // Fallback actions so the topbar button is not a dead control.
    if (meta.action === "+ Add Admin" || meta.action === "+ Add Super Admin") {
      router.push("/dashboard/super-admins?create=1");
      return;
    }

    if (meta.action === "+ Add Subcity Admin") {
      router.push("/dashboard/subcity-admins?create=1");
      return;
    }

    if (meta.action === "+ Set Tariff") {
      router.push("/dashboard/tariff");
      return;
    }

    if (meta.action === "+ Add Subcity") {
      if (
        pathname === "/dashboard/subcities" &&
        typeof window !== "undefined"
      ) {
        window.dispatchEvent(new CustomEvent("dashboard:open-add-subcity"));
        return;
      }
      router.push("/dashboard/subcities?create=1");
      return;
    }

    if (meta.action === "+ Add Woreda") {
      router.push("/dashboard/woredas?create=1");
      return;
    }

    if (meta.action === "+ Add Woreda Admin") {
      if (
        pathname === "/subcity/woreda-admins" &&
        typeof window !== "undefined"
      ) {
        window.dispatchEvent(
          new CustomEvent("subcity:woreda-admins-open-create"),
        );
        return;
      }
      router.push("/subcity/woreda-admins");
      return;
    }

    if (meta.action === "+ Add Billing Officer") {
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("subcity:billing-officers-open-create"),
        );
      }
      return;
    }

    if (meta.action === "+ Add Complaint Officer") {
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("subcity:complaint-officers-open-create"),
        );
      }
      return;
    }

    if (meta.action === "+ Add Schedule") {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("subcity:schedules-open-create"));
      }
      return;
    }

    if (meta.action === "+ Add Officer") {
      if (typeof window !== "undefined") {
        if (pathname === "/woreda/officers") {
          window.dispatchEvent(new CustomEvent("woreda:officers-open-create"));
          return;
        }

        if (pathname === "/woreda/officers/billing") {
          window.dispatchEvent(
            new CustomEvent("woreda:billing-officers-open-create"),
          );
          return;
        }

        if (pathname === "/woreda/officers/complaint") {
          window.dispatchEvent(
            new CustomEvent("woreda:complaint-officers-open-create"),
          );
          return;
        }
      }
      router.push("/woreda/officers");
    }
  };

  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-[rgba(29,158,117,0.08)] shrink-0 bg-[#020f1a]">
      <div>
        <h1 className="font-syne font-bold text-sm tracking-tight">
          {meta.title}
        </h1>
        <p className="text-[10px] text-[rgba(232,244,240,0.3)] mt-0.5">
          {meta.sub}
        </p>
      </div>
      <div className="flex items-center gap-3">
        {meta.action && (
          <button
            onClick={handleAction}
            className="rounded-lg px-4 py-1.5 text-xs font-semibold text-[#03121c] bg-[#1D9E75] border border-[#1D9E75] hover:bg-[#5DCAA5] hover:border-[#5DCAA5] active:scale-[0.98] transition-all"
          >
            {meta.action}
          </button>
        )}
        <div className="relative group">
          <div className="w-2 h-2 rounded-full bg-[#1D9E75]" />
          <span className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 whitespace-nowrap rounded-md border border-[rgba(29,158,117,0.35)] bg-[#05141f] px-2 py-1 text-[10px] text-[#9be5c9] opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100">
            Active
          </span>
        </div>
      </div>
    </header>
  );
}
