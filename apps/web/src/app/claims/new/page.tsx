"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ClaimNewIndexPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams.toString();
    router.replace(
      query ? `/claims/new/step-1?${query}` : "/claims/new/step-1",
    );
  }, [router, searchParams]);

  return null;
}
