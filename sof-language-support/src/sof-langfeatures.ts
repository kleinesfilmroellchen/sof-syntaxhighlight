// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { close } from 'fs';

// taken from sof interpreter - Patterns.java, adjusted for JS regexes
const sofTokenRegex: RegExp = /("((?:[^"]|(\\"))*?(?<!\\))")|(\S+)/gmu;
const sofIdentifierRegex: RegExp = /\p{L}(?:\p{L}|[0-9_':])*/gmu;
const sofBoolPatternRegex: RegExp = /True|False|true|false/gmu;
const sofIntegerPatternRegex: RegExp = /(\+|-)?(?:((?:0d)?[0-9]+)|(0[xh][0-9a-fA-F]+)|(0o[0-7]+)|(0b[01]+)|0)/gmu;
const sofFunctionDefinitionRegex: RegExp = /(?:\s+|^)\}\s+((?:\+|-)?(?:(?:(?:0d)?[0-9]+)|(?:0[xh][0-9a-fA-F]+)|(?:0o[0-7]+)|(?:0b[01]+)|0))\s+(function)\s+(\p{L}(?:\p{L}|[0-9_':])*)\s+(def|globaldef)\b/gmu;
const sofVariableDefinitionRegex: RegExp = /\b(?<!function\s+)(\p{L}(?:\p{L}|[0-9_':])*)\s+(def|globaldef)\b/gmu;

const zip = (...rows: any[][]) => [...rows[0]].map((_, c) => rows.map(row => row[c]));

export function activate(context: vscode.ExtensionContext) {
	console.log('Activated sof-language-support');

	vscode.languages.registerDocumentSymbolProvider('klfr-sof', {
		provideDocumentSymbols(document) {
			const text: string = document.getText();

			// function symbols
			const functionMatches: Array<{ fmatch: RegExpExecArray, lastIndex: number }> = [];
			let result: RegExpExecArray | null = null;
			while ((result = sofFunctionDefinitionRegex.exec(text))) {
				functionMatches.push({ fmatch: result, lastIndex: sofFunctionDefinitionRegex.lastIndex });
			}

			const fsymbols = <Array<vscode.DocumentSymbol>>functionMatches.map(({ fmatch, lastIndex }) => {
				console.log(fmatch, lastIndex);
				const argcount: string = fmatch[1], name: string = fmatch[3], deftype: string = fmatch[4];
				return new vscode.DocumentSymbol(name, `${deftype === 'globaldef' ? 'global' : 'local'} ${argcount} args`,
					vscode.SymbolKind.Function,
					new vscode.Range(document.positionAt(fmatch.index), document.positionAt(lastIndex)),
					new vscode.Range(document.positionAt(fmatch.index), document.positionAt(lastIndex)));
			}).filter(x => x !== null);


			// variable symbols
			const variableMatches: Array<{ vmatch: RegExpExecArray, lastIndex: number }> = [];
			result = null;
			while ((result = sofVariableDefinitionRegex.exec(text))) {
				variableMatches.push({ vmatch: result, lastIndex: sofVariableDefinitionRegex.lastIndex });
			}

			const vsymbols = <Array<vscode.DocumentSymbol>>variableMatches.map(({ vmatch, lastIndex }) => {
				console.log(vmatch, lastIndex);
				const name: string = vmatch[1], global: boolean = vmatch[2] === 'globaldef';
				return new vscode.DocumentSymbol(name, global ? 'global' : 'local',
					vscode.SymbolKind.Variable,
					new vscode.Range(document.positionAt(vmatch.index), document.positionAt(lastIndex)),
					new vscode.Range(document.positionAt(vmatch.index), document.positionAt(lastIndex)));
			}).filter(x => x !== null);

			return fsymbols.concat(vsymbols);
		}
	});
}

export function deactivate() { }
