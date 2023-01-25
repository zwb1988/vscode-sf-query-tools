// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

// import { SoqlAnalyzer } from "./soqlanalyzer/analyzer";
import QueryPlanViewProvider from "./soqlplan/QueryPlanViewProvider";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log("Salesforce Query Tools is now active!");

    //initSoqlAnalyzer(context);
    initSoqlPlan(context);
}

/**
function initSoqlAnalyzer(context: vscode.ExtensionContext) {
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand(
        "sftb.soqlanalyze",
        (fileName: string | undefined) => {
            // The code you place here will be executed e6very time your command is executed
            // Display a message box to the user
            vscode.window.showInformationMessage("Starting SOQL Analyzer...");

            const analyzer = new SoqlAnalyzer();
            let targetFile = "";
            if (!fileName && vscode.window.activeTextEditor) {
                targetFile = vscode.window.activeTextEditor.document.fileName;
            }

            analyzer.run(context, targetFile);
        }
    );

    context.subscriptions.push(disposable);
}
*/

function initSoqlPlan(context: vscode.ExtensionContext) {
    let explainerView = new QueryPlanViewProvider(context);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            QueryPlanViewProvider.viewId,
            explainerView
        )
    );
}

// this method is called when your extension is deactivated
export function deactivate() {}
