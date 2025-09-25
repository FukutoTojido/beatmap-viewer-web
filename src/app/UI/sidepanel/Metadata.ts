import type { LayoutOptions } from "@pixi/layout";
import { LayoutContainer } from "@pixi/layout/components";
import type { BeatmapMetadataSection } from "osu-classes";
import {
	BitmapText,
	type TextStyle,
	type TextStyleOptions,
} from "pixi.js";
import type ColorConfig from "@/Config/ColorConfig";
import { inject } from "@/Context";
import type ResponsiveHandler from "@/ResponsiveHandler";

export const defaultStyle: TextStyle | TextStyleOptions | undefined = {
	fontFamily: "Rubik",
	fill: 0xbac2de,
	wordWrap: true,
	align: "left",
};

const defaultLayout: Omit<LayoutOptions, "target"> | null | undefined = {
	objectFit: "none",
	objectPosition: "top left",
	width: "100%",
};

export default class Metadata {
	container: LayoutContainer;

	artist = new BitmapText({
		text: "",
		style: {
			...defaultStyle,
			fontSize: 16,
			fontWeight: "400",
			fill: inject<ColorConfig>("config/color")?.color.text,
		},
		layout: defaultLayout,
	});
	artistUnicode = new BitmapText({
		text: "",
		style: {
			...defaultStyle,
			fontSize: 16,
			fontWeight: "400",
			fill: inject<ColorConfig>("config/color")?.color.text,
		},
		layout: defaultLayout,
	});
	title = new BitmapText({
		text: "",
		style: {
			...defaultStyle,
			fontSize: 16,
			fontWeight: "400",
			fill: inject<ColorConfig>("config/color")?.color.text,
		},
		layout: defaultLayout,
	});
	titleUnicode = new BitmapText({
		text: "",
		style: {
			...defaultStyle,
			fontSize: 16,
			fontWeight: "400",
			fill: inject<ColorConfig>("config/color")?.color.text,
		},
		layout: defaultLayout,
	});
	version = new BitmapText({
		text: "",
		style: {
			...defaultStyle,
			fontSize: 16,
			fontWeight: "400",
			fill: inject<ColorConfig>("config/color")?.color.text,
		},
		layout: defaultLayout,
	});
	source = new BitmapText({
		text: "",
		style: {
			...defaultStyle,
			fontSize: 16,
			fontWeight: "400",
			fill: inject<ColorConfig>("config/color")?.color.text,
		},
		layout: defaultLayout,
	});
	tags = new BitmapText({
		text: "",
		style: {
			...defaultStyle,
			fontSize: 16,
			fontWeight: "400",
			fill: inject<ColorConfig>("config/color")?.color.text,
		},
		layout: defaultLayout,
	});

	constructor() {
		this.container = new LayoutContainer({
			label: "metadata",
			layout: {
				width: 360,
				flex: 1,
				flexDirection: "column",
				overflow: "scroll",
				justifyContent: "flex-start",
				alignItems: "flex-start",
				alignContent: "flex-start",
				gap: 15,
				// padding: 10,
				boxSizing: "border-box",
				backgroundColor: inject<ColorConfig>("config/color")?.color.mantle,
				borderRadius: 0,
				borderWidth: 1,
				borderColor: [0, 0, 0, 0],
			},
		});

		inject<ColorConfig>("config/color")?.onChange("color", ({ mantle }) => {
			this.container.layout = {
				backgroundColor: mantle,
			};
		});

		const artist = this.createContainer("artist", this.artist);
		const artistUnicode = this.createContainer(
			"artist unicode",
			this.artistUnicode,
		);
		const title = this.createContainer("title", this.title);
		const titleUnicode = this.createContainer(
			"title unicode",
			this.titleUnicode,
		);
		const version = this.createContainer("version", this.version);
		const source = this.createContainer("source", this.source);
		const tags = this.createContainer("tags", this.tags);

		this.container.addChild(
			artist,
			artistUnicode,
			title,
			titleUnicode,
			version,
			source,
			tags,
		);

		inject<ResponsiveHandler>("responsiveHandler")?.on(
			"layout",
			(direction) => {
				switch (direction) {
					case "landscape": {
						this.container.layout = {
							width: 360,
						};
						break;
					}
					case "portrait": {
						this.container.layout = {
							width: "100%",
						};
						break;
					}
				}
			},
		);
	}

	private createContainer(title: string, content: BitmapText) {
		const titleObject = new BitmapText({
			text: title,
			style: {
				...defaultStyle,
				fontSize: 14,
				fontWeight: "300",
				fill: inject<ColorConfig>("config/color")?.color.subtext1,
			},
			layout: {
				objectPosition: "top left",
				objectFit: "none",
				width: "100%",
			},
		});

		const container = new LayoutContainer({
			label: title,
			layout: {
				width: "100%",
				flexDirection: "column",
				flexShrink: 0,
				gap: 5,
			},
		});

		container.addChild(titleObject, content);

		inject<ColorConfig>("config/color")?.onChange(
			"color",
			({ subtext1, text }) => {
				titleObject.style.fill = subtext1;
				content.style.fill = text;
			},
		);

		return container;
	}

	updateMetadata(metadata: BeatmapMetadataSection) {
		this.artist.text = metadata.artist;
		this.artistUnicode.text = metadata.artistUnicode.replaceAll("、", ", ");
		this.title.text = metadata.title;
		this.titleUnicode.text = metadata.titleUnicode;
		this.version.text = metadata.version;
		this.source.text = metadata.source;
		this.tags.text = metadata.tags.join(", ");

		const mapperEl = document.querySelector("#mapper");
		const titleEl = document.querySelector("#title");

		if (mapperEl) mapperEl.innerHTML = `by <span class="font-medium">${metadata.creator}</span>`;
		if (titleEl) titleEl.textContent = `${metadata.artist} - ${metadata.title}`;
	}
}
