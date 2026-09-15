// Mirrors the backend's uploadAvatar multer limit (multerMiddleware.ts) —
// profile photo and company logo only. Job attachments and worker
// documents use the backend's separate, larger limit.
export const MAX_AVATAR_FILE_SIZE = 500_000 // 500KB
