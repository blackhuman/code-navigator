import vscode, { CallHierarchyIncomingCall, CallHierarchyItem, FindTextInFilesOptions, GlobPattern, Position, Range, TextSearchMatch, TextSearchQuery, Uri } from 'vscode';

export namespace FileUtil {

  export async function findTextInFiles(query: TextSearchQuery, options: FindTextInFilesOptions): Promise<TextSearchMatch[]> {
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

  export async function findTextInFilesReturnUris(query: TextSearchQuery, options: FindTextInFilesOptions): Promise<Uri[]> {
    const results = await findTextInFiles(query, options);
    const uris = results.reduce((acc, cur) => acc.set(cur.uri.path, cur.uri), new Map<string, Uri>());
    return Array.from(uris.values());
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
}