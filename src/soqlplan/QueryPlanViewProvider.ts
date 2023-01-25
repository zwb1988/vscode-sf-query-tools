import * as vscode from "vscode";
import { SoqlPlanExecutor } from "./SoqlPlanExecutor";

export default class QueryPlanViewProvider
    implements vscode.WebviewViewProvider
{
    public static readonly viewId = "zwb-sftool-soql-plan-entry";

    private _view?: vscode.WebviewView;
    private readonly context: vscode.ExtensionContext;
    private readonly planExecutor: SoqlPlanExecutor;
    private readonly extensionUri: vscode.Uri;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.planExecutor = new SoqlPlanExecutor(context);
        this.extensionUri = context.extensionUri;
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            // Allow scripts in the webview
            enableScripts: true,

            localResourceRoots: [this.extensionUri]
        };

        webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage((data: any) => {
            switch (data.type) {
                case "runClicked": {
                    // vscode.window.activeTextEditor?.insertSnippet(
                    //     new vscode.SnippetString(`#${data.value.query}`)
                    // );
                    let query = data?.value?.query;
                    if (query) {
                        this.runQueryPlan(query);
                    }
                    break;
                }
            }
        });
    }

    public runQueryPlan(query: string) {
        if (!this.planExecutor || !query) {
            return;
        }
        let planExec = new Promise((resolve, reject) => {
            this.planExecutor
                .run(query)
                .then((result: any) => {
                    if (result && result.status === 200) {
                        resolve(result);
                        return;
                    }
                    reject(result);
                })
                .catch((err: any) => {
                    reject(err);
                });
        });

        vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                cancellable: false,
                title: "Executing query plan ..."
            },
            async (progress) => {
                try {
                    let result: any = await planExec;
                    this.displayQueryPlanResult(result.data);
                    progress.report({ increment: 100 });
                    vscode.window.showInformationMessage(
                        "Query plan execution completed"
                    );
                } catch (err: any) {
                    console.error(err);
                    let errData = err?.response?.data;
                    if (errData && errData.length > 0) {
                        await vscode.window.showErrorMessage(
                            `Query plan execution failed. [${errData[0].errorCode}] ${errData[0].message}`
                        );
                    } else {
                        await vscode.window.showErrorMessage(
                            `Query plan execution failed: ${err}`
                        );
                    }
                } finally {
                    this._view?.webview.postMessage({
                        type: "enableRunButton"
                    });
                }
            }
        );
    }

    private displayQueryPlanResult(queryResult: any) {
        this._view?.webview.postMessage({
            type: "queryResult",
            data: queryResult
        });
    }

    private getHtmlForWebview(webview: vscode.Webview) {
        const modelPath = "resources/soqlplan";
        // Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.extensionUri, modelPath, "main.js")
        );

        // Do the same for the stylesheet.
        const styleMainUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.extensionUri, modelPath, "main.css")
        );

        // Use a nonce to only allow a specific script to be run.
        const nonce = getNonce();

        return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<!--
					Use a content security policy to only allow loading styles from our extension directory,
					and only allow scripts that have a specific nonce.
					(See the 'webview-sample' extension sample for img-src content security policy examples)
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${styleMainUri}" rel="stylesheet">
				<title>SOQL Query Plan</title>
			</head>
			<body>
                <div>
                    <label class="main-input-label" for="main-input">Please enter a SOQL statement (without binding variables)</label>
                    <textarea id="main-input" name="soql-input" rows="12" cols="40"></textarea>
                </div>
                <div class="buttons">
                    <button type="button" class="run-button">Run Query Plan</button>
                    <button type="button" class="clear-button">Clear Results</button>
                </div>
				<div class="result">
                    <div class="div-table">
                        <div class="result-table-body div-table-body">
                           <!-- <div class="div-table-row">
                                <div class="div-table-cell">&nbsp;</div>
                                <div class="div-table-cell">&nbsp;</div>
                            </div> -->
                        </div>
                    </div>
                    <div class="result-notes">
                        <!-- <div class="plan-note">
                            <div class="plan-no"></div>
                            <div class="div-table">
                                <div class="div-table-body">
                                    <div class="div-table-row">
                                        <div class="div-table-cell">&nbsp;</div>
                                    </div>
                                </div>
                            </div>
                        </div> -->
                    </div>
                    <div class="result-message"></div>
				<div>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
    }
}

function getNonce() {
    let text = "";
    const possible =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
