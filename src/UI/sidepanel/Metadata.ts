import { inject } from "@/Context";
import type ResponsiveHandler from "@/ResponsiveHandler";
import type { LayoutOptions } from "@pixi/layout";
import { LayoutContainer } from "@pixi/layout/components";
import type { BeatmapMetadataSection } from "osu-classes";
import {
	Text,
	type TextStyle,
	type TextOptions,
	type TextStyleOptions,
	BitmapText,
} from "pixi.js";

const defaultStyle: TextStyle | TextStyleOptions | undefined = {
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

	artist = new Text({
		text: "",
		style: { ...defaultStyle, fontSize: 16, fontWeight: "400", fill: 0xcdd6f4 },
		layout: defaultLayout,
	});
	artistUnicode = new Text({
		text: "",
		style: { ...defaultStyle, fontSize: 16, fontWeight: "400", fill: 0xcdd6f4 },
		layout: defaultLayout,
	});
	title = new Text({
		text: "",
		style: { ...defaultStyle, fontSize: 16, fontWeight: "400", fill: 0xcdd6f4 },
		layout: defaultLayout,
	});
	titleUnicode = new Text({
		text: "",
		style: { ...defaultStyle, fontSize: 16, fontWeight: "400", fill: 0xcdd6f4 },
		layout: defaultLayout,
	});
	version = new Text({
		text: "",
		style: { ...defaultStyle, fontSize: 16, fontWeight: "400", fill: 0xcdd6f4 },
		layout: defaultLayout,
	});
	source = new Text({
		text: "",
		style: { ...defaultStyle, fontSize: 16, fontWeight: "400", fill: 0xcdd6f4 },
		layout: defaultLayout,
	});
	tags = new Text({
		text: "",
		style: { ...defaultStyle, fontSize: 16, fontWeight: "400", fill: 0xcdd6f4 },
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
				backgroundColor: 0x181825,
				borderRadius: 0,
				borderWidth: 1,
			},
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

	private createContainer(title: string, content: Text) {
		const titleObject = new Text({
			text: title,
			style: {
				...defaultStyle,
				fontSize: 14,
				fontWeight: "300",
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

		const mapperEl = document.querySelector("#mapper") 
		const titleEl = document.querySelector("#title")
		
		if (mapperEl) mapperEl.textContent = `by ${metadata.creator}`;
		if (titleEl) titleEl.textContent = `${metadata.artist} - ${metadata.title}`;
	}
}
