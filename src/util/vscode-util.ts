import _ from 'underscore';
import path from 'path';
import s from 'strman';
import URI from 'urijs';
import vscode, { CallHierarchyIncomingCall, CallHierarchyItem, FindTextInFilesOptions, GlobPattern, Position, Range, TextSearchMatch, TextSearchQuery, Uri } from 'vscode';

export namespace VSCodeUtil {

  async function findTextInFiles(query: TextSearchQuery, options: FindTextInFilesOptions): Promise<TextSearchMatch[]> {
    return new Promise((resolve, reject) => {
      const searchMatchs: TextSearchMatch[] = [];
      vscode.workspace.findTextInFiles(query, options, result => {
        const searchMatch = result as TextSearchMatch;
        if (searchMatch.uri.scheme === 'file') {
          searchMatchs.push(searchMatch);
        }
      }).then(_ => resolve(searchMatchs), _ => reject(searchMatchs));
    });
  }

  async function findTextInFilesReturnUris(query: TextSearchQuery, options: FindTextInFilesOptions): Promise<Uri[]> {
    const results = await findTextInFiles(query, options);
    const uris = results.reduce((acc, cur) => acc.set(cur.uri.path, cur.uri), new Map<string, Uri>());
    return Array.from(uris.values());
  }

  export async function findTextInFilesReturnUrisInMultiplePlaces(queryPattern: string, includes: string[] = []): Promise<Uri[]> {
    const query: TextSearchQuery = { pattern: queryPattern };
    const confIncludes = vscode.workspace.getConfiguration('codenav').get('includes') as string[];
    let optionsArray: vscode.FindTextInFilesOptions[] = [{}];
    if (includes.length !== 0) {
      includes.push(...confIncludes);
      optionsArray = includes!.map(v => ({ include: v}));
    }
    const uris: Uri[] = [];
    for (const options of optionsArray) {
      const result = await findTextInFilesReturnUris(query, options);
      uris.push(...result);
    }
    return uris;
  }

  export async function findTextFisrtStartPositionInFile(queryPattern: string, filePattern: GlobPattern): Promise<[Uri, Position]> {
    const searchMatchs = await findTextInFiles({ pattern: queryPattern }, { include: filePattern });
    if (searchMatchs.length === 0) {
      throw new Error('no matches');
    }
    const searchMatch = searchMatchs[0];
    const ranges = searchMatch.ranges as Range[];
    const range = ranges[0];
    return [searchMatch.uri, range.start];
  }

  export function getWorkspaceBasePath(): string {
    return vscode.workspace.workspaceFolders![0].uri!.path + '/';
  }

  export function getRelativePath(absolutePath: string): string {
    return new URI(absolutePath).relativeTo(getWorkspaceBasePath()).valueOf();
  }

  /**
   * 
   * @param currentModulePath current module file path, must not be started with '/'
   * @returns 
   */
  export function getCurrentModuleName(currentModulePath: string): string {
    const basePath = getWorkspaceBasePath();
    const path = new URI(currentModulePath).relativeTo(basePath).valueOf();
    return path.replace(/\.(js|ts)*?$/, '');
  }

  /**
   * 
   * @param currentModulePath current module file path
   * @param relativeImportPath imported module path (relative)
   * @returns 
   */
  export function getModuleNameFromRelativeImport(currentModulePath: string, relativeImportPath: string): string {
    const uri = new URI(relativeImportPath).absoluteTo(currentModulePath);
    return s.removeLeft(uri.valueOf(), getWorkspaceBasePath());
  }
}