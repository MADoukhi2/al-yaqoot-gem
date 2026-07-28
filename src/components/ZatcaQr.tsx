import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function ZatcaQr({ payload, size = 160 }: { payload: string; size?: number }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(payload, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: size * 2,
      color: { dark: "#000000ff", light: "#ffffffff" },
    })
      .then((url) => {
        if (active) setSrc(url);
      })
      .catch(() => setSrc(null));
    return () => {
      active = false;
    };
  }, [payload, size]);

  if (!src) {
    return (
      <div
        className="animate-pulse rounded-lg bg-secondary"
        style={{ width: size, height: size }}
        aria-hidden
      />
    );
  }

  return (
    <img
      src={src}
      width={size}
      height={size}
      alt="ZATCA e-invoice QR code"
      className="rounded-lg bg-white p-1"
    />
  );
}
