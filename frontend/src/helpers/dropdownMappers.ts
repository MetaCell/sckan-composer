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
  isFromViasEntity: boolean = false,
): Option[] {
  if (!entities) {
    return [];
  }
  return entities.map((entity: any) => ({
      id: entity.id.toString(),
      label: entity.name,
      group: groupLabel !== 'Vias'
        ? groupLabel
        : isFromViasEntity
          ? entity.order !== undefined
            ? `${groupLabel}-${entity.order}`
            : 'Origins'
          : groupLabel,
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
    })
  );
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

export function sortFromViasEntities(entities: Option[]){
  return entities.sort((a, b) => {
    const groupA = a.group.toLowerCase();
    const groupB = b.group.toLowerCase();
    
    if (groupA.startsWith('vias-') && groupB.startsWith('vias-')) {
      const viaOrderA = parseInt(groupA.slice(5), 10);
      const viaOrderB = parseInt(groupB.slice(5), 10);
      
      // Sort in descending order of viaOrder
      return viaOrderB - viaOrderA;
    }
    
    // Origins comes last
    return groupA === 'origins' ? 1 : -1;
  });
}