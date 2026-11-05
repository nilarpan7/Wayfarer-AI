import Link from "next/link";
import { Plane } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden">
      {/* Background Mesh Gradient */}
      <div className="absolute inset-0 mesh-gradient" />
      <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[140px] animate-float" />
      <div className="absolute bottom-1/3 right-1/3 w-[400px] h-[400px] rounded-full bg-violet-500/10 blur-[120px] animate-float" style={{ animationDelay: "3s" }} />

      {/* Header Logo */}
      <div className="relative z-10 mb-8">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25 transition-transform duration-300 group-hover:scale-110">
            <Plane className="h-5 w-5 text-white rotate-[-30deg]" />
          </div>
          <span className="text-xl font-bold font-heading tracking-tight">
            Wayfarer <span className="gradient-text">AI</span>
          </span>
        </Link>
      </div>

      {/* Auth Card Container */}
      <div className="relative z-10 w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
