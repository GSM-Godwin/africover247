import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  const logoBuffer = await readFile(
    join(process.cwd(), "public", "afriglobal_logo.png"),
  );
  const logoSrc = `data:image/png;base64,${logoBuffer.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FFFFFF",
          borderRadius: "50%",
        }}
      >
        <img
          src={logoSrc}
          width={120}
          height={120}
          style={{ objectFit: "contain" }}
        />
      </div>
    ),
    { width: 180, height: 180 },
  );
}
