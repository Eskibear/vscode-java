
// added by Yan Zhang

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