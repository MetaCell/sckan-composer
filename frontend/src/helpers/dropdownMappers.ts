import {
  AnatomicalEntity,
  ConnectivityStatement,
  ConnectivityStatementUpdate,
} from "../apiclient/backend";
import { Option, OptionDetail } from "../types";
import { OriginsGroupLabel, ViasGroupLabel } from "./settings";

export const DROPDOWN_MAPPER_ONTOLOGY_URL = "Ontology URI";
export const DROPDOWN_MAPPER_STATE = "state";

type tempOption = { sort: number } & Option;

export function mapAnatomicalEntitiesToOptions(
  entities: AnatomicalEntity[],
  groupLabel: string,
): Option[] {
  if (!entities) {
    return [];
  }
  return entities.map((entity: any) => ({
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
  return statements?.reduce((options: Option[], statement) => {
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

export const processFromEntitiesData = (allOptions: tempOption[]) => {
  const getSortValueForItem = (item: tempOption) => {
    if (item.group === "Origins") {
      return 0;
    }

    if (item.group.startsWith("Vias-")) {
      return parseInt(item.group.split("-")[1]);
    }

    return -1;
  };

  const dataMap: Record<string, tempOption[]> = allOptions.reduce(
    (dataMap, item: tempOption) => {
      if (!dataMap[item.id]) {
        dataMap[item.id] = []; // we keep it sorted
      }

      // set sort value for each item
      item.sort = getSortValueForItem(item);

      dataMap[item.id].push(item);

      // Sort the array based on the "sort" key
      dataMap[item.id].sort((a: tempOption, b: tempOption) => a.sort - b.sort);

      return dataMap;
    },
    {} as Record<string, tempOption[]>,
  );

  const newData: tempOption[] = Object.keys(dataMap).map(
    (key) => dataMap[key][0],
  );
  return newData.sort((a: tempOption, b: tempOption) => b.sort - a.sort);
};

export function getViasGroupLabel(currentIndex: number | null) {
  return currentIndex ? `${ViasGroupLabel}-${currentIndex}` : OriginsGroupLabel;
}
export function areArraysOfObjectsEqual(a: any[], b: any[]): boolean {
  if (a.length !== b.length) return false;
  
  const setA = new Set(a.map(obj => obj.id));
  const setB = new Set(b.map(obj => obj.id));
  
  if (setA.size !== setB.size) return false;
  
  for (let id of setA) {
    if (!setB.has(id)) return false;
  }
  
  return true;
}


export function findMatchingEntities(
  statement: ConnectivityStatement,
  entities: Option[],
) {
  const matchingOrigins: AnatomicalEntity[] = (statement.origins || []).filter(
    (origin: AnatomicalEntity) =>
      entities.some(
        (searchItem: Option) => Number(origin.id) === Number(searchItem.id),
      ),
  );

  const matchingVias: AnatomicalEntity & { order?: number }[] = (
    statement.vias || []
  ).reduce((result: any, via: any) => {
    const matchingAnatomicalEntitiesInVia: AnatomicalEntity &
      { order?: number }[] = via.anatomical_entities
      .filter((fromEntity: Option) =>
        entities.some((searchItem: Option) => fromEntity.id === searchItem.id),
      )
      .map((fromEntity: Option) => ({ ...fromEntity, order: via.order }));

    if (matchingAnatomicalEntitiesInVia.length > 0) {
      result.push(...matchingAnatomicalEntitiesInVia);
    }

    return result;
  }, []);

  // Use a Map to filter out duplicates based on id and order
  const uniqueItems = new Map();
  const combinedResults = [...matchingOrigins, ...matchingVias];

  combinedResults.forEach((item: any) => {
    const key = item.id;

    if (
      !uniqueItems.has(key) ||
      (item.order !== undefined && item.order < uniqueItems.get(key).order)
    ) {
      uniqueItems.set(key, item);
    }
  });

  const finalResult = Array.from(uniqueItems.values());

  return finalResult;
}
