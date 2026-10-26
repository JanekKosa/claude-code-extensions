/**
 * Picks the newest installed copy of a VS Code extension from the folder names in an extensions folder. A folder
 * is named `<publisher>.<name>-<major>.<minor>.<patch>`, sometimes followed by a platform such as `-win32-x64`.
 * Versions compare by number, so 2.1.1000 is newer than 2.1.306.
 */

/**
 * Picks the folder of the newest version of an extension.
 * @param folderNames the names of the folders in the extensions folder
 * @param extensionId the extension's `<publisher>.<name>`, such as `anthropic.claude-code`
 * @returns the folder's name, or undefined when no folder is a version of that extension
 */
export function newestExtensionFolder(folderNames: readonly string[], extensionId: string): string | undefined {
  return folderNames
    .flatMap((name) => {
      const version = folderVersion(name, extensionId);
      return version === undefined ? [] : [{ name, version }];
    })
    .sort((a, b) => compareVersions(b.version, a.version))[0]?.name;
}

/**
 * Reads the version from a folder's name.
 * @param folderName the folder's name
 * @param extensionId the extension's `<publisher>.<name>`
 * @returns the version's three numbers, or undefined when the folder is not a version of that extension
 */
function folderVersion(folderName: string, extensionId: string): number[] | undefined {
  const prefix = `${extensionId}-`;
  if (!folderName.startsWith(prefix)) return undefined;
  const match = /^(\d+)\.(\d+)\.(\d+)(?:-[a-z0-9-]+)?$/i.exec(folderName.slice(prefix.length));
  return match === null ? undefined : match.slice(1).map(Number);
}

/**
 * Compares two versions number by number.
 * @param a one version
 * @param b the other
 * @returns below 0 when a is older, 0 when equal, above 0 when a is newer
 */
function compareVersions(a: readonly number[], b: readonly number[]): number {
  return a.map((part, index) => part - b[index]).find((difference) => difference !== 0) ?? 0;
}
