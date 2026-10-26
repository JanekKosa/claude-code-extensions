/**
 * File system reads of things that may be missing. Knows nothing of the toolbar.
 */

/**
 * Runs a file system read, answering a fallback when the file or folder is missing (ENOENT).
 * @param missing what to answer when it is
 * @param read the read
 * @returns what the read returned, or the fallback; any other error is thrown
 */
export function whenPresent<Result>(missing: Result, read: () => Result): Result {
  try {
    return read();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return missing;
    throw error;
  }
}
