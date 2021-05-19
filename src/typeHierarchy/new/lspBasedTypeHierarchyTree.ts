import * as vscode from "vscode";
import { LanguageClient } from "vscode-languageclient/node";
import { getActiveLanguageClient } from "../../extension";
import { TypeHierarchyItem_Code } from "../../protocol";
import { SymbolTree, SymbolTreeInput, SymbolTreeModel } from "../references-view";
import { TypeHierarchyTreeInput } from "./model";

class LspBasedTypeHierarchyTree {
    private tree: SymbolTree;
    private client: LanguageClient;


    public async initialize() {
		this.tree = await vscode.extensions.getExtension<SymbolTree>('ms-vscode.references-view').activate();
		this.client = await getActiveLanguageClient();
	}

    public show(item: TypeHierarchyItem_Code[]) {
        const treeInput = new TypeHierarchyTreeInput();
        this.tree.setInput();
    }
}

export const lspBasedTypeHierarchyTree = new LspBasedTypeHierarchyTree();