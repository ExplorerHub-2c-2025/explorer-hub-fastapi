import Link from "next/link"

type Props = {
  searchParams: Record<string, string | string[] | undefined>
}

export default function CheckoutPendingPage({ searchParams }: Props) {
  const paymentId = searchParams["payment_id"]

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-primary">Pago en revisión</h1>
        <p className="text-muted-foreground">
          Mercado Pago está verificando tu pago. Te avisaremos por correo cuando esté aprobado.
        </p>
      </div>

      {paymentId ? (
        <p className="rounded-lg border bg-muted/30 px-4 py-2 text-sm">
          ID de pago: <span className="font-semibold">{paymentId}</span>
        </p>
      ) : null}

      <Link href="/dashboard/business" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
        Volver al panel
      </Link>
    </main>
  )
}

