import Image from "next/image";
import Link from "next/link";
import { PolicyCardStack } from "@/components/shared/policy-card-stack";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-midnight flex-col justify-between p-10 xl:p-14">
        <Link href="/" className="flex items-center">
          <div className="bg-white rounded-2xl px-6 py-4 inline-flex">
            <Image
              src="/afriglobal_logo.png"
              alt="AfriGlobal Insurance Brokers"
              width={200}
              height={64}
              className="h-14 w-auto object-contain"
              priority
            />
          </div>
        </Link>

        <div className="flex justify-center items-center flex-1 py-12">
          <PolicyCardStack />
        </div>

        <div className="space-y-6">
          <blockquote className="font-display font-medium text-paper text-2xl xl:text-3xl leading-snug max-w-xs">
            &ldquo;Your policy, your claim, your peace of mind; always a tap
            away.&rdquo;
          </blockquote>
          <div className="space-y-1">
            <p className="font-body text-paper/50 text-xs">
              Secured by Monnify &amp; Cloudflare · NDPA-aware data handling
            </p>
            <p className="font-body text-paper/30 text-xs">
              Powered by AfriGlobal Insurance Brokers Limited · NAICOM Licensed
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-[#F5F5F7] flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-16 xl:px-24">
        <div className="flex justify-center mb-8 lg:hidden">
          <div className="bg-white rounded-2xl px-6 py-4 shadow-sm">
            <Image
              src="/afriglobal_logo.png"
              alt="AfriGlobal Insurance Brokers"
              width={180}
              height={56}
              className="h-12 w-auto object-contain"
              priority
            />
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}
