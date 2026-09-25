import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Fotos já chegam redimensionadas no navegador (até 5 × ~500 KB + miniaturas).
      // Fica abaixo do limite de 4,5 MB por requisição das funções da Vercel.
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
