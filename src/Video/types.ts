export enum MessageType {
	Init = "init",
	Load = "load",
	Seek = "seek",
	Frame = "frame",
	Play = "play",
	Stop = "stop",
}

type WorkerInit = {
	type: MessageType.Init;
	data: string;
};

type WorkerLoad = {
	type: MessageType.Load;
	data: Blob;
};

type WorkerSeek = {
	type: MessageType.Seek;
	data: number;
};

type WorkerFrame = {
	type: MessageType.Frame;
	data: VideoFrame;
};

type WorkerPlay = {
	type: MessageType.Play;
	data: number;
};

type WorkerStop = {
	type: MessageType.Stop;
	data: number;
};

export type WorkerPayload =
	| WorkerInit
	| WorkerLoad
	| WorkerSeek
	| WorkerFrame
	| WorkerPlay
	| WorkerStop;
