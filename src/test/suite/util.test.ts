import { VSCodeUtil } from "../../util/vscode-util";
import { assert } from 'chai';
import path from 'path';

// workspace base dir: '/'
suite('Extension util Suite', () => {
  const basePath = VSCodeUtil.getWorkspaceBasePath();
  
  test('test getCurrentModuleName', () => {
    const modulePath = path.resolve(basePath, 'foo/bar/file.js');
    const moduleName = VSCodeUtil.getCurrentModuleName(modulePath);
    assert.strictEqual(moduleName, 'foo/bar/file');
  });

  test('test getModuleNameFromRelativeImport', () => {
    let moduleName = '';
    let modulePath = '';

    modulePath = path.resolve(basePath, 'foo/bar/file.js');
    moduleName = VSCodeUtil.getModuleNameFromRelativeImport(modulePath, './another');
    assert.strictEqual(moduleName, 'foo/bar/another');

    moduleName = VSCodeUtil.getModuleNameFromRelativeImport(modulePath, '../another');
    assert.strictEqual(moduleName, 'foo/another');
  });
});