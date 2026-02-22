import index from "./index.html"
import { info, bold } from "../src/utils/colors.js"

Bun.serve({
  port: 3000,
  development: {
    hmr: true,
    console: true,
  },
  async fetch(req) {
    return index(req)
  },
})

console.log(`${info("Server listening on port")} ${bold("3000")}`)
