export async function readBlobAsBuffer(blob: Blob) {
    return await new Promise<ArrayBuffer>((resolve) => {
        const fileReader = new FileReader();
        fileReader.onload = () => resolve(fileReader.result as ArrayBuffer);
        fileReader.readAsArrayBuffer(blob);
    });
}