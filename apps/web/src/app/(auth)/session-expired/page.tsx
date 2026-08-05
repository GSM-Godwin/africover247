import Link from "next/link";
import { Clock } from "lucide-react";

export default function SessionExpiredPage() {
  return (
    <div className="w-full max-w-md text-center">
      <div className="w-16 h-16 bg-daybreak/10 rounded-full flex items-center justify-center mx-auto mb-6">
        <Clock size={28} className="text-daybreak" />
      </div>
      <h1 className="font-display font-bold text-midnight text-3xl mb-3">
        Session expired
      </h1>
      <p className="font-body text-slate text-base mb-8">
        You were signed out due to inactivity. Your progress has been saved.
      </p>
      <Link
        href="/login"
        className="w-full bg-daybreak text-midnight font-body font-bold text-base py-4 rounded-xl hover:bg-[#D4921A] transition-colors duration-200 flex items-center justify-center"
      >
        Sign in again
      </Link>
    </div>
  );
}
