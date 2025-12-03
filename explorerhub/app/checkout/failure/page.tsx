import Link from "next/link"

type Props = {
  searchParams: Record<string, string | string[] | undefined>
}

export default function CheckoutFailurePage({ searchParams }: Props) {
  const statusDetail = searchParams["status_detail"]

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-destructive">No pudimos aprobar el pago</h1>
        <p className="text-muted-foreground">
          Mercado Pago rechazó la operación. Revisá los datos de tu tarjeta o probá con otro medio de pago.
        </p>
        {statusDetail ? (
          <p className="text-xs text-muted-foreground">
            Detalle brindado por Mercado Pago: <span className="font-semibold">{statusDetail}</span>
          </p>
        ) : null}
      </div>

      <Link href="/dashboard/business" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
        Intentar nuevamente
      </Link>
    </main>
  )
}

