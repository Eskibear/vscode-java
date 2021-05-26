import * as vscode from "vscode";
import { SymbolItemNavigation, SymbolTreeInput, SymbolTreeModel } from "../references-view";
import { getActiveLanguageClient } from "../../extension";
import { LanguageClient } from "vscode-languageclient/node";
import { CancellationToken, commands, workspace } from "vscode";
import { TypeHierarchyItem_Code } from "../../protocol";
import { getThemeIcon, isClass, isSameType } from "./utils";

export class ClassViewTreeInput implements SymbolTreeInput<TypeHierarchyItem_Code> {
	readonly contextValue: string = "javaTypeHierarchy";
	public title: string = "Class View";;
	private dataProvider: ClassViewTreeDataProvider;
	private treeModel: SymbolTreeModel<TypeHierarchyItem_Code>;

	constructor(readonly location: vscode.Location, readonly baseItems: TypeHierarchyItem_Code[] /*, readonly token: CancellationToken */) {
	}

	async resolve(): Promise<SymbolTreeModel<TypeHierarchyItem_Code>> {
		this.dataProvider = new ClassViewTreeDataProvider(this);

		this.treeModel = {
			message: "class view: we can put a message here with reference view API",
			provider: this.dataProvider,
			navigation: undefined // Optional
		};
		return this.treeModel;
	}

	with(location: vscode.Location): SymbolTreeInput<TypeHierarchyItem_Code> {
		return new ClassViewTreeInput(location, this.baseItems);
	}

	public setMessage(message: string) {
		this.treeModel.message = message;
	}
}

class ClassViewTreeDataProvider implements vscode.TreeDataProvider<TypeHierarchyItem_Code> {
	private readonly _emitter: vscode.EventEmitter<TypeHierarchyItem_Code> = new vscode.EventEmitter<TypeHierarchyItem_Code>();
	public readonly onDidChangeTreeData: vscode.Event<TypeHierarchyItem_Code> = this._emitter.event;
	private baseTypeTraversed: boolean;

	constructor(private treeInput: ClassViewTreeInput) { }

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

		// expand till current type
		if (this.baseTypeTraversed) {
			treeItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
		} else {
			treeItem.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
		}

		if (!this.baseTypeTraversed && this.treeInput.baseItems.find(item => isSameType(element, item))) {
			this.baseTypeTraversed = true;	
		}

		// prefetch next level to predict collapsible state
		const children: TypeHierarchyItem_Code[] = await vscode.commands.executeCommand("java.subtypes", element);
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
			if (this.treeInput.baseItems.find(isClass)) {
				return Promise.all(this.treeInput.baseItems.filter(isClass).map(async (item): Promise<TypeHierarchyItem_Code> => await vscode.commands.executeCommand("java.rootType", item)));
			} else {
				return [];
			}
		}

		if (this.typesCache.has(element)) {
			return this.typesCache.get(element);
		}

		return vscode.commands.executeCommand("java.subtypes", element);
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
