/**
 * Represents a file selected for upload and its result.
 * Use plain objects so Vue can track id/error updates.
 */
export interface UploadedFile {
  file: File;
  id: number | null;
  error: string | null;
  /** Stable key for list (internal use) */
  _key?: string;
}

export function createUploadedFile(file: File): UploadedFile {
  return {
    file,
    id: null,
    error: null,
    _key: `upload-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  };
}
