import type { LayoutOptions } from "@pixi/layout";
import { LayoutContainer } from "@pixi/layout/components";
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

	artist = new BitmapText({
		text: "MyGO!!!!!",
		style: { ...defaultStyle, fontSize: 16, fontWeight: "400", fill: 0xcdd6f4 },
		layout: defaultLayout,
	});
	artistUnicode = new BitmapText({
		text: "MyGO!!!!!",
		style: { ...defaultStyle, fontSize: 16, fontWeight: "400", fill: 0xcdd6f4 },
		layout: defaultLayout,
	});
	title = new BitmapText({
		text: "Haruhikage (MyGO!!!!! Ver.)",
		style: { ...defaultStyle, fontSize: 16, fontWeight: "400", fill: 0xcdd6f4 },
		layout: defaultLayout,
	});
	titleUnicode = new BitmapText({
		text: "春日影 (MyGO!!!!! Ver.)",
		style: { ...defaultStyle, fontSize: 16, fontWeight: "400", fill: 0xcdd6f4 },
		layout: defaultLayout,
	});
	version = new BitmapText({
		text: "Past",
		style: { ...defaultStyle, fontSize: 16, fontWeight: "400", fill: 0xcdd6f4 },
		layout: defaultLayout,
	});
	source = new BitmapText({
		text: "BanG Dream! It's MyGO!!!!!",
		style: { ...defaultStyle, fontSize: 16, fontWeight: "400", fill: 0xcdd6f4 },
		layout: defaultLayout,
	});
	tags = new BitmapText({
		text: "crychic 1st album 迷跡波 meisekiha bushiroad gbp garupa girls band party! bandori バンドリ！ ガールズバンドパーティ！ 高松燈 千早愛音 要楽奈 長崎そよ 椎名立希 羊宮妃那 立石凛 青木陽菜 小日向美香 林鼓子 tomori takamatsu anon chihaya raana kaname soyo nagasaki taki shiina hina youmiya rin tateishi hina aoki mika kohinata koko hayashi rock japanese anime jrock j-rock kalibe hey lululu hey_lululu lu^3 coco",
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
	}

	private createContainer(title: string, content: BitmapText) {
		const titleObject = new BitmapText({
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
}
