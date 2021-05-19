
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