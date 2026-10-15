import Image from "next/image";

import { PROVIDER_ICON_PATHS } from "@/constants/provider-icon";
import type { AiProvider } from "@/types/ai";

export default function ProviderIcon(props: {
  provider: AiProvider;
  size?: number;
  title?: string;
  className?: string;
}) {
  const size = props.size ?? 16;

  return (
    <Image
      src={PROVIDER_ICON_PATHS[props.provider]}
      alt={props.title ?? ""}
      title={props.title}
      width={size}
      height={size}
      unoptimized
      className={["block shrink-0 object-contain", props.className ?? ""].filter(Boolean).join(" ")}
      style={{ width: size, height: size }} />
  );
}
