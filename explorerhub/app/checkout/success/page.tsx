import Link from "next/link"

type Props = {
  searchParams: Record<string, string | string[] | undefined>
}

export default function CheckoutSuccessPage({ searchParams }: Props) {
  const paymentId = searchParams["payment_id"]
  const merchantOrder = searchParams["merchant_order_id"]

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-primary">¡Pago recibido!</h1>
        <p className="text-muted-foreground">
          Mercado Pago confirmó tu operación. En unos minutos verás reflejada tu suscripción en ExplorerHub.
        </p>
      </div>

      <div className="w-full rounded-lg border bg-muted/30 p-4 text-sm text-left">
        <p className="font-semibold">Resumen de Mercado Pago</p>
        {paymentId ? <p>Pago: {paymentId}</p> : null}
        {merchantOrder ? <p>Orden: {merchantOrder}</p> : null}
        <p className="text-muted-foreground">
          Conservá estos datos ante cualquier consulta con soporte.
        </p>
      </div>

      <Link href="/dashboard/business" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
        Volver al panel de negocios
      </Link>
    </main>
  )
}

