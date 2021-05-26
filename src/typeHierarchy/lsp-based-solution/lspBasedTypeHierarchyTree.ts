import * as vscode from "vscode";
import { LanguageClient } from "vscode-languageclient/node";
import { getActiveLanguageClient } from "../../extension";
import { TypeHierarchyItem_Code } from "../../protocol";
import { SymbolTree, SymbolTreeInput, SymbolTreeModel } from "../references-view";
import { ClassViewTreeInput } from "./classViewTreeInput";
import { TypeHierarchyTreeInput } from "./lspBasedTreeInput";

class LspBasedTypeHierarchyTree {
    private tree: SymbolTree;
    private treeInput: TypeHierarchyTreeInput | ClassViewTreeInput;

    public async show(location: vscode.Location, items: TypeHierarchyItem_Code[], mode: "supertypes" | "subtypes" | "classview") {
        if (!this.tree) {
            this.tree = await vscode.extensions.getExtension<SymbolTree>('ms-vscode.references-view').activate();
        }
        switch (mode) {
            case "classview":
                this.treeInput = new ClassViewTreeInput(location, items);
                vscode.commands.executeCommand('setContext', 'typeHierarchyMode', "classview");

                break;
            case "subtypes":
            case "supertypes":
                this.treeInput = new TypeHierarchyTreeInput(location, mode, items);
                vscode.commands.executeCommand('setContext', 'typeHierarchyMode', this.treeInput.mode);

                break;
            default:
                break;
        }
        this.tree.setInput(this.treeInput);
    }

    public showSuperTypes() {
        if (this.treeInput instanceof TypeHierarchyTreeInput) {
            this.treeInput.mode = "supertypes";
            this.treeInput.title = "Supertype Hierarchy";
        } else {
            this.treeInput = new TypeHierarchyTreeInput(this.treeInput.location, "supertypes", this.treeInput.baseItems);
        }
        this.tree.setInput(this.treeInput);
        vscode.commands.executeCommand('setContext', 'typeHierarchyMode', this.treeInput.mode);
    }

    public showSubTypes() {
        if (this.treeInput instanceof TypeHierarchyTreeInput) {
            this.treeInput.mode = "subtypes";
            this.treeInput.title = "Subtype Hierarchy";
        } else {
            this.treeInput = new TypeHierarchyTreeInput(this.treeInput.location, "subtypes", this.treeInput.baseItems);
        }
        this.tree.setInput(this.treeInput);
        vscode.commands.executeCommand('setContext', 'typeHierarchyMode', this.treeInput.mode);
    }

    public showClassView() {
        if (this.treeInput instanceof TypeHierarchyTreeInput) {
            this.treeInput = new ClassViewTreeInput(this.treeInput.location, this.treeInput.baseItems);
        }
        this.tree.setInput(this.treeInput);
        vscode.commands.executeCommand('setContext', 'typeHierarchyMode', "classview");
    }
}

export const lspBasedTypeHierarchyTree = new LspBasedTypeHierarchyTree();