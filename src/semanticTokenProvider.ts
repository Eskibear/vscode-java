import * as vscode from 'vscode';
import { Commands } from './commands';
import { getJavaConfiguration } from './utils';

export function registerSemanticTokensProvider(context: vscode.ExtensionContext) {
	if (isSemanticHTokensEnabled()) {
		getSemanticTokensLegend().then(legend => {
			const semanticTokensProviderDisposable = vscode.languages.registerDocumentSemanticTokensProvider({ scheme: 'file', language: 'java' }, semanticTokensProvider, legend);
			context.subscriptions.push(semanticTokensProviderDisposable);
			onceSemanticTokenEnabledChange(context, semanticTokensProviderDisposable);
		});
	} else {
		onceSemanticTokenEnabledChange(context, undefined);
	}
}

class SemanticTokensProvider implements vscode.DocumentSemanticTokensProvider {
    async provideDocumentSemanticTokens(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<vscode.SemanticTokens> {
        const response = await vscode.commands.executeCommand(Commands.EXECUTE_WORKSPACE_COMMAND, Commands.PROVIDE_SEMANTIC_TOKENS, document.uri.toString());
        if (token.isCancellationRequested) {
            return undefined;
        }
        return response as vscode.SemanticTokens;
    }
}

const semanticTokensProvider = new SemanticTokensProvider();

async function getSemanticTokensLegend(): Promise<vscode.SemanticTokensLegend | undefined> {
    const response = await vscode.commands.executeCommand(Commands.EXECUTE_WORKSPACE_COMMAND, Commands.GET_SEMANTIC_TOKENS_LEGEND) as vscode.SemanticTokensLegend;
    if (response && response.tokenModifiers !== undefined && response.tokenTypes !== undefined) {
        return new vscode.SemanticTokensLegend(response.tokenTypes, response.tokenModifiers);
    }
    return undefined;
}

function onceSemanticTokenEnabledChange(context: vscode.ExtensionContext, registeredDisposable?: vscode.Disposable) {
	const configChangeListener = vscode.workspace.onDidChangeConfiguration(e => {
		configChangeListener.dispose();
		if (e.affectsConfiguration('java.semanticTokens.enabled')) {
			if (isSemanticHTokensEnabled()) {
				// turn on
				registerSemanticTokensProvider(context);
			} else if (registeredDisposable) {
				// turn off
				registeredDisposable.dispose();
			}
			onceSemanticTokenEnabledChange(context);
		}
	});
}

function isSemanticHTokensEnabled(): boolean {
	const config = getJavaConfiguration();
	const section = 'semanticTokens.enabled';
	return config.get(section);
}
