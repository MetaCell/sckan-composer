import {AnatomicalEntity, ConnectivityStatement} from "../apiclient/backend";
import {Option, OptionDetail} from "../types";

export function mapAnatomicalEntitiesToOptions(entities: AnatomicalEntity[], groupLabel: string): Option[] {
    if(!entities){
        return []
    }
    return entities.map(entity => ({
        id: entity.id.toString(),
        label: entity.name,
        group: groupLabel,
        content: [
            {
                title: "Name",
                value: entity.name,
            },
            {
                title: "Ontology URI",
                value: entity.ontology_uri,
            },
        ],
    }));
}

export function mapConnectivityStatementsToOptions(statements: ConnectivityStatement[], group: string): Option[] {
    return statements.reduce((options: Option[], statement) => {
        if (statement.id === null) {
            console.warn('Skipped statement with null ID', statement);
            return options;
        }

        const optionDetails: OptionDetail[] = [
            { title: "Knowledge Statement ID", value: statement.id.toString() || "N/A" },
            { title: "Title", value: statement.knowledge_statement || "N/A" },
            { title: "Statement", value: statement.statement_preview || "N/A" },
        ];

        const option: Option = {
            id: statement.id.toString(),
            label: statement.knowledge_statement || "No Knowledge Statement",
            group: group,
            content: optionDetails,
        };

        options.push(option);
        return options;
    }, []);
}
