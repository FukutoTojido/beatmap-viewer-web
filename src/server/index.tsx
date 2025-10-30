import { cors } from "@elysiajs/cors";
// biome-ignore lint/correctness/noUnusedImports: JSX lah
import { Html, html } from "@elysiajs/html";
import { staticPlugin } from "@elysiajs/static";
import axios from "axios";
import { Elysia, t } from "elysia";
import type { ViteDevServer } from "vite";
import download from "./download";

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
	.use(cors())
	.use(html())
	.use(download)
	.get(
		"/",
		async ({ vite, request, set, query: { b: beatmapId } }) => {
			console.log(beatmapId);

			try {
				// biome-ignore lint/suspicious/noExplicitAny: Data lah
				let data: any | undefined;

				if (beatmapId) {
					try {
						const { data: beatmapData } = await axios.get(
							`https://api.try-z.net/b/${beatmapId[0]}`,
						);

						data = {
							artist: beatmapData.beatmapset.artist,
							title: beatmapData.beatmapset.title,
							cover: beatmapData.beatmapset.covers["card@2x"],
							creator: beatmapData.beatmapset.creator,
							difficulty: beatmapData.version,
						};
						console.log(data);
					} catch {
						console.log("Cannot find beatmap");
					}
				}

				let template: string | undefined;

				if (vite) {
					const raw = await Bun.file("./index.html").text();
					template = await vite.transformIndexHtml(request.url, raw);
				} else {
					template = htmlTemplate;
				}

				return (
					<html lang="en">
						<head>
							<meta
								name="viewport"
								content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
							/>
							<link
								href="https://cdn.jsdelivr.net/npm/remixicon@4.5.0/fonts/remixicon.css"
								rel="stylesheet"
							/>
							<meta
								property="og:site_name"
								content="JoSu! | osu! Beatmap Viewer"
							/>
							<meta property="og:url" content="https://beatmap.try-z.net" />
							<meta
								property="twitter:url"
								content="https://beatmap.try-z.net"
							/>
							<meta
								property="twitter:domain"
								content="https://beatmap.try-z.net"
							/>
							<meta name="twitter:card" content="summary_large_image" />
							<title>JoSu!</title>
							{data ? (
								<>
									<meta
										property="og:title"
										content={`${data.artist} - ${data.title} | JoSu! - osu! Beatmap Viewer`}
									/>
									<meta
										name="twitter:title"
										content={`${data.artist} - ${data.title} | JoSu! - osu! Beatmap Viewer`}
									/>
									<meta property="og:type" content="website" />
									<meta
										property="og:description"
										content={`Difficulty: ${data.difficulty} - Mapset by ${data.creator}`}
									/>
									<meta
										name="twitter:description"
										content={`Difficulty: ${data.difficulty} - Mapset by ${data.creator}`}
									/>
									<meta property="og:image" content={data.cover} />
									<meta name="twitter:image" content={data.cover} />
								</>
							) : (
								<>
									<meta
										property="og:title"
										content={`JoSu! - osu! Beatmap Viewer`}
									/>
									<meta
										name="twitter:title"
										content={`JoSu! - osu! Beatmap Viewer`}
									/>
									<meta property="og:type" content="website" />
									<meta
										property="og:description"
										content={`osu! Beatmap Viewer on the Web`}
									/>
									<meta
										name="twitter:description"
										content={`osu! Beatmap Viewer on the Web`}
									/>
									<meta
										property="og:image"
										content="https://fukutotojido.s-ul.eu/YuVf9ZAd"
									/>
									<meta
										property="twitter:image"
										content="https://fukutotojido.s-ul.eu/YuVf9ZAd"
									/>
								</>
							)}
						</head>
						{template}
					</html>
				);
			} catch (e) {
				if (e instanceof Error) {
					vite?.ssrFixStacktrace(e);
					console.log(e.stack);
					set.status = 500;

					return e.stack;
				}

				console.log(e);
			}
		},
		{
			query: t.Object({
				b: t.Optional(t.Array(t.Number())),
			}),
		},
	)
	.listen(process.env.PORT ?? 8080);

console.log(
	`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port} @production=${isProduction}`,
);
