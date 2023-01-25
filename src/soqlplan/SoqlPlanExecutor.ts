import * as vscode from "vscode";
import * as childProcess from "node:child_process";
import axios, { AxiosInstance } from "axios";

import { config } from "../config";

export class SoqlPlanExecutor {
    private context: vscode.ExtensionContext;
    private sfdxOrgInfo: any;
    private sfConnection?: AxiosInstance;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    public login(): Promise<string> {
        const cmd = `sfdx force:org:display --json`;

        const saCmd = childProcess.exec(cmd, {});

        let stdErrMsg = "";
        const saPromise: Promise<string> = new Promise((resolve, reject) => {
            saCmd.addListener("error", (ex: any) => {
                console.error(`Failed to execute command! ${ex}`);
                reject(ex);
            });
            saCmd.addListener("exit", (ex: any) => {
                if (ex !== 0) {
                    console.error(`Failed Exit Code: ${ex}`);
                    reject(stdErrMsg);
                } else {
                    resolve("");
                }
            });
            saCmd.stdout?.on("data", (msg: any) => {
                let response = JSON.parse(msg);
                if (!response) {
                    stdErrMsg +=
                        "Failed to get response from sfdx command output";
                } else if (response.result) {
                    this.sfdxOrgInfo = response.result;
                    this.sfConnection = axios.create({
                        headers: {
                            authorization: `Bearer ${this.sfdxOrgInfo.accessToken}`
                        }
                    });
                } else if (response.exitCode && response.exitCode === 1) {
                    if (response.context === "OrgDisplayCommand") {
                        stdErrMsg += `Failed to execute command: [${response.context}]. ${response.message}. Also ensure you are querying within a SFDX project.`;
                    } else {
                        stdErrMsg += `Failed to execute command: [${response.context}]. ${response.message}`;
                    }
                }
            });
            saCmd.stderr?.on("data", (msg: any) => {
                stdErrMsg += msg;
            });
        });
        return saPromise;
    }

    public async run(query: string) {
        let error = "";
        try {
            error = await this.login();
        } catch (ex: any) {
            error = String(ex);
        }

        return new Promise((resolve, reject) => {
            if (error) {
                reject(error);
                return;
            }

            //replace newlines with spaces before sending to the server
            const QUERY_PLAN_URI: string = `/services/data/v${config.apiVersion}/query?explain=`;
            query = query.replace(/\r?\n|\r/g, " ");
            let calloutUri =
                this.sfdxOrgInfo.instanceUrl + QUERY_PLAN_URI + query;
            this.sfConnection
                ?.get(calloutUri)
                .then((result) => {
                    resolve(result);
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }
}
