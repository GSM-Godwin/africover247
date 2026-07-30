import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default async function Icon() {
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
          width={22}
          height={22}
          style={{ objectFit: "contain" }}
        />
      </div>
    ),
    { width: 32, height: 32 },
  );
}
