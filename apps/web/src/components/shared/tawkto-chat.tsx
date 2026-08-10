"use client";

import { useEffect } from "react";

const TAWKTO_PROPERTY_ID = process.env.NEXT_PUBLIC_TAWKTO_PROPERTY_ID || "";
const TAWKTO_WIDGET_ID =
  process.env.NEXT_PUBLIC_TAWKTO_WIDGET_ID || "default";

export function TawkToChat() {
  useEffect(() => {
    if (!TAWKTO_PROPERTY_ID) return;

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://embed.tawk.to/${TAWKTO_PROPERTY_ID}/${TAWKTO_WIDGET_ID}`;
    script.charset = "UTF-8";
    script.setAttribute("crossorigin", "*");
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return null;
}
