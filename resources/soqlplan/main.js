// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
    const vscode = acquireVsCodeApi();

    // get previous view state
    const viewState = vscode.getState() || { viewState: {} };

    // restore previous view state
    if (viewState) {
        if (viewState.query) {
            let queryInput = document.querySelector("#main-input");
            queryInput.value = viewState.query;
        }
        if (viewState.queryPlanResult) {
            displayQueryPlan(viewState.queryPlanResult);
        }
    }

    const runButton = document.querySelector(".run-button");
    if (runButton) {
        runButton.addEventListener("click", () => {
            runButton.setAttribute("disabled", true);
            let textInput = document.querySelector("#main-input").value;
            viewState.query = textInput;
            vscode.postMessage({
                type: "runClicked",
                value: {
                    query: textInput
                }
            });
        });
    }

    const clearButton = document.querySelector(".clear-button");
    if (clearButton) {
        clearButton.addEventListener("click", () => {
            clearResults();
            if (viewState.queryPlanResult) {
                delete viewState.queryPlanResult;
            }
            vscode.setState(viewState);
        });
    }

    // Handle messages sent from the extension to the webview
    window.addEventListener("message", (event) => {
        const message = event.data; // The json data that the extension sent
        switch (message.type) {
            case "queryResult": {
                queryPlanResult = message.data;
                viewState.queryPlanResult = queryPlanResult;
                displayQueryPlan(queryPlanResult);
                vscode.setState(viewState);
                break;
            }
            case "enableRunButton": {
                runButton.removeAttribute("disabled");
                break;
            }
        }
    });

    function clearResults() {
        // clear query plan results
        let divResultTableBody = document.querySelector(".result-table-body");
        while (divResultTableBody.hasChildNodes()) {
            divResultTableBody.removeChild(divResultTableBody.lastChild);
        }
        let divResultNotes = document.querySelector(".result-notes");
        while (divResultNotes.hasChildNodes()) {
            divResultNotes.removeChild(divResultNotes.lastChild);
        }
        let divResultMsg = document.querySelector(".result-message");
        divResultMsg.textContent = "";

        return {
            divResultTableBody,
            divResultNotes,
            divResultMsg
        };
    }

    function displayQueryPlan(result) {
        if (!result) {
            return;
        }

        // clear query plan results
        const { divResultTableBody, divResultMsg } = clearResults();

        // populate query plan results
        if (result && result.plans && result.plans.length > 0) {
            createResultTableHeaderRow(divResultTableBody);
            createResultTable(divResultTableBody, result);
            createResultNotes(result);
        } else if (result && result.plans && result.plans.length === 0) {
            divResultMsg.textContent = "No query plans returned";
        } else {
            divResultMsg.textContent = "No results returned";
        }
    }

    function createResultTableHeaderRow(resultTable) {
        const divRow = document.createElement("div");
        divRow.className = "div-table-row";

        const divPlanNoCell = document.createElement("div");
        divPlanNoCell.textContent = "Plan #";
        const divCardCell = document.createElement("div");
        divCardCell.textContent = "Cardinality";
        const divFieldsCell = document.createElement("div");
        divFieldsCell.textContent = "Fields";
        const divOpCell = document.createElement("div");
        divOpCell.textContent = "Operation";
        const divRelCostCell = document.createElement("div");
        divRelCostCell.textContent = "Cost";
        const divSObjCardCell = document.createElement("div");
        divSObjCardCell.textContent = "SObject Cardinality";
        const divSObjTypeCell = document.createElement("div");
        divSObjTypeCell.textContent = "SObject Type";

        const divCells = [
            divPlanNoCell,
            divSObjTypeCell,
            divCardCell,
            divFieldsCell,
            divOpCell,
            divRelCostCell,
            divSObjCardCell
        ];

        for (const divCell of divCells) {
            divCell.className = "div-table-title";
            divRow.appendChild(divCell);
        }
        resultTable.appendChild(divRow);
    }

    function createResultTable(resultTable, result) {
        let planCount = 1;
        for (const plan of result.plans) {
            const divRow = document.createElement("div");
            divRow.className = "div-table-row";

            const divPlanNoCell = document.createElement("div");
            divPlanNoCell.textContent = String(planCount);
            const divCardCell = document.createElement("div");
            divCardCell.textContent = plan.cardinality;
            const divFieldsCell = document.createElement("div");
            if (
                plan.fields &&
                plan.fields instanceof Array &&
                plan.fields.length > 0
            ) {
                divFieldsCell.textContent = plan.fields.join(", ");
            }
            const divOpCell = document.createElement("div");
            divOpCell.textContent = plan.leadingOperationType;
            const divRelCostCell = document.createElement("div");
            divRelCostCell.textContent = plan.relativeCost;
            const divSObjCardCell = document.createElement("div");
            divSObjCardCell.textContent = plan.sobjectCardinality;
            const divSObjTypeCell = document.createElement("div");
            divSObjTypeCell.textContent = plan.sobjectType;

            const divCells = [
                divPlanNoCell,
                divSObjTypeCell,
                divCardCell,
                divFieldsCell,
                divOpCell,
                divRelCostCell,
                divSObjCardCell
            ];

            for (const divCell of divCells) {
                divCell.className = "div-table-cell";
                divRow.appendChild(divCell);
            }
            resultTable.appendChild(divRow);
            planCount++;
        }
    }

    function createResultNotes(result) {
        let planNotesList = [];
        for (const plan of result.plans) {
            if (plan.notes && plan.notes.length > 0) {
                planNotesList.push(plan.notes);
            } else {
                planNotesList.push([]);
            }
        }

        let divResultNotes = document.querySelector(".result-notes");
        let planCount = 1;

        for (const planNotes of planNotesList) {
            const divPlanNo = document.createElement("div");
            divPlanNo.className = "plan-no";
            divPlanNo.textContent = `Plan #${planCount} - Notes`;

            const divTable = document.createElement("div");
            divTable.className = "div-table";
            const divTableBody = document.createElement("div");
            divTableBody.className = "div-table-body";
            divTable.appendChild(divTableBody);

            const divHeaderRow = document.createElement("div");
            divHeaderRow.className = "div-table-row";

            const divTableCell = document.createElement("div");
            divTableCell.textContent = "Table";
            const divFieldsCell = document.createElement("div");
            divFieldsCell.textContent = "Fields";
            const divDescCell = document.createElement("div");
            divDescCell.textContent = "Description";

            const divCells = [divTableCell, divFieldsCell, divDescCell];

            for (const divCell of divCells) {
                divCell.className = "div-table-title";
                divHeaderRow.appendChild(divCell);
            }
            divTableBody.appendChild(divHeaderRow);

            for (const note of planNotes) {
                const divDataRow = document.createElement("div");
                divDataRow.className = "div-table-row";

                const divTableCell = document.createElement("div");
                divTableCell.textContent = note.tableEnumOrId;
                const divFieldsCell = document.createElement("div");
                if (
                    note.fields &&
                    note.fields instanceof Array &&
                    note.fields.length > 0
                ) {
                    divFieldsCell.textContent = note.fields.join(", ");
                }
                const divDescCell = document.createElement("div");
                divDescCell.textContent = note.description;

                const divDataCells = [divTableCell, divFieldsCell, divDescCell];

                for (const divCell of divDataCells) {
                    divCell.className = "div-table-cell";
                    divDataRow.appendChild(divCell);
                }
                divTableBody.appendChild(divDataRow);
            }
            planCount++;

            let divPlanNote = document.createElement("div");
            divPlanNote.className = "plan-note";
            divPlanNote.appendChild(divPlanNo);
            divPlanNote.appendChild(divTable);
            divResultNotes.appendChild(divPlanNote);
        }
    }
})();
