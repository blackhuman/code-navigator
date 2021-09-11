import * as path from 'path';

import { runTests } from 'vscode-test';

async function main() {
	try {
		// The folder containing the Extension Manifest package.json
		// Passed to `--extensionDevelopmentPath`
    console.log('__dirname', __dirname);
		const extensionDevelopmentPath = path.resolve(__dirname, '../../');

		// The path to test runner
		// Passed to --extensionTestsPath
		const extensionTestsPath = path.resolve(__dirname, './index');

		// Download VS Code, unzip it and run the integration test
    console.log('start running test...');
		await runTests({ extensionDevelopmentPath, extensionTestsPath, launchArgs: ['--nolazy', '--inspect=6009'] });
	} catch (err) {
		console.error('Failed to run tests');
		process.exit(1);
	}
}

main();
