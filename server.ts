import { Elysia, t } from "elysia";
import type { ViteDevServer } from "vite";
import { staticPlugin } from "@elysiajs/static";

const isProduction = process.env.NODE_ENV === "production";
const htmlTemplate = isProduction
	? await Bun.file("dist/index.html").text()
	: "";

let vite: ViteDevServer | undefined;
if (!isProduction) {
	const { createServer } = await import("vite");
	vite = await createServer({
		server: { middlewareMode: true },
		appType: "custom",
		base: "",
	});
}

const app = new Elysia().decorate("vite", vite);

if (vite) {
	app.use(
		(await import("elysia-connect-middleware")).connect(vite.middlewares),
	);
} else {
	app.use(
		staticPlugin({
			assets: "./dist/",
			prefix: "",
			alwaysStatic: false,
			noCache: true,
		}),
	);
}

app
	.get("/", async ({ vite, request, set, query: { b: beatmapId } }) => {
		console.log(beatmapId);

		try {
			let template: string | undefined;

			if (vite) {
				const raw = await Bun.file("./index.html").text();
				template = await vite.transformIndexHtml(request.url, raw);
			} else {
				template = htmlTemplate;
			}

			return new Response(template, {
				headers: {
					"Content-Type": "text/html",
				},
			});
		} catch (e) {
            if (e instanceof Error) {
                vite?.ssrFixStacktrace(e);
                console.log(e.stack);
                set.status = 500;

                return e.stack;
            }

            console.log(e);
        }
	}, {
		query: t.Object({
			b: t.Optional(t.Number())
		})
	})
	.listen(8080);

console.log(
	`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port} @production=${isProduction}`,
);
