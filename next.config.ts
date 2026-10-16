import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Padrão é 1 MB; o arquivo de backup enviado em "Restaurar" pode passar
    // disso com alguns anos de lançamentos.
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
};

export default nextConfig;
