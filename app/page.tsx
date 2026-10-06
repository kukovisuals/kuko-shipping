import { connection } from "next/server";
import { Experience } from "@/app/_experience/Experience";

/** One `now` per request (Next 16: `connection()` opts the page out of prerendering). */
async function requestNow(): Promise<number> {
  await connection();
  return Date.now();
}

export default async function Home() {
  return <Experience now={await requestNow()} />;
}
