import * as vscode from 'vscode'
const pkg = require('../package.json')

import FoldingProvider from './foldingProvider'

const VERSION_ID = 'explicitFoldingVersion'

let $disposable: vscode.Disposable | null = null;

function setup(context: vscode.ExtensionContext) { // {{{
	if ($disposable !== null) {
		$disposable.dispose();
	}

	const config = vscode.workspace.getConfiguration('folding');
	const subscriptions: vscode.Disposable[] = [];

	let provider, disposable;
	for(let name of Object.keys(config).filter(name => typeof config[name] === 'object')) {
		if(name === '*') {
			provider = new FoldingProvider(config[name]);

			subscriptions.push(disposable = vscode.languages.registerFoldingRangeProvider({ scheme: 'file' }, provider));
			context.subscriptions.push(disposable);
		}
		else {
			provider = new FoldingProvider(config[name]);

			subscriptions.push(disposable = vscode.languages.registerFoldingRangeProvider({ language: name, scheme: 'file' }, provider));
			context.subscriptions.push(disposable);
		}
	}

	$disposable = vscode.Disposable.from(...subscriptions);
} // }}}

async function showWhatsNewMessage(version: string) { // {{{
	const actions: vscode.MessageItem[] = [{
		title: 'Homepage'
	}, {
		title: 'Release Notes'
	}];

	const result = await vscode.window.showInformationMessage(
		`Explicit Folding has been updated to v${version} — check out what's new!`,
		...actions
	);

	if(result != null) {
		if(result === actions[0]) {
			await vscode.commands.executeCommand(
				'vscode.open',
				vscode.Uri.parse(`${pkg.homepage}`)
			);
		}
		else if(result === actions[1]) {
			await vscode.commands.executeCommand(
				'vscode.open',
				vscode.Uri.parse(`${pkg.homepage}/blob/master/CHANGELOG.md`)
			);
		}
	}
} // }}}

export async function activate(context: vscode.ExtensionContext) { // {{{
	const previousVersion = context.globalState.get<string>(VERSION_ID);
	const currentVersion = pkg.version;

	const config = vscode.workspace.getConfiguration('explicitFolding');

	if(previousVersion === undefined || currentVersion !== previousVersion) {
		context.globalState.update(VERSION_ID, currentVersion);

		const notification = config.get<string>('notification');

		if(previousVersion === undefined) {
			// don't show notification on install
		}
		else if(notification === 'major') {
			if(currentVersion.split('.')[0] > previousVersion.split('.')[0]) {
				showWhatsNewMessage(currentVersion);
			}
		}
		else if(notification === 'minor') {
			if(currentVersion.split('.')[0] > previousVersion.split('.')[0] || (currentVersion.split('.')[0] === previousVersion.split('.')[0]) && currentVersion.split('.')[1] > previousVersion.split('.')[1]) {
				showWhatsNewMessage(currentVersion);
			}
		}
		else if(notification !== 'none') {
			showWhatsNewMessage(currentVersion);
		}
	}

	const delay = config.get<number>('startupDelay');
	if(delay && delay > 0) {
		setTimeout(() => setup(context), delay);
	}
	else {
		setup(context)
	}

	vscode.workspace.onDidChangeConfiguration(event => {
		if(event.affectsConfiguration('folding')) {
			setup(context);
		}
	});
} // }}}
