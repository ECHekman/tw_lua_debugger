/* tslint:disable */
/* eslint-disable */

/* auto-generated by NAPI-RS */

export function openPackFiles(paths: Array<string>, useLazyLoading: boolean, ignoreMods: boolean, lockPackfile: boolean): PackFileHolder
export function createPackfileFromFolder(packfilesDirectory: string, outModPath: string, convertTsv: boolean): string
export class Config {
  gameSelected: string
}
export class PackFileHolder {
  getAllLuaFilePaths(): Array<string>
  getTextFile(filepath: string): string
}
