import path from 'path';
import URI from 'urijs';
import v from 'voca';
import s from 'strman';
import { VSCodeUtil } from '../util/vscode-util';

const baseDir = '/Users/baiyizhe/Developer/tools/code-navigator/test-workspace/';

export function getModuleNameFromRelativeImport(currentModulePath: string, relativeImportPath: string): string {
  const uri = new URI(relativeImportPath).absoluteTo(currentModulePath);
  return s.removeLeft(uri.valueOf(), baseDir);
}

const a = 1+1;
const b = getModuleNameFromRelativeImport('/Users/baiyizhe/Developer/tools/code-navigator/test-workspace/controller.js', './service');
b;
console.log('a');