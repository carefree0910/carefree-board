import { bundleWeb, serveWeb } from "../utils.ts";

const success = await bundleWeb({ minify: false });
if (!success) {
  Deno.exit(1);
}

serveWeb();
