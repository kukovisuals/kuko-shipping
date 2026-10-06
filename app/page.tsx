import { cookies } from "next/headers";
import { connection } from "next/server";
import { LOOK_COOKIE } from "@/config/map";
import { isLook } from "@/ui/theme";
import { Experience } from "@/app/_experience/Experience";

/** One `now` per request (Next 16: `connection()` opts the page out of prerendering). */
async function requestNow(): Promise<number> {
  await connection();
  return Date.now();
}

export default async function Home() {
  const saved = (await cookies()).get(LOOK_COOKIE)?.value;
  return <Experience now={await requestNow()} initialLook={isLook(saved) ? saved : "dark"} />;
}
