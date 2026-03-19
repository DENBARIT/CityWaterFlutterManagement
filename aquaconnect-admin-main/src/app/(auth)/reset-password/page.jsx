import Link from "next/link";
import ResetPasswordForm from "@/features/auth/components/ResetPasswordForm";

export default function ResetPasswordPage({ searchParams }) {
  const initialEmail =
    typeof searchParams?.email === "string" ? searchParams.email : "";

  return (
    <main className="min-h-screen bg-[#020f1a] text-[#e8f4f0] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_40%,rgba(29,158,117,0.07),transparent)]" />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(29,158,117,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(29,158,117,0.04) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }}
      />
      <div className="relative w-full max-w-md">
        <Link
          href="/"
          className="block font-syne font-extrabold text-xl text-[#1D9E75] mb-12 hover:opacity-80 transition-opacity w-fit"
        >
          Aqua<span className="text-[#e8f4f0]">Connect</span>
        </Link>
        <ResetPasswordForm initialEmail={initialEmail} />
      </div>
    </main>
  );
}
