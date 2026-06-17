import { writePublicSearchArtifact } from "@/lib/content/load-search-artifact";

const artifact = writePublicSearchArtifact();

console.log(
  `Generated public search artifact with ${artifact.entries.length} entries at public/search/public-search-index.json`,
);
