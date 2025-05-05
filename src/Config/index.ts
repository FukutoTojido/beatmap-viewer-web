import MirrorConfig from "./MirrorConfig";
import RendererConfig from "./RendererConfig";

export default class Config {
    renderer: RendererConfig;
    mirror: MirrorConfig;

    constructor() {
        this.renderer = new RendererConfig();
        this.mirror = new MirrorConfig();
    }
}