"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

// Exclusões pedem um segundo clique: o primeiro só troca o texto do botão
// por "Confirmar?" durante alguns segundos.
export function BotaoConfirmar({
  children,
  confirmar = "Clique de novo para confirmar",
  className,
}: {
  children: React.ReactNode;
  confirmar?: string;
  className?: string;
}) {
  const [armado, setArmado] = useState(false);
  const { pending } = useFormStatus();

  useEffect(() => {
    if (!armado) return;
    const t = setTimeout(() => setArmado(false), 4000);
    return () => clearTimeout(t);
  }, [armado]);

  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (!armado) {
          e.preventDefault();
          setArmado(true);
        }
      }}
      className={`${className ?? ""} ${armado ? "font-semibold text-red-700" : ""} disabled:cursor-wait disabled:opacity-60`}
    >
      {pending ? "Aguarde..." : armado ? confirmar : children}
    </button>
  );
}
