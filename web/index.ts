import index from "./index.html"

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

console.log("Server listening on port 3000")
