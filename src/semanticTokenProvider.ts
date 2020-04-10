import * as vscode from 'vscode';
import { Commands } from './commands';

class SemanticTokensProvider implements vscode.DocumentSemanticTokensProvider {
    async provideDocumentSemanticTokens(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<vscode.SemanticTokens> {
        const response = await vscode.commands.executeCommand(Commands.EXECUTE_WORKSPACE_COMMAND, Commands.PROVIDE_SEMANTIC_TOKENS, document.uri.toString());
        if (token.isCancellationRequested) {
            return undefined;
        }
        return response as vscode.SemanticTokens;
    }
}

export const semanticTokensProvider = new SemanticTokensProvider();

export async function getSemanticTokensLegend(): Promise<vscode.SemanticTokensLegend | undefined> {
    const response = await vscode.commands.executeCommand(Commands.EXECUTE_WORKSPACE_COMMAND, Commands.GET_SEMANTIC_TOKENS_LEGEND) as vscode.SemanticTokensLegend;
    if (response && response.tokenModifiers !== undefined && response.tokenTypes !== undefined) {
        return new vscode.SemanticTokensLegend(response.tokenTypes, response.tokenModifiers);
    }
    return undefined;
}
