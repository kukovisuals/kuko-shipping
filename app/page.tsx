import { BRAND } from "@/domain/brand";

export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="font-pixel text-3xl text-accent sm:text-5xl">{BRAND.product}</h1>
      <p className="ui-label">{BRAND.demoClient} · concept demo</p>
      <p className="max-w-md text-muted">The 3D shipping map arrives in M2.</p>
      <p className="max-w-md text-sm text-muted">{BRAND.disclaimer}</p>
    </main>
  );
}
