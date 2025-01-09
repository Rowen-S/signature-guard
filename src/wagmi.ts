import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { mantleTestnet, mantle } from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "RainbowKit App",
  projectId: "a6cc11517a10f6f12953fd67b1eb67e7",
  chains: [
    mantle,
    ...(process.env.NEXT_PUBLIC_ENABLE_TESTNETS === "true"
      ? [mantleTestnet]
      : []),
  ],
  ssr: true,
});
