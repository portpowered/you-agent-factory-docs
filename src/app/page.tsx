import { PROJECT_NAME, PROJECT_TAGLINE } from "@/lib/project";

export default function HomePage() {
  return (
    <main>
      <h1>{PROJECT_NAME}</h1>
      <p>{PROJECT_TAGLINE}</p>
    </main>
  );
}
