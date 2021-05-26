
// added by Yan Zhang
import * as vscode from "vscode";
import { LanguageClient } from "vscode-languageclient/node";
import { TypeHierarchyItem_Code, TypeHierarchyItem_LS } from "../../protocol";

export function lsp2Code(client: LanguageClient, itemInLsp: TypeHierarchyItem_LS): TypeHierarchyItem_Code {
	const itemInCode: TypeHierarchyItem_Code = {
        name: itemInLsp.name,
        uri: itemInLsp.uri,
        data: itemInLsp.data,
        detail: itemInLsp.detail,
        kind: client.protocol2CodeConverter.asSymbolKind(itemInLsp.kind),
        range: client.protocol2CodeConverter.asRange(itemInLsp.range),
        selectionRange: client.protocol2CodeConverter.asRange(itemInLsp.selectionRange), // TODO: selectionRange vs Range ?
        tags: client.protocol2CodeConverter.asSymbolTags(itemInLsp.tags)
    };
    return itemInCode;
}

export function code2Lsp(client: LanguageClient, itemInCode: TypeHierarchyItem_Code): TypeHierarchyItem_LS {
	const itemInLsp: TypeHierarchyItem_LS = {
        name: itemInCode.name,
        uri: itemInCode.uri,
        data: itemInCode.data,
        detail: itemInCode.detail,
        kind: client.code2ProtocolConverter.asSymbolKind(itemInCode.kind),
        range: client.code2ProtocolConverter.asRange(itemInCode.range),
        selectionRange: client.code2ProtocolConverter.asRange(itemInCode.selectionRange), // TODO: selectionRange vs Range ?
        tags: itemInCode.tags ? client.code2ProtocolConverter.asSymbolTags(itemInCode.tags) : undefined
    };
    return itemInLsp;
}

// must NOT change order.
const themeIconIds = [
    'symbol-file', 'symbol-module', 'symbol-namespace', 'symbol-package', 'symbol-class', 'symbol-method',
    'symbol-property', 'symbol-field', 'symbol-constructor', 'symbol-enum', 'symbol-interface',
    'symbol-function', 'symbol-variable', 'symbol-constant', 'symbol-string', 'symbol-number', 'symbol-boolean',
    'symbol-array', 'symbol-object', 'symbol-key', 'symbol-null', 'symbol-enum-member', 'symbol-struct',
    'symbol-event', 'symbol-operator', 'symbol-type-parameter'
];

export function getThemeIcon(kind: vscode.SymbolKind): vscode.ThemeIcon | undefined {
    const id = themeIconIds[kind];
    return id ? new vscode.ThemeIcon(id) : undefined;
}

export function isClass(item: TypeHierarchyItem_Code) {
    return item.kind === vscode.SymbolKind.Class;
}

export function isSameType(a: TypeHierarchyItem_Code, b: TypeHierarchyItem_Code) {
    return (a.data as any).typeId === (b.data as any).typeId;
}