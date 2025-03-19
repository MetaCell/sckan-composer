import { Option } from "../types";
import { composerApi as api } from "./apis";
import { autocompleteRows, ChangeRequestStatus } from "../helpers/settings";
import {
  convertToConnectivityStatementUpdate,
  getViasGroupLabel,
  mapAnatomicalEntitiesToOptions,
  mapConnectivityStatementsToOptions,
  removeEntitiesById,
} from "../helpers/dropdownMappers";
import {
  AnatomicalEntity,
  ConnectivityStatement,
  ConnectivityStatementUpdate,
  DestinationSerializerDetails,
  PatchedConnectivityStatementUpdate,
  PatchedDestination,
  PatchedVia,
  ViaSerializerDetails,
} from "../apiclient/backend";
import { searchAnatomicalEntities } from "../helpers/helpers";
import connectivityStatementService from "./StatementService";
import statementService from "./StatementService";
import { checkOwnership, getOwnershipAlertMessage } from "../helpers/ownershipAlert";
import {setWasChangeDetected} from "../redux/statementSlice";
import {AppDispatch} from "../redux/store";

export async function getAnatomicalEntities(
  searchValue: string,
  groupLabel: string,
  excludedIds?: number[],
): Promise<Option[]> {
  try {
    const response = await api.composerAnatomicalEntityList(
      excludedIds,
      autocompleteRows,
      searchValue,
      0,
    );
    const anatomicalEntities = response.data.results || [];
    return mapAnatomicalEntitiesToOptions(anatomicalEntities, groupLabel);
  } catch (error) {
    return [];
  }
}

export async function updateOrigins(
  selected: Option[],
  statementId: number,
  refreshStatement: () => void,
  dispatch: AppDispatch,
) {
  const originIds = selected.map((option) => parseInt(option.id));
  const patchedStatement: PatchedConnectivityStatementUpdate = {
    origins: originIds,
  };

  try {
    const response = await statementService.partialUpdate(statementId, patchedStatement);
    if (response !== ChangeRequestStatus.CANCELLED) {
      dispatch(setWasChangeDetected(true));
    }
    return response;
  } catch (error) {
    alert(`Error updating origins: ${error}`);
  }
}

export type UpdateEntityParams = {
  statementId: number
  selected: Option[];
  entityId: number | null;
  entityType: "via" | "destination";
  propertyToUpdate: "anatomical_entities" | "from_entities";
  dispatch:  AppDispatch;
};

const apiFunctionMap = {
  via: (id: number, patchedVia: PatchedVia) =>
    api.composerViaPartialUpdate(id, patchedVia),
  destination: (id: number, patchedDestination: PatchedDestination) =>
    api.composerDestinationPartialUpdate(id, patchedDestination),
};

export async function updateEntity({
  statementId,
  selected,
  entityId,
  entityType,
  propertyToUpdate,
  dispatch
}: UpdateEntityParams) {
  if (entityId == null) {
    alert(`Error updating ${entityType}`);
  }

  const entityIds = selected.map((option) => parseInt(option.id));
  const patchObject = { [propertyToUpdate]: entityIds };

  try {
    // Get the API function from the map
    const updateFunction = apiFunctionMap[entityType];
    if (updateFunction) {
      // Attempt to update, using checkOwnership in case of ownership error
      try {
        if (entityId != null) {
          await updateFunction(entityId, patchObject);
          dispatch(setWasChangeDetected(true));
        }
      } catch (error) {
        // Ownership error occurred, trigger ownership check
        return checkOwnership(
          statementId,
          async () => {
            await updateFunction(entityId as number, patchObject); // Re-attempt the update if ownership is reassigned
            dispatch(setWasChangeDetected(true));
          },
          () => {
            return ChangeRequestStatus.CANCELLED;
          }, // Optional: handle post-assignment logic
          (owner) => getOwnershipAlertMessage(owner)
        );
        
      }
    } else {
      alert(`No update function found for entity type: ${entityType}`);
    }
  } catch (error) {
    alert(`Error updating ${entityType}`);
  }
}

export function getConnectionId(
  formId: string,
  connections: ViaSerializerDetails[] | DestinationSerializerDetails[],
): number | null {
  const index = getFirstNumberFromString(formId);
  if (index != null) {
    return connections[index].id;
  }
  return null;
}

export function getFirstNumberFromString(inputString: string) {
  const match = inputString.match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}

export function searchFromEntitiesVia(
  searchValue: string,
  statement: ConnectivityStatement,
  formId: string,
  excludeIds: number[],
): Option[] {
  const viaIndex = getFirstNumberFromString(formId);
  if (
    viaIndex == null ||
    statement.vias == null ||
    statement.vias[viaIndex] == null
  ) {
    return [];
  }
  const viaOrder = statement.vias[viaIndex].order;
  const anatomicalEntities = getEntitiesBeforeOrder(statement, viaOrder);

  const entities: Option[] = [];
  searchAnatomicalEntities(anatomicalEntities, searchValue).forEach(
    (row: any) => {
      entities.push(
        mapAnatomicalEntitiesToOptions(
          [row],
          getViasGroupLabel(row.order + 1),
        )[0],
      );
    },
  );

  return removeEntitiesById(entities, excludeIds);
}

export function searchFromEntitiesDestination(
  searchValue: string,
  statement: ConnectivityStatement,
  excludeIds: number[],
): Option[] {
  const vias = statement.vias || [];
  const maxOrder =
    vias.reduce((maxOrder, via) => {
      return via.order > maxOrder ? via.order : maxOrder;
    }, 0) + 1;

  const anatomicalEntities = getEntitiesBeforeOrder(statement, maxOrder);

  const entities: Option[] = [];
  searchAnatomicalEntities(anatomicalEntities, searchValue).forEach(
    (row: any) => {
      entities.push(
        mapAnatomicalEntitiesToOptions(
          [row],
          getViasGroupLabel(row.order + 1),
        )[0],
      );
    },
  );

  return removeEntitiesById(entities, excludeIds);
}

function getEntitiesBeforeOrder(
  statement: ConnectivityStatement,
  order: number,
) {
  const entities = statement.origins != null ? [...statement.origins] : [];
  const vias = statement.vias || [];
  return vias.reduce((acc: any, via) => {
    if (via.order < order) {
      via.anatomical_entities.forEach((entity) => {
        acc.push({ ...entity, order: via.order });
      });
    }
    return acc;
  }, entities as AnatomicalEntity[]);
}

const queryOptions = {
  knowledgeStatement: undefined,
  include: undefined,
  limit: autocompleteRows,
  notes: undefined,
  index: 0,
  ordering: undefined,
  stateFilter: undefined,
  populationSetFilter: undefined,
  tagFilter: undefined,
};

export const forwardConnectionGroups = {
  sameSentence: "Derived from the same statement",
  otherSentence: "Other",
};

export async function searchForwardConnection(
  searchValue: string,
  statement: ConnectivityStatement,
  excludeIds?: number[],
): Promise<Option[]> {

  try {
    const forwardConnectionOrigins = statement.destinations?.flatMap(
      (destination) =>
        destination.anatomical_entities?.map((entity) => entity.id) ?? [],
    ) ?? [];
    if (forwardConnectionOrigins.length === 0) {
      return []
    }
    const sameSentencePromise = connectivityStatementService.getList({
      ...queryOptions,
      excludeIds,
      excludeSentenceId: undefined,
      sentenceId: statement.sentence_id,
      origins: forwardConnectionOrigins,
      knowledgeStatement: searchValue,
    });

    const differentSentencePromise = connectivityStatementService.getList({
      ...queryOptions,
      excludeIds,
      excludeSentenceId: statement.sentence_id,
      sentenceId: undefined,
      origins: forwardConnectionOrigins,
      knowledgeStatement: searchValue,
    });

    const [sameRes, diffRes] = await Promise.all([
      sameSentencePromise,
      differentSentencePromise,
    ]);

    const sameSentenceOptions = sameRes.results
      ? mapConnectivityStatementsToOptions(
        sameRes.results.filter((res) => res.id !== statement.id),
        forwardConnectionGroups.sameSentence,
      )
      : [];

    const differentSentenceOptions = diffRes.results
      ? mapConnectivityStatementsToOptions(
        diffRes.results,
        forwardConnectionGroups.otherSentence,
      )
      : [];

    return [...sameSentenceOptions, ...differentSentenceOptions];
  } catch (error) {
    throw error;
  }
}

export async function updateForwardConnections(
  selectedOptions: Option[],
  currentStatement: ConnectivityStatement,
  dispatch: AppDispatch,
) {
  const forwardConnectionIds = selectedOptions.map((option) =>
    parseInt(option.id),
  );

  const updateData: ConnectivityStatementUpdate = {
    ...convertToConnectivityStatementUpdate(currentStatement),
    forward_connection: forwardConnectionIds,
  };

  // Call the update method of statementService
  try {
    dispatch(setWasChangeDetected(true));
    return await statementService.update(updateData);
  } catch (error) {
    alert(`Error updating statement: ${error}`);
  }
}

export function createOptionsFromStatements(
  statements: ConnectivityStatement[],
  currentSentenceId: number,
): Option[] {
  // Separate the statements into two groups
  const sameSentenceStatements = statements?.filter(
    (statement) => statement.sentence_id === currentSentenceId,
  );
  const differentSentenceStatements = statements?.filter(
    (statement) => statement.sentence_id !== currentSentenceId,
  );

  // Create options for each group
  const sameSentenceOptions = mapConnectivityStatementsToOptions(
    sameSentenceStatements,
    "forwardConnectionGroups.sameSentence",
  );
  const differentSentenceOptions = mapConnectivityStatementsToOptions(
    differentSentenceStatements,
    "forwardConnectionGroups.otherSentence",
  );
  return sameSentenceOptions && differentSentenceOptions
    ? [...sameSentenceOptions, ...differentSentenceOptions]
    : [];
}
