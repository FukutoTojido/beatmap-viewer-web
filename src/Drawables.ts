export default interface Drawables {
    x: number,
    y: number,
    
    width: number,
    height: number,

	children: Drawables[];
	resize: ({ width, height }?: { width: number; height: number }) => void;
}
