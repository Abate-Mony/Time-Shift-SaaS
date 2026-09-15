import imageCompression from "browser-image-compression"

// Runs client-side before profile photo / company logo uploads — shrinks
// the file toward the backend's uploadAvatar limit (500KB, see
// multerMiddleware.ts) before it ever leaves the browser, instead of
// relying on the user to pick an already-small file. maxSizeMB is a target,
// not a hard guarantee for every image, so callers still check the result
// against MAX_AVATAR_FILE_SIZE before uploading.
export async function compressAvatarImage(file: File): Promise<File> {
    return await imageCompression(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 512,
        useWebWorker: true,
        fileType: "image/webp",
    })
}

// Shift-completion site photos (ClockScreenPage.tsx) — these back real
// evidence of work done, not a small avatar thumbnail, so this keeps far
// more detail than compressAvatarImage while still cutting upload size
// well under the backend's general 10MB upload() limit.
export async function compressSitePhoto(file: File): Promise<File> {
    return await imageCompression(file, {
        maxSizeMB: 2,
        maxWidthOrHeight: 1600,
        useWebWorker: true,
        fileType: "image/webp",
    })
}
