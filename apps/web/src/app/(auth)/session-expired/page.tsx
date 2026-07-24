import Link from "next/link";

export default function SessionExpiredPage() {
  return (
    <div className="w-full max-w-md">
      <h1 className="font-display font-bold text-midnight text-4xl mb-2">
        Your session has expired
      </h1>
      <p className="font-body text-slate text-base mb-10">
        Logged out due to inactivity. Please log in again.
      </p>

      <Link
        href="/login"
        className="w-full bg-daybreak text-midnight font-body font-bold text-base py-4 rounded-lg hover:bg-[#C4700E] transition-colors duration-200 flex items-center justify-center"
      >
        Login again
      </Link>

      <p className="font-body text-slate/60 text-sm text-center mt-4">
        Your progress has been saved
      </p>
    </div>
  );
}
