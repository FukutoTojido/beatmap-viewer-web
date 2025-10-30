import axios from "axios";
import { Elysia, t } from "elysia";

const download = new Elysia().post(
	"/api/download",
	async ({ body: { url } }) => {
		const response = await axios.get(url, {
			responseType: "stream",
		});
		
        return new Response(response.data)
	},
	{
		body: t.Object({
			url: t.String(),
		}),
	},
);

export default download;