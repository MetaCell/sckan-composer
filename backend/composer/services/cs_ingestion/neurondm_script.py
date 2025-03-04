import os
from typing import Optional, Tuple, List, Set, Dict

import rdflib
from neurondm import orders
from neurondm.core import Config, graphBase
from neurondm.core import OntTerm, OntId, RDFL
from pyontutils.core import OntGraph, OntResIri, OntResPath
from pyontutils.namespaces import rdfs, ilxtr
from django.core.management.base import BaseCommand, CommandError
import logging
import re

from composer.services.cs_ingestion.exceptions import NeuronDMInconsistency
from composer.services.cs_ingestion.helpers.common_helpers import VALIDATION_ERRORS, DESTINATIONS, VIAS, ORIGINS
from composer.services.cs_ingestion.logging_service import LoggerService, AXIOM_NOT_FOUND
from composer.services.cs_ingestion.models import NeuronDMVia, NeuronDMOrigin, NeuronDMDestination, LoggableAnomaly, \
    AxiomType, ValidationErrors, Severity

logger_service: Optional[LoggerService] = None
logging.basicConfig(level=logging.ERROR, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)
RED_COLOR = "\033[91m"
RESET_COLOR = "\033[0m"
SPARC_NLP_OWL_CLASS_PREFIX = "http://uri.interlex.org/tgbugs/uris/readable/NeuronSparcNlp"

def log_error(message):
    logger.error(f"{RED_COLOR}{message}{RESET_COLOR}")


def makelpesrdf():
    collect = []

    def lpes(neuron, predicate):
        """ get predicates from python bags """
        # TODO could add expected cardinality here if needed
        return [str(o) for o in neuron.getObjects(predicate)
                if not collect.append((predicate, o))]

    def lrdf(neuron, predicate):
        """ get predicates from graph """
        return [  # XXX FIXME core_graph bad etc.
            str(o) for o in
            neuron.core_graph[neuron.identifier:predicate]]

    return lpes, lrdf, collect


def get_populationset_from_neurondm(id_: str, owl_class: str) -> str:
    """
    NOTE: keep the order of re.search calls as is, to address the case for 
    /readable/sparc-nlp/ - in the first place
    """
    if str(owl_class) == SPARC_NLP_OWL_CLASS_PREFIX:
        return id_.split("/")[-2]
    
    match = re.search(r'/readable/[^-]+-[^-]+-([^-/]+)', id_)
    if match:
        return match.group(1)
    
    raise ValueError(f"Unable to extract population set from statement ID: {id_}")


def for_composer(n, statement_alert_uris: Set[str] = None):
    lpes, lrdf, collect = makelpesrdf()

    try:
        origins, vias, destinations, validation_errors = get_connections(n, lambda predicate: lpes(n, predicate))
    except NeuronDMInconsistency as e:
        if logger_service:
            logger_service.add_anomaly(LoggableAnomaly(e.statement_id, e.entity_id, e.message, severity=Severity.ERROR))
        return None


    if statement_alert_uris is None:
        statement_alert_uris = set()

    statement_alerts = [
        item for item in n.core_graph[n.identifier:]
        if str(item[0]) in statement_alert_uris
    ]

    fc = dict(
        id=str(n.id_),
        label=lrdf(n, rdfs.label)[0],
        origins=origins,
        destinations=destinations,
        populationset=get_populationset_from_neurondm(n.id_, n.owlClass),
        vias=vias,
        species=lpes(n, ilxtr.hasInstanceInTaxon),
        sex=lpes(n, ilxtr.hasBiologicalSex),
        circuit_type=lpes(n, ilxtr.hasCircuitRolePhenotype),
        circuit_role=lpes(n, ilxtr.hasFunctionalCircuitRolePhenotype),
        phenotype=lpes(n, ilxtr.hasAnatomicalSystemPhenotype),
        # classification_phenotype=lpes(n, ilxtr.hasClassificationPhenotype),
        other_phenotypes=(lpes(n, ilxtr.hasPhenotype)
                          + lpes(n, ilxtr.hasMolecularPhenotype)
                          + lpes(n, ilxtr.hasProjectionPhenotype)),
        forward_connection=lpes(n, ilxtr.hasForwardConnectionPhenotype),
        provenance=lrdf(n, ilxtr.literatureCitation),
        sentence_number=lrdf(n, ilxtr.sentenceNumber),
        note_alert=lrdf(n, ilxtr.alertNote),
        validation_errors=validation_errors,
        statement_alerts=statement_alerts,
    )

    return fc


def get_connections(n, lpes):
    partial_order = n.partialOrder()

    if partial_order is None or len(partial_order) == 0:
        raise NeuronDMInconsistency(n.identifier, None, "No partial order found")

    origins_from_axioms = lpes(ilxtr.hasSomaLocatedIn)
    destinations_from_axioms = create_uri_type_dict(lpes, {ilxtr.hasAxonPresynapticElementIn: 'AXON-T',
                                                           ilxtr.hasAxonSensorySubcellularElementIn: 'AFFERENT-T'})
    vias_from_axioms = create_uri_type_dict(lpes,
                                            {ilxtr.hasAxonLocatedIn: 'AXON', ilxtr.hasDendriteLocatedIn: 'DENDRITE'})

    tmp_origins, tmp_vias, tmp_destinations, validation_errors = process_connections(partial_order,
                                                                                     set(origins_from_axioms),
                                                                                     vias_from_axioms,
                                                                                     destinations_from_axioms)

    validation_errors = validate_partial_order_and_axioms(origins_from_axioms, vias_from_axioms,
                                                          destinations_from_axioms, tmp_origins,
                                                          tmp_vias, tmp_destinations, validation_errors)

    origins = merge_origins(tmp_origins)
    vias = merge_vias(tmp_vias)
    destinations = merge_destinations(tmp_destinations)

    origins, vias, destinations = update_from_entities(origins, vias, destinations)

    return origins, vias, destinations, validation_errors


def create_uri_type_dict(lpes_func, predicate_type_map):
    uri_type_dict = {}
    for predicate, type_name in predicate_type_map.items():
        for uri in lpes_func(predicate):
            uri_type_dict[uri] = type_name
    return uri_type_dict


def process_connections(path,
                        origins_from_axioms: Set[str],
                        vias_from_axioms: Dict[str, str],
                        destinations_from_axioms: Dict[str, str],
                        from_entities: Optional[Set[str]] = None,
                        depth: int = 0,
                        result: Optional[Dict] = None) -> Tuple[
    List[NeuronDMOrigin], List[NeuronDMVia], List[NeuronDMDestination], ValidationErrors]:
    if result is None:
        result = {ORIGINS: [], DESTINATIONS: [], VIAS: [], VALIDATION_ERRORS: ValidationErrors()}

    if isinstance(path, tuple):
        if path[0] == rdflib.term.Literal('blank'):
            for remaining_path in path[1:]:
                process_connections(remaining_path, origins_from_axioms, vias_from_axioms, destinations_from_axioms,
                                    from_entities, depth=depth, result=result)
        else:
            current_entity = path[0]

            current_entity_axiom_types = get_matched_axiom_types(current_entity,
                                                                 origins_from_axioms,
                                                                 vias_from_axioms,
                                                                 destinations_from_axioms)

            if not current_entity or len(current_entity_axiom_types) == 0:
                current_entity_representation = entity_to_string(current_entity)
                result[VALIDATION_ERRORS].axiom_not_found.add(current_entity_representation)
                if logger_service:
                    logger_service.add_anomaly(LoggableAnomaly(None, current_entity_representation, AXIOM_NOT_FOUND))
            else:
                from_entities = from_entities or set()

                axiom_type = get_axiom_type(current_entity_axiom_types, path, depth)

                update_result(current_entity, axiom_type, from_entities, depth, result, vias_from_axioms,
                              destinations_from_axioms)

                depth += 1

            next_from_entities = {current_entity} if current_entity else from_entities
            # Process the next level structures, carrying over from_entities as a set
            for remaining_path in path[1:]:
                process_connections(remaining_path, origins_from_axioms, vias_from_axioms, destinations_from_axioms,
                                    next_from_entities, depth, result)

    return result[ORIGINS], result[VIAS], result[DESTINATIONS], result[VALIDATION_ERRORS]


def entity_to_string(entity):
    if isinstance(entity, orders.rl):
        return f"{entity.region} (region), {entity.layer} (layer)"
    else:
        return str(entity)


def get_matched_axiom_types(current_entity: rdflib.term,
                            origins_from_axioms: Set[str],
                            vias_from_axioms: Dict[str, str],
                            destinations_from_axioms: Dict[str, str]) -> List[AxiomType]:
    # Check if current_entity is a complex region-layer pair (orders.rl) and extract URIs accordingly
    if isinstance(current_entity, orders.rl):
        primary_uri = current_entity.region.toPython()
        secondary_uri = current_entity.layer.toPython()
    else:
        primary_uri = current_entity.toPython()
        secondary_uri = None

    matched_types = []

    uris_in_axioms = [
        (origins_from_axioms, AxiomType.ORIGIN),
        (vias_from_axioms.keys(), AxiomType.VIA),
        (destinations_from_axioms.keys(), AxiomType.DESTINATION),
    ]

    for uri_set, node_type in uris_in_axioms:
        if primary_uri in uri_set or secondary_uri in uri_set:
            matched_types.append(node_type)

    return matched_types


def get_axiom_type(current_entity_axiom_types: List[AxiomType], path, depth: int) -> Optional[AxiomType]:
    # Determine the most likely axiom type based on the path context
    if not path[1:]:
        # If there's nothing after the current entity, it's most likely a Destination
        most_likely_type = AxiomType.DESTINATION
    elif depth == 0:
        # If there's nothing before the current entity, it's most likely an Origin
        most_likely_type = AxiomType.ORIGIN
    else:
        # Otherwise, it's most likely a Via
        most_likely_type = AxiomType.VIA

    # Check if the most likely type is possible
    if most_likely_type in current_entity_axiom_types:
        return most_likely_type

    # If the most likely type is not possible, choose the first possible one in order of Origin, Via, Destination
    for axiom_type in [AxiomType.ORIGIN, AxiomType.VIA, AxiomType.DESTINATION]:
        if axiom_type in current_entity_axiom_types:
            return axiom_type

    return None


def update_result(current_entity: rdflib.term, axiom_type: AxiomType, from_entities: Set[str], depth: int, result: Dict,
                  vias_from_axioms: Dict[str, str],
                  destinations_from_axioms: Dict[str, str]) -> Dict:
    if axiom_type == AxiomType.ORIGIN:
        result[ORIGINS].append(NeuronDMOrigin({current_entity}))
    elif axiom_type == AxiomType.VIA:
        result[VIAS].append(
            NeuronDMVia({current_entity}, from_entities, depth, get_entity_type(current_entity, vias_from_axioms)))
    elif axiom_type == AxiomType.DESTINATION:
        result[DESTINATIONS].append(
            NeuronDMDestination({current_entity}, from_entities,
                                get_entity_type(current_entity, destinations_from_axioms)))
    return result


def get_entity_type(current_entity, axiom_dict):
    if isinstance(current_entity, orders.rl):
        # Try to find the type based on the layer, then region
        return axiom_dict.get(str(current_entity.layer)) or axiom_dict.get(str(current_entity.region))
    else:
        return axiom_dict.get(str(current_entity))


def validate_partial_order_and_axioms(origins_from_axioms, vias_from_axioms, destinations_from_axioms,
                                      tmp_origins, tmp_vias, tmp_destinations,
                                      validation_errors: ValidationErrors) -> ValidationErrors:
    anatomical_uris_origins = extract_anatomical_uris(tmp_origins)
    anatomical_uris_vias = extract_anatomical_uris(tmp_vias)
    anatomical_uris_destinations = extract_anatomical_uris(tmp_destinations)

    validate_partial_order_and_axioms_aux(set(origins_from_axioms),
                                          anatomical_uris_origins,
                                          "origins",
                                          validation_errors)

    validate_partial_order_and_axioms_aux(set(vias_from_axioms.keys()),
                                          anatomical_uris_vias,
                                          "vias",
                                          validation_errors)

    validate_partial_order_and_axioms_aux(set(destinations_from_axioms.keys()),
                                          anatomical_uris_destinations,
                                          "destinations",
                                          validation_errors)

    return validation_errors


def validate_partial_order_and_axioms_aux(axiom_uris: Set[str], actual_uris: Set[str], category: str,
                                          validation_errors: ValidationErrors):
    unexpected_uris = get_unexpected_uris(actual_uris, axiom_uris)
    missing_uris = get_missing_uris(actual_uris, axiom_uris)

    for uri in unexpected_uris:
        uri_str = f"{uri[0]}, {uri[1]}" if isinstance(uri, tuple) else uri
        validation_errors.non_specified.append(
            f"Neurondm: Unexpected {category} URI not in axioms: {uri_str}")

    for uri in missing_uris:
        validation_errors.non_specified.append(
            f"Neurondm: Missing {category} URI not found in actual URIs: {uri}")

    return validation_errors


def get_missing_uris(actual_uris, axiom_uris):
    flattened_actual_uris = set()
    for uri in actual_uris:
        if isinstance(uri, tuple):
            flattened_actual_uris.update(uri)
        else:
            flattened_actual_uris.add(uri)
    missing_uris = axiom_uris.difference(flattened_actual_uris)
    return missing_uris


def get_unexpected_uris(actual_uris, axiom_uris):
    unexpected_uris = set()
    # Identify actual URIs that are unexpectedly present
    for actual_uri in actual_uris:
        if isinstance(actual_uri, tuple):  # Complex entity case (region, layer pairs)
            region, layer = actual_uri
            # Count as unexpected if neither region nor layer are in axiom_uris
            if not (region in axiom_uris or layer in axiom_uris):
                unexpected_uris.add(actual_uri)
        else:  # Simple URI case
            if actual_uri not in axiom_uris:
                unexpected_uris.add(actual_uri)
    return unexpected_uris


def extract_anatomical_uris(entities_list):
    uris = set()
    for entity in entities_list:
        for anatomical_entity in entity.anatomical_entities:
            if isinstance(anatomical_entity, orders.rl):
                uris.add((anatomical_entity.region.toPython(), anatomical_entity.layer.toPython()))
            else:  # Simple URIRef
                uris.add(anatomical_entity.toPython())
    return uris


def merge_origins(origins: List[NeuronDMOrigin]) -> NeuronDMOrigin:
    merged_anatomical_entities = set()
    for origin in origins:
        merged_anatomical_entities.update(origin.anatomical_entities)

    return NeuronDMOrigin(merged_anatomical_entities)


def merge_vias(vias: List[NeuronDMVia]) -> List[NeuronDMVia]:
    vias = merge_vias_by_from_entities(vias)
    vias = merge_vias_by_anatomical_entities(vias)
    return assign_unique_order_to_vias(vias)


def merge_vias_by_from_entities(vias: List[NeuronDMVia]) -> List[NeuronDMVia]:
    merged_vias = {}
    for via in vias:
        key = (frozenset(via.anatomical_entities), via.type)
        if key not in merged_vias:
            merged_vias[key] = NeuronDMVia(via.anatomical_entities, set(), via.order, via.type)
        merged_vias[key].from_entities.update(via.from_entities)
        merged_vias[key].order = max(merged_vias[key].order, via.order)

    return list(merged_vias.values())


def merge_vias_by_anatomical_entities(vias: List[NeuronDMVia]) -> List[NeuronDMVia]:
    merged_vias = {}
    for via in vias:
        key = (via.type, frozenset(via.from_entities))
        if key not in merged_vias:
            merged_vias[key] = NeuronDMVia(set(), via.from_entities, via.order, via.type)
        merged_vias[key].anatomical_entities.update(via.anatomical_entities)
        merged_vias[key].order = max(merged_vias[key].order, via.order)

    return list(merged_vias.values())


def assign_unique_order_to_vias(vias: List[NeuronDMVia]) -> List[NeuronDMVia]:
    # Sort vias by their original order
    sorted_vias = sorted(vias, key=lambda x: x.order)

    # Assign new orders to maintain uniqueness and relative order
    for new_order, via in enumerate(sorted_vias):
        via.order = new_order

    return sorted_vias


def merge_destinations(destinations: List[NeuronDMDestination]) -> List[NeuronDMDestination]:
    destinations = merge_destinations_by_from_entities(destinations)
    return merge_destinations_by_anatomical_entities(destinations)


def merge_destinations_by_anatomical_entities(destinations: List[NeuronDMDestination]) -> List[NeuronDMDestination]:
    merged_destinations = {}
    for destination in destinations:
        key = (frozenset(destination.anatomical_entities), destination.type)
        if key not in merged_destinations:
            merged_destinations[key] = NeuronDMDestination(destination.anatomical_entities, set(), destination.type)
        merged_destinations[key].from_entities.update(destination.from_entities)

    return list(merged_destinations.values())


def merge_destinations_by_from_entities(destinations: List[NeuronDMDestination]) -> List[NeuronDMDestination]:
    merged_destinations = {}
    for destination in destinations:
        key = frozenset(destination.from_entities)
        if key not in merged_destinations:
            merged_destinations[key] = NeuronDMDestination(set(), destination.from_entities, destination.type)
        merged_destinations[key].anatomical_entities.update(destination.anatomical_entities)

    return list(merged_destinations.values())


def update_from_entities(origins: NeuronDMOrigin, vias: List[NeuronDMVia], destinations: List[NeuronDMDestination]):
    # Step 1: Initialize "previous anatomical entities" with origins
    previous_anatomical_entities = origins.anatomical_entities

    # Step 2: Process vias
    for via in sorted(vias, key=lambda v: v.order):
        if via.from_entities == previous_anatomical_entities:
            via.from_entities = set()
        previous_anatomical_entities = via.anatomical_entities

    # Step 3: Process destinations
    for destination in destinations:
        if destination.from_entities == previous_anatomical_entities:
            destination.from_entities = set()

    return origins, vias, destinations


## Based on:
## https://github.com/tgbugs/pyontutils/blob/30c415207b11644808f70c8caecc0c75bd6acb0a/neurondm/docs/composer.py#L668-L698
def main(local=False, full_imports=[], label_imports=[], logger_service_param=Optional[LoggerService], statement_alert_uris: Set[str] = None):
    global logger_service
    logger_service = logger_service_param

    config = Config('random-merge')
    g = OntGraph()  # load and query graph

    # remove scigraph and interlex calls
    graphBase._sgv = None
    del graphBase._sgv
    if len(OntTerm.query._services) > 1:
        # backup services and avoid issues on rerun
        _old_query_services = OntTerm.query._services
        _noloc_query_services = _old_query_services[1:]

    OntTerm.query._services = (RDFL(g, OntId),)

    # base paths to ontology files
    gen_neurons_path = 'ttl/generated/neurons/'
    suffix = '.ttl'
    if local:
        from pyontutils.config import auth
        olr = auth.get_path('ontology-local-repo')
        local_base = olr / gen_neurons_path
    else:
        orr = 'https://raw.githubusercontent.com/SciCrunch/NIF-Ontology/neurons/'
        remote_base = orr + gen_neurons_path

    # full imports - if not provided manually, use default
    default_full_imports = ['apinat-partial-orders',
                            'apinat-pops-more',
                            'apinat-simple-sheet',
                            'sparc-nlp']
    full_imports_paths = full_imports if full_imports else default_full_imports
    failed_full_imports_paths = []
    for f in full_imports_paths:
        if local:
            ori = OntResPath(local_base / (f + suffix))
        else:
            ori = OntResIri(remote_base + f + suffix)

        try:
            [g.add(t) for t in ori.graph]
        except ValueError:
            failed_full_imports_paths.append(f)
            log_error(f"Error in loading {ori}")
    
    if failed_full_imports_paths:
        log_error(f"Failed to load the following full imports: {', '.join(failed_full_imports_paths)}")

    # label imports - if not provided manually, use default
    default_label_imports = ['apinatomy-neuron-populations',
                             '../../npo']
    label_imports_paths = label_imports if label_imports else default_label_imports
    failed_label_imports_paths = []
    for f in label_imports_paths:
        p = os.path.normpath(gen_neurons_path + f)
        if local:
            ori = OntResPath(olr / (p + suffix))
        else:
            ori = OntResIri(orr + p + suffix)

        try:
            [g.add((s, rdfs.label, o)) for s, o in ori.graph[:rdfs.label:]]
        except ValueError:
            failed_label_imports_paths.append(f)
            log_error(f"Error in loading {ori}")

    if failed_label_imports_paths:
        log_error(f"Failed to load the following label imports: {', '.join(failed_label_imports_paths)}")

    config.load_existing(g)
    neurons = config.neurons()

    if statement_alert_uris is None:
        statement_alert_uris = set()

    fcs = [for_composer(n, statement_alert_uris) for n in neurons]
    composer_statements = [item for item in fcs if item is not None]

    return composer_statements


if __name__ == '__main__':
    main()
