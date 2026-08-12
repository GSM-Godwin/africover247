"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ComplaintPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/help/new-ticket?category=complaint");
  }, [router]);

  return null;
}
