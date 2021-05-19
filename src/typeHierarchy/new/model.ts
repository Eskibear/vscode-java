import * as vscode from "vscode";
import { SymbolItemNavigation, SymbolTreeInput, SymbolTreeModel } from "../references-view";
import { getActiveLanguageClient } from "../../extension";
import { LanguageClient } from "vscode-languageclient/node";
import { CancellationToken, commands, workspace } from "vscode";
import { TypeHierarchyItem_Code } from "../../protocol";

export class TypeHierarchyTreeInput implements SymbolTreeInput<TypeHierarchyItem_Code> {
	readonly contextValue: string = "javaTypeHierarchy";
	readonly title: string;

	constructor(readonly location: vscode.Location, readonly mode: "supertypes" | "subtypes" | "classview", readonly baseItems: TypeHierarchyItem_Code[] /*, readonly token: CancellationToken */) {
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
		const treeDataProvider = new TypeHierarchyTreeDataProvider(this.mode, this.baseItems);

		const treeModel: SymbolTreeModel<TypeHierarchyItem_Code> = {
			message: "a meesage: e.g. 2000 items found",
			provider: treeDataProvider,
			navigation: undefined // Optional
		};
		return null;
	}

	with(location: vscode.Location): SymbolTreeInput<TypeHierarchyItem_Code> {
		return new TypeHierarchyTreeInput(location, this.mode, this.baseItems);
	}

	// async resolve(): Promise<SymbolTreeModel<TypeHierarchyItem>> {
	// 	if (!this.client) {
	// 		this.client = await getActiveLanguageClient();
	// 	}
	// 	// workaround: await a second to make sure the success of reveal operation on baseItem, see: https://github.com/microsoft/vscode/issues/114989
	// 	await new Promise<void>((resolve) => setTimeout(() => {
	// 		resolve();
	// 	}, 1000));

	// 	this.rootItem = (this.direction === TypeHierarchyDirection.Both) ? await getRootItem(this.client, this.baseItem, this.token) : this.baseItem;
	// 	const model: TypeHierarchyModel = new TypeHierarchyModel(this.rootItem, this.direction, this.baseItem);
	// 	const provider = new TypeHierarchyTreeDataProvider(model, this.client, this.token);
	// 	const treeModel: SymbolTreeModel<TypeHierarchyItem> = {
	// 		provider: provider,
	// 		message: undefined,
	// 		navigation: model,
	// 		dispose() {
	// 			provider.dispose();
	// 		}
	// 	};
	// 	commands.executeCommand('setContext', 'typeHierarchyDirection', typeHierarchyDirectionToContextString(this.direction));
	// 	commands.executeCommand('setContext', 'typeHierarchySymbolKind', this.baseItem.kind);
	// 	return treeModel;
	// }

	// with(location: vscode.Location): TypeHierarchyTreeInput {
	// 	return new TypeHierarchyTreeInput(location, this.direction, this.token, this.baseItem);
	// }
}

class TypeHierarchyTreeDataProvider implements vscode.TreeDataProvider<TypeHierarchyItem_Code> {
	private readonly _emitter: vscode.EventEmitter<TypeHierarchyItem_Code> = new vscode.EventEmitter<TypeHierarchyItem_Code>();
	public readonly onDidChangeTreeData: vscode.Event<TypeHierarchyItem_Code> = this._emitter.event;

	constructor(readonly mode: "supertypes" | "subtypes" | "classview", readonly baseItems: TypeHierarchyItem_Code[]){}

	dispose(): void {
		this._emitter.dispose();
	}

	async getTreeItem(element: TypeHierarchyItem_Code): Promise<vscode.TreeItem> {
		if (!element) {
			return undefined;
		}
		const treeItem: vscode.TreeItem = new vscode.TreeItem(element.name);
		treeItem.contextValue = "true"; // ???
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

		// workaround: set a specific id to refresh the collapsible state for treeItems, see: https://github.com/microsoft/vscode/issues/114614#issuecomment-763428052
		treeItem.id = `${element.data}${Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)}`;
		return treeItem;
	}

	async getChildren(element?: TypeHierarchyItem_Code): Promise<TypeHierarchyItem_Code[]> {
		if (element === undefined) {
			return this.baseItems;
		}

		// TODO: send requests for subtypes / supertypes
		switch (this.mode) {
			case "classview":
				break; 
			case "subtypes": 
				break;
			case "supertypes":
				break;
			default:
				break;
		}
		
		return undefined;
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
}
