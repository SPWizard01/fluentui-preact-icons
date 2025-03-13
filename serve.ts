import index from "./showcase/index.html";
const bunServer = Bun.serve({
    development: true,
    routes: {
        "/": index,
    }
})
console.log("Server started at", bunServer.url.href);