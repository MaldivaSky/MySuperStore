import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8 bg-background">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold tracking-tight text-foreground">
          MySuperStore
        </h1>
        <p className="text-xl text-muted-foreground max-w-md">
          Marketplace multi-vendedor em construção.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
        <Link
          href="/store"
          className="group rounded-xl border p-6 hover:border-primary transition-colors"
        >
          <h2 className="font-semibold mb-2">Loja →</h2>
          <p className="text-sm text-muted-foreground">Explore produtos e categorias</p>
        </Link>
        <Link
          href="/seller/dashboard"
          className="group rounded-xl border p-6 hover:border-primary transition-colors"
        >
          <h2 className="font-semibold mb-2">Vendedor →</h2>
          <p className="text-sm text-muted-foreground">Gerencie sua loja</p>
        </Link>
        <a
          href="http://localhost:8000/api/docs/"
          target="_blank"
          rel="noopener noreferrer"
          className="group rounded-xl border p-6 hover:border-primary transition-colors"
        >
          <h2 className="font-semibold mb-2">API Docs →</h2>
          <p className="text-sm text-muted-foreground">Swagger UI da API REST</p>
        </a>
      </div>
    </main>
  );
}
