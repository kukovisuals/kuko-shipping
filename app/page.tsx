import CanvasLayer from "@/components/three/CanvasLayer";
import Header from "@/components/dom/Header";
import Sidebar from "@/components/dom/Sidebar";
import LateList from "@/components/dom/LateList";
import Legend from "@/components/dom/Legend";
import { tokensCss } from "@/lib/tokens";

// Apply a saved theme before first paint so there is no flash.
const THEME_SCRIPT = `try{var t=localStorage.getItem('theme');if(t)document.documentElement.dataset.theme=t}catch(e){}`;

export default function Home() {
  return (
    <main className="page">
      <style dangerouslySetInnerHTML={{ __html: tokensCss() }} />
      <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      <div className="canvas-layer">
        <CanvasLayer />
      </div>
      <div className="grid">
        <Header />
        <section className="pipeline" aria-label="Pipeline" />
        <section className="map" aria-label="Map" />
        <section className="summary" aria-label="Summary">
          <Sidebar />
          <LateList />
        </section>
        <Legend />
      </div>
    </main>
  );
}
