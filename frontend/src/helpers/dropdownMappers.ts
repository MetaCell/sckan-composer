import {
  AnatomicalEntity,
  ConnectivityStatement,
  ConnectivityStatementUpdate,
} from "../apiclient/backend";
import { Option, OptionDetail } from "../types";

export const DROPDOWN_MAPPER_ONTOLOGY_URL = "Ontology URI";
export const DROPDOWN_MAPPER_STATE = "state";

export function mapAnatomicalEntitiesToOptions(
  entities: AnatomicalEntity[],
  groupLabel: string,
): Option[] {
  if (!entities) {
    return [];
  }
  return entities.map((entity) => ({
    id: entity.id.toString(),
    label: entity.name,
    group: groupLabel,
    content: [
      {
        title: "Name",
        value: entity.name,
      },
      {
        title: DROPDOWN_MAPPER_ONTOLOGY_URL,
        value: entity.ontology_uri,
      },
    ],
  }));
}

export function mapConnectivityStatementsToOptions(
  statements: ConnectivityStatement[],
  group: string,
): Option[] {
  return statements.reduce((options: Option[], statement) => {
    if (statement.id === null) {
      console.warn("Skipped statement with null ID", statement);
      return options;
    }

    const optionDetails: OptionDetail[] = [
      {
        title: "Knowledge Statement ID",
        value: statement.id.toString() || "N/A",
      },
      { title: "Title", value: statement.knowledge_statement || "N/A" },
      { title: "Statement", value: statement.statement_preview || "N/A" },
      { title: DROPDOWN_MAPPER_STATE, value: statement.state || "N/A" },
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

export function convertToConnectivityStatementUpdate(
  statement: ConnectivityStatement,
): ConnectivityStatementUpdate {
  return {
    ...statement,
    origins: statement.origins?.map((entity) => entity.id) || [],
  };
}

export function removeEntitiesById(entities: Option[], excludeIds: number[]) {
  return entities.filter((entity) => !excludeIds.includes(Number(entity.id)));
}
