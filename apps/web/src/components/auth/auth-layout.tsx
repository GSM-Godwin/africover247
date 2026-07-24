import Link from "next/link";
import Image from "next/image";
import { PolicyCardStack } from "@/components/shared/policy-card-stack";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-midnight flex-col justify-between p-10 xl:p-14">
        <Link href="/" className="flex items-center">
          <Image
            src="/afriglobal_logo.png"
            alt="AfriGlobal Insurance Brokers"
            width={160}
            height={48}
            className="h-10 w-auto object-contain brightness-0 invert"
            priority
          />
        </Link>

        <div className="flex justify-center items-center flex-1 py-12">
          <PolicyCardStack />
        </div>

        <div className="space-y-6">
          <blockquote className="font-display font-medium text-paper text-2xl xl:text-3xl leading-snug max-w-xs">
            &ldquo;Your policy, your claim, your peace of mind; always a tap
            away.&rdquo;
          </blockquote>

          <p className="font-body text-paper/30 text-xs">
            Secured by Monnify &amp; Cloudflare · NDPA-aware data handling
          </p>
        </div>
      </div>

      <div className="flex-1 bg-[#F5F5F7] flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-16 xl:px-24">
        {children}
      </div>
    </div>
  );
}
