"use client";

import { useFormStatus } from "react-dom";

// Trava o botão assim que o form é enviado e mostra que está processando —
// sem isso, quem clica sem ver reação nenhuma (a Server Action pode demorar
// alguns segundos) tende a clicar de novo, duplicando o lançamento no livro
// caixa. Precisa ser um componente à parte porque useFormStatus só funciona
// dentro do <form>, nunca no mesmo componente que o renderiza.
export function SubmitButton({
  children,
  pendingText = "Salvando...",
  className,
  disabled,
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
  // Some forms also disable the button for their own reason (ex.: nada
  // selecionado ainda) — combina com o travamento automático do envio.
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      aria-busy={pending}
      className={`${className ?? ""} disabled:cursor-wait disabled:opacity-60`}
    >
      {pending ? pendingText : children}
    </button>
  );
}
