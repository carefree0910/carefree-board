import { bundleWeb } from "../utils.ts";

const success = await bundleWeb({ minify: true });
Deno.exit(success ? 0 : 1);
