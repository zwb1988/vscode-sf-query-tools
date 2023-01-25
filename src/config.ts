import * as vscode from "vscode";

const DEFAULT_API_VERSION = "55.0";

export class Configuration {
    public apiVersion: string | undefined;

    constructor() {
        this.init();
    }

    private init() {
        const config = vscode.workspace.getConfiguration("sfQueryTool");
        this.apiVersion = config.get("apiVersion");
        if (!this.apiVersion) {
            this.apiVersion = DEFAULT_API_VERSION;
        }
    }
}

export let config = new Configuration();
