import { LayoutContainer } from "@pixi/layout/components";
import { Sprite, type Texture } from "pixi.js";

export default class Background {
	container = new LayoutContainer({
		layout: {
			position: "absolute",
			top: 0,
			left: 0,
			width: "100%",
			height: "100%",
			backgroundColor: "black",
		},
	});

	private sprite = new Sprite({
		layout: {
			position: "absolute",
			top: 0,
			left: 0,
			width: "100%",
			height: "100%",
			objectPosition: "center",
			objectFit: "cover",
		},
        alpha: 0.5
	});

	constructor() {
		this.container.addChild(this.sprite);
	}

	updateTexture(texture: Texture) {
		this.sprite.texture = texture;
        this.sprite.layout = {
            width: "100%"
        }
	}
}
