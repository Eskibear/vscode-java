import * as vscode from "vscode";
import { SymbolItemNavigation, SymbolTreeInput, SymbolTreeModel } from "../references-view";
import { getActiveLanguageClient } from "../../extension";
import { LanguageClient } from "vscode-languageclient/node";
import { CancellationToken, commands, workspace } from "vscode";
import { TypeHierarchyItem_Code } from "../../protocol";
import { getThemeIcon, isClass } from "./utils";

export class TypeHierarchyTreeInput implements SymbolTreeInput<TypeHierarchyItem_Code> {
	readonly contextValue: string = "javaTypeHierarchy";
	public title: string;
	private dataProvider: TypeHierarchyTreeDataProvider;
	private treeModel: SymbolTreeModel<TypeHierarchyItem_Code>;

	constructor(readonly location: vscode.Location, public mode: "supertypes" | "subtypes", readonly baseItems: TypeHierarchyItem_Code[] /*, readonly token: CancellationToken */) {
		switch (mode) {
			case "supertypes":
				this.title = "Supertype Hierarchy";
				break;
			case "subtypes":
				this.title = "Subtype Hierarchy";
				break;
			default:
				return;
		}
	}

	async resolve(): Promise<SymbolTreeModel<TypeHierarchyItem_Code>> {
		this.dataProvider = new TypeHierarchyTreeDataProvider(this);

		this.treeModel = {
			message: "we can put a message here with reference view API",
			provider: this.dataProvider,
			navigation: undefined // Optional
		};
		return this.treeModel;
	}

	with(location: vscode.Location): SymbolTreeInput<TypeHierarchyItem_Code> {
		return new TypeHierarchyTreeInput(location, this.mode, this.baseItems);
	}

	public setMessage(message: string) {
		this.treeModel.message = message;
	}
}

class TypeHierarchyTreeDataProvider implements vscode.TreeDataProvider<TypeHierarchyItem_Code> {
	private readonly _emitter: vscode.EventEmitter<TypeHierarchyItem_Code> = new vscode.EventEmitter<TypeHierarchyItem_Code>();
	public readonly onDidChangeTreeData: vscode.Event<TypeHierarchyItem_Code> = this._emitter.event;

	constructor(private treeInput: TypeHierarchyTreeInput) {}

	private typesCache: Map<TypeHierarchyItem_Code, TypeHierarchyItem_Code[]> = new Map();

	dispose(): void {
		this._emitter.dispose();
	}

	async getTreeItem(element: TypeHierarchyItem_Code): Promise<vscode.TreeItem> {
		if (!element) {
			return undefined;
		}
		const treeItem: vscode.TreeItem = new vscode.TreeItem(element.name);
		treeItem.description = element.detail;
		treeItem.iconPath = getThemeIcon(element.kind);
		if (element.uri !== undefined) {
			treeItem.command = {
				command: 'vscode.open',
				title: 'Open Type Definition Location',
				arguments: [
					vscode.Uri.parse(element.uri), <vscode.TextDocumentShowOptions>{ selection: element.selectionRange }
				]
			};
		}

		if (this.treeInput.baseItems.includes(element)) {
			treeItem.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
		} else {
			treeItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
		}

		// prefetch next level to predict collapsible state
		let children: TypeHierarchyItem_Code[];
		switch (this.treeInput.mode) { 
			case "subtypes":
				children = await vscode.commands.executeCommand("java.subtypes", element);
				break;
			case "supertypes":
				children = await vscode.commands.executeCommand("java.supertypes", element);
				break;
			default:
		}
		if (children?.length !== undefined) {
			this.typesCache.set(element, children);
			if (children.length === 0) {
				treeItem.collapsibleState = vscode.TreeItemCollapsibleState.None;
			}
		}

		return treeItem;
	}

	async getChildren(element?: TypeHierarchyItem_Code): Promise<TypeHierarchyItem_Code[]> {
		if (element === undefined) {
			return this.treeInput.baseItems;
		}

		if (this.typesCache.has(element)) {
			return this.typesCache.get(element);
		}

		switch (this.treeInput.mode) {
			case "subtypes":
				return vscode.commands.executeCommand("java.subtypes", element);
			case "supertypes":
				return vscode.commands.executeCommand("java.supertypes", element);
			default:
				break;
		}

		return [];
	}

	private static isWhiteListType(item: TypeHierarchyItem_Code): boolean {
		if (item.name === "Object" && item.detail === "java.lang") {
			return true;
		}
		return false;
	}

	private static getFakeItem(item: TypeHierarchyItem_Code): TypeHierarchyItem_Code {
		let message: string;
		if (item.name === "Object" && item.detail === "java.lang") {
			message = "All classes are subtypes of java.lang.Object.";
		}
		return {
			name: message,
			kind: undefined,
			detail: undefined,
			uri: undefined,
			range: undefined,
			selectionRange: undefined,
			data: undefined,
		};
	}


}
