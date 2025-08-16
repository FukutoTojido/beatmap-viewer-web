const Reverse = (fn: (x: number) => number, val: number) => 1 - fn(1 - val);
const ToInOut = (fn: (x: number) => number, val: number) =>
	0.5 * (val < 0.5 ? fn(2 * val) : 2 - fn(2 - 2 * val));

const Step = (x: number) => (x >= 1 ? 1 : 0);
const Linear = (x: number) => x;

const QuadIn = (x: number) => x * x;
const QuadOut = (x: number) => Reverse(QuadIn, x);
const QuadInOut = (x: number) => ToInOut(QuadIn, x);

const CubicIn = (x: number) => x * x * x;
const CubicOut = (x: number) => Reverse(CubicIn, x);
const CubicInOut = (x: number) => ToInOut(CubicIn, x);

const QuartIn = (x: number) => x * x * x * x;
const QuartOut = (x: number) => Reverse(QuartIn, x);
const QuartInOut = (x: number) => ToInOut(QuartIn, x);

const QuintIn = (x: number) => x * x * x * x * x;
const QuintOut = (x: number) => Reverse(QuintIn, x);
const QuintInOut = (x: number) => ToInOut(QuintIn, x);

const SineIn = (x: number) => 1 - Math.cos(x * (Math.PI / 2));
const SineOut = (x: number) => Reverse(SineIn, x);
const SineInOut = (x: number) => ToInOut(SineIn, x);

const ExpoIn = (x: number) => 2 ** (10 * (x - 1));
const ExpoOut = (x: number) => Reverse(ExpoIn, x);
const ExpoInOut = (x: number) => ToInOut(ExpoIn, x);

const CircIn = (x: number) => 1 - Math.sqrt(1 - x * x);
const CircOut = (x: number) => Reverse(CircIn, x);
const CircInOut = (x: number) => ToInOut(CircIn, x);

const BackIn = (x: number) => x * x * ((1.70158 + 1) * x - 1.70158);
const BackOut = (x: number) => Reverse(BackIn, x);
const BackInOut = (x: number) => ToInOut(BackIn, x);

const BounceOut = (x: number) =>
	x < 1 / 2.75
		? 7.5625 * x * x
		: x < 2 / 2.75
			? // biome-ignore lint/suspicious/noAssignInExpressions: Hackerman
				// biome-ignore lint/style/noParameterAssign: Hackerman
				7.5625 * (x -= 1.5 / 2.75) * x + 0.75
			: x < 2.5 / 2.75
				? // biome-ignore lint/suspicious/noAssignInExpressions: Hackerman
					// biome-ignore lint/style/noParameterAssign: Hackerman
					7.5625 * (x -= 2.25 / 2.75) * x + 0.9375
				: // biome-ignore lint/suspicious/noAssignInExpressions: Hackerman
					// biome-ignore lint/style/noParameterAssign: Hackerman
					7.5625 * (x -= 2.625 / 2.75) * x + 0.984375;
const BounceIn = (x: number) => Reverse(BounceOut, x);
const BounceInOut = (x: number) => ToInOut(BounceIn, x);

const ElasticOut = (x: number) =>
	2 ** (-10 * x) * Math.sin(((x - 0.075) * (2 * Math.PI)) / 0.3) + 1;
const ElasticOutHalf = (x: number) =>
	2 ** (-10 * x) * Math.sin(((0.5 * x - 0.075) * (2 * Math.PI)) / 0.3) + 1;
const ElasticOutQuarter = (x: number) =>
	2 ** (-10 * x) * Math.sin(((0.25 * x - 0.075) * (2 * Math.PI)) / 0.3) + 1;
const ElasticIn = (x: number) => Reverse(ElasticOut, x);
const ElasticInOut = (x: number) => Reverse(ElasticIn, x);

const Easings = {
	Step,
	None: Linear,

	In: QuadIn,
	Out: QuadOut,
	InOut: QuadInOut,

	InQuad: QuadIn,
	OutQuad: QuadOut,
	InOutQuad: QuadInOut,

	InCubic: CubicIn,
	OutCubic: CubicOut,
	InOutCubic: CubicInOut,

	InQuart: QuartIn,
	OutQuart: QuartOut,
	InOutQuart: QuartInOut,

	InQuint: QuintIn,
	OutQuint: QuintOut,
	InOutQuint: QuintInOut,

	InSine: SineIn,
	OutSine: SineOut,
	InOutSine: SineInOut,

	InExpo: ExpoIn,
	OutExpo: ExpoOut,
	InOutExpo: ExpoInOut,

	InCirc: CircIn,
	OutCirc: CircOut,
	InOutCirc: CircInOut,

	InElastic: ElasticIn,
	OutElastic: ElasticOut,
	InOutElastic: ElasticInOut,
	OutElasticHalf: ElasticOutHalf,
	OutElasticQuarter: ElasticOutQuarter,

	InBack: BackIn,
	OutBack: BackOut,
	InOutBack: BackInOut,

	InBounce: BounceIn,
	OutBounce: BounceOut,
	InOutBounce: BounceInOut,
};

const EasingsMap = [
	Linear,
	SineOut,
	SineIn,

	QuadIn,
	QuadOut,
	QuadInOut,

	CubicIn,
	CubicOut,
	CubicInOut,

	QuartIn,
	QuartOut,
	QuartInOut,

	QuintIn,
	QuintOut,
	QuintInOut,

	SineIn,
	SineOut,
	SineInOut,

	ExpoIn,
	ExpoOut,
	ExpoInOut,

	CircIn,
	CircOut,
	CircInOut,

	ElasticIn,
	ElasticOut,
	ElasticOutHalf,
	ElasticOutQuarter,
	ElasticInOut,

	BackIn,
	BackOut,
	BackInOut,

	BounceIn,
	BounceOut,
	BounceInOut,
];

export default Easings;
export { EasingsMap };
