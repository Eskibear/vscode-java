import * as vscode from "vscode";
import { LanguageClient } from "vscode-languageclient/node";
import { getActiveLanguageClient } from "../../extension";
import { TypeHierarchyItem_Code } from "../../protocol";
import { SymbolTree, SymbolTreeInput, SymbolTreeModel } from "../references-view";
import { TypeHierarchyTreeInput } from "./model";

class LspBasedTypeHierarchyTree {
    private tree: SymbolTree;
    private treeInput: TypeHierarchyTreeInput;

    public async show(location: vscode.Location, items: TypeHierarchyItem_Code[], mode: "supertypes" | "subtypes" | "classview") {
        if (!this.tree) {
            this.tree = await vscode.extensions.getExtension<SymbolTree>('ms-vscode.references-view').activate();
        }
        this.treeInput = new TypeHierarchyTreeInput(location, mode, items);
        this.tree.setInput(this.treeInput);
        
    }

    public showSuperTypes() {
        this.treeInput.mode = "supertypes";
        this.treeInput.title = "Supertype Hierarchy";
        this.tree.setInput(this.treeInput);
    }

    public showSubTypes() {
        this.treeInput.mode = "subtypes";
        this.treeInput.title = "Subtype Hierarchy";
        this.tree.setInput(this.treeInput);
    }

    public showClassView() {
        this.treeInput.mode = "classview";
        this.treeInput.title = "Class View";
        this.tree.setInput(this.treeInput);
    }
}

export const lspBasedTypeHierarchyTree = new LspBasedTypeHierarchyTree();