import * as vscode from 'vscode'

import { ExplicitFoldingProvider } from './foldingProvider'

export function activate(context: vscode.ExtensionContext) {
	const provider = new ExplicitFoldingProvider();
	
	context.subscriptions.push(vscode.languages.registerFoldingRangeProvider({ scheme: 'file' }, provider));
	context.subscriptions.push(vscode.languages.registerFoldingRangeProvider({ scheme: 'untitled' }, provider));
}
