import { provide } from "../Context";
import MirrorConfig from "./MirrorConfig";
import RendererConfig from "./RendererConfig";

export default class Config {
    renderer: RendererConfig;
    mirror: MirrorConfig;

    constructor() {
        this.renderer = provide("config/renderer", new RendererConfig());
        this.mirror = provide("config/mirror", new MirrorConfig());
    }
}