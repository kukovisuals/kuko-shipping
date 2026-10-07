import CanvasLayer from "@/components/three/CanvasLayer";

export default function Home() {
  return (
    <main className="page">
      <div className="canvas-layer">
        <CanvasLayer />
      </div>
      <div className="grid">
        <header className="header">
          <h1>How many orders are late for delivery?</h1>
        </header>
        <section className="pipeline" aria-label="Pipeline" />
        <section className="map" aria-label="Map" />
        <section className="summary" aria-label="Summary" />
        <footer className="legend" aria-label="Legend" />
      </div>
    </main>
  );
}
