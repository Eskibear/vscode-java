import * as vscode from "vscode";
import { SymbolItemNavigation, SymbolTreeInput, SymbolTreeModel } from "../references-view";
import { getActiveLanguageClient } from "../../extension";
import { LanguageClient } from "vscode-languageclient/node";
import { CancellationToken, commands, workspace } from "vscode";
import { TypeHierarchyItem_Code } from "../../protocol";

export class TypeHierarchyTreeInput implements SymbolTreeInput<TypeHierarchyItem_Code> {
	readonly contextValue: string = "javaTypeHierarchy";
	public title: string;
	private dataProvider: TypeHierarchyTreeDataProvider;
	private treeModel: SymbolTreeModel<TypeHierarchyItem_Code>;

	constructor(readonly location: vscode.Location, public mode: "supertypes" | "subtypes" | "classview", readonly baseItems: TypeHierarchyItem_Code[] /*, readonly token: CancellationToken */) {
		switch (mode) {
			case "classview":
				this.title = "Class View";
				break;
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
		treeItem.iconPath = TypeHierarchyTreeDataProvider.getThemeIcon(element.kind);
		if (element.uri !== undefined) {
			treeItem.command = {
				command: 'vscode.open',
				title: 'Open Type Definition Location',
				arguments: [
					vscode.Uri.parse(element.uri), <vscode.TextDocumentShowOptions>{ selection: element.selectionRange }
				]
			};
		}

		treeItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
		// prefetch next level to predict collapsible state
		let children: TypeHierarchyItem_Code[];
		switch (this.treeInput.mode) {
			case "classview": 
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
			if (this.treeInput.mode === "classview") {
				if (this.treeInput.baseItems.find(TypeHierarchyTreeDataProvider.isClass)) {
					return Promise.all(this.treeInput.baseItems.filter(TypeHierarchyTreeDataProvider.isClass).map(async (item): Promise<TypeHierarchyItem_Code> => await vscode.commands.executeCommand("java.rootType", item)));
				} else {
					return [];
				}
			} else {
				return this.treeInput.baseItems;
			}
		}

		if (this.typesCache.has(element)) {
			return this.typesCache.get(element);
		}

		switch (this.treeInput.mode) {
			case "classview":
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

	private static themeIconIds = [
		'symbol-file', 'symbol-module', 'symbol-namespace', 'symbol-package', 'symbol-class', 'symbol-method',
		'symbol-property', 'symbol-field', 'symbol-constructor', 'symbol-enum', 'symbol-interface',
		'symbol-function', 'symbol-variable', 'symbol-constant', 'symbol-string', 'symbol-number', 'symbol-boolean',
		'symbol-array', 'symbol-object', 'symbol-key', 'symbol-null', 'symbol-enum-member', 'symbol-struct',
		'symbol-event', 'symbol-operator', 'symbol-type-parameter'
	];

	private static getThemeIcon(kind: vscode.SymbolKind): vscode.ThemeIcon | undefined {
		const id = TypeHierarchyTreeDataProvider.themeIconIds[kind];
		return id ? new vscode.ThemeIcon(id) : undefined;
	}

	private static isClass(item: TypeHierarchyItem_Code) {
		return item.kind === vscode.SymbolKind.Class;
	}
}
