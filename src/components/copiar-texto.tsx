"use client";

import { useState } from "react";

// Mostra um texto pronto para colar no WhatsApp/e-mail, com botão de copiar.
export function CopiarTexto({ texto }: { texto: string }) {
  const [copiado, setCopiado] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <pre className="whitespace-pre-wrap rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800">
        {texto}
      </pre>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(texto);
            setCopiado(true);
            setTimeout(() => setCopiado(false), 2500);
          } catch {
            setCopiado(false);
          }
        }}
        className="self-start rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        {copiado ? "Copiado!" : "Copiar mensagem"}
      </button>
    </div>
  );
}
