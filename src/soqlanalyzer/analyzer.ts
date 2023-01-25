import * as vscode from "vscode";
import * as childProcess from "node:child_process";
import * as os from "node:os";
import * as path from "node:path";

const CP_DELIMITER = os.platform() === "win32" ? ";" : ":";

export class SoqlAnalyzer {
    constructor() {}

    run(context: vscode.ExtensionContext, fileName: string) {
        const { extensionPath } = context;
        const classPath = [
            path.join(`${extensionPath}/tools/soqlanalyzer/`, "lib", "*"),
            path.join(
                `${extensionPath}/tools/soqlanalyzer/`,
                "apexanalyzer-1.0-SNAPSHOT.jar"
            )
        ].join(CP_DELIMITER);
        const cmd = `java -cp "${classPath}" Analyzer ${fileName}`;

        const saCmd = childProcess.exec(cmd, {});

        let stdout = "";
        const saPromise = new Promise((resolve, reject) => {
            saCmd.addListener("error", (ex: any) => {
                console.log("error:" + ex);
                reject(ex);
            });
            saCmd.addListener("exit", (ex: any) => {
                if (ex !== 0 && ex !== 4) {
                    console.log(`Failed Exit Code: ${ex}`);
                    if (!stdout) {
                        reject(
                            'SOQL Analyzer Command Failed!  Enable "Show StdErr" setting for more info.'
                        );
                    }
                }
                resolve(stdout);
            });
            saCmd.stdout?.on("data", (msg: any) => {
                stdout += msg;
            });
            saCmd.stderr?.on("data", (msg: any) => {
                console.log("stderr:" + msg);
            });
        });
        return saPromise;
    }
}
