import { BlobReader, BlobWriter, ZipReader } from "@zip.js/zip.js"
export type Resource = Blob | undefined;

async function extract(zipFile: Blob) {
    const blobReader = new BlobReader(zipFile);
    const zipReader = new ZipReader(blobReader);

    const entries = await zipReader.getEntries();
    const resources: Map<string, Resource> = new Map();

    for (const file of entries) {
        const writer = new BlobWriter();

        const blob = await file.getData?.(writer);
        resources.set(file.filename.toLowerCase(), blob);
    }
    
    zipReader.close();

    return resources;
}

const ZipHandler = {
    extract
}

export default ZipHandler