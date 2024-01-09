import csv
import os
from typing import Set

import rdflib
from neurondm import orders
from neurondm.core import Config, graphBase, log
from neurondm.core import OntTerm, OntId, RDFL
from pyontutils.core import OntGraph, OntResIri, OntResPath
from pyontutils.namespaces import rdfs, ilxtr


class Origin:
    def __init__(self, anatomical_entities_uri: Set):
        self.anatomical_entities = anatomical_entities_uri


class Via:
    def __init__(self, anatomical_entities_uri: Set, from_entities: Set, order: int, type: str):
        self.anatomical_entities = anatomical_entities_uri
        self.from_entities = from_entities
        self.order = order
        self.type = type


class Destination:
    def __init__(self, anatomical_entities_uri: Set, from_entities: Set, type: str):
        self.anatomical_entities = anatomical_entities_uri
        self.from_entities = from_entities
        self.type = type


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


def for_composer(n, cull=False):
    lpes, lrdf, collect = makelpesrdf()

    origins, vias, destinations = get_connections(n, lambda predicate: lpes(n, predicate))

    fc = dict(
        id=str(n.id_),
        label=str(n.origLabel),
        origins=origins,
        destinations=destinations,
        vias=vias,
        species=lpes(n, ilxtr.hasInstanceInTaxon),
        sex=lpes(n, ilxtr.hasBiologicalSex),
        circuit_type=lpes(n, ilxtr.hasCircuitRolePhenotype),
        circuit_role=lpes(n, ilxtr.hasFunctionalCircuitRolePhenotype),
        phenotype=lpes(n, ilxtr.hasAnatomicalSystemPhenotype),
        classification_phenotype=lpes(n, ilxtr.hasClassificationPhenotype),
        other_phenotypes=(lpes(n, ilxtr.hasPhenotype)
                          + lpes(n, ilxtr.hasMolecularPhenotype)
                          + lpes(n, ilxtr.hasProjectionPhenotype)),
        forward_connection=lpes(n, ilxtr.hasForwardConnectionPhenotype),
        provenance=lrdf(n, ilxtr.literatureCitation),
        sentence_number=lrdf(n, ilxtr.sentenceNumber),
        note_alert=lrdf(n, ilxtr.alertNote),
    )
    npo = set((p.e, p.p) for p in n.pes)
    cpo = set(collect)
    unaccounted_pos = npo - cpo
    if unaccounted_pos:
        log.warning(
            (n.id_, [[n.in_graph.namespace_manager.qname(e) for e in pos]
                     for pos in unaccounted_pos]))
    return {k: v for k, v in fc.items() if v} if cull else fc


def get_connections(n, lpes):
    partial_order = n.partialOrder()
    expected_origins = lpes(ilxtr.hasSomaLocatedIn)
    expected_destinations = create_uri_type_dict(lpes, {ilxtr.hasAxonPresynapticElementIn: 'AXON-T',
                                                        ilxtr.hasAxonSensorySubcellularElementIn: 'AFFERENT-T'})
    expected_vias = create_uri_type_dict(lpes, {ilxtr.hasAxonLocatedIn: 'AXON', ilxtr.hasDendriteLocatedIn: 'DENDRITE'})

    tmp_origins, tmp_vias, tmp_destinations = process_connections(partial_order,
                                                                  set(expected_origins),
                                                                  expected_vias,
                                                                  expected_destinations
                                                                  )

    # origins = merge_origins(tmp_origins)
    vias = merge_vias(tmp_vias)
    destinations = merge_destinations(tmp_destinations)
    return tmp_origins, vias, destinations


def create_uri_type_dict(lpes_func, predicate_type_map):
    uri_type_dict = {}
    for predicate, type_name in predicate_type_map.items():
        for uri in lpes_func(predicate):
            uri_type_dict[uri] = type_name
    return uri_type_dict


def process_connections(path, expected_origins, expected_vias, expected_destinations, from_entities=None, depth=0,
                        result=None):
    if result is None:
        result = {'origins': [], 'destinations': [], 'vias': []}

    if isinstance(path, tuple):
        if path[0] == rdflib.term.Literal('blank'):
            for remaining_path in path[1:]:
                process_connections(remaining_path, expected_origins, expected_vias, expected_destinations, set(),
                                    depth=0, result=result)
        else:
            current_entity_uri = process_entity(path[0]).toPython()

            # Initialize from_entities as an empty set if None
            from_entities = from_entities or set()

            # Determine the type of the current entity based on the expected lists
            if current_entity_uri in expected_origins:
                result['origins'].append(Origin({current_entity_uri}))
                depth = 0  # Reset depth after each origin
            elif current_entity_uri in expected_vias:
                result['vias'].append(
                    Via({current_entity_uri}, from_entities, depth, expected_vias[current_entity_uri]))
                depth += 1
            elif current_entity_uri in expected_destinations:
                result['destinations'].append(
                    Destination({current_entity_uri}, from_entities, expected_destinations[current_entity_uri]))

            # Process the next level structures, carrying over from_entities as a set
            for next_structure in path[1:]:
                process_connections(next_structure, expected_origins, expected_vias, expected_destinations,
                                    {current_entity_uri}, depth, result)

    return result['origins'], result['vias'], result['destinations']


def process_entity(entity):
    # TODO: Confirm what to use @afonsobspinto
    # Check if the entity is a complex object
    if isinstance(entity, orders.rl):
        return entity.layer
    else:
        return entity


def merge_vias(vias):
    vias = merge_vias_by_from_entities(vias)
    return merge_vias_by_anatomical_entities(vias)


def merge_vias_by_from_entities(vias):
    merged_vias = {}
    for via in vias:
        key = (frozenset(via.anatomical_entities), via.order, via.type)
        if key not in merged_vias:
            merged_vias[key] = Via(via.anatomical_entities, set(), via.order, via.type)
        merged_vias[key].from_entities.update(via.from_entities)

    return list(merged_vias.values())


def merge_vias_by_anatomical_entities(vias):
    merged_vias = {}
    for via in vias:
        key = (via.order, via.type, frozenset(via.from_entities))
        if key not in merged_vias:
            merged_vias[key] = Via(set(), via.from_entities, via.order, via.type)
        merged_vias[key].anatomical_entities.update(via.anatomical_entities)

    return list(merged_vias.values())


def merge_destinations(destinations):
    destinations = merge_destinations_by_from_entities(destinations)
    return merge_destinations_by_anatomical_entities(destinations)


def merge_destinations_by_anatomical_entities(destinations):
    merged_destinations = {}
    for destination in destinations:
        key = (frozenset(destination.anatomical_entities), destination.type)
        if key not in merged_destinations:
            merged_destinations[key] = Destination(destination.anatomical_entities, set(), destination.type)
        merged_destinations[key].from_entities.update(destination.from_entities)

    return list(merged_destinations.values())


def merge_destinations_by_from_entities(destinations):
    merged_destinations = {}
    for destination in destinations:
        key = frozenset(destination.from_entities)
        if key not in merged_destinations:
            merged_destinations[key] = Destination(set(), destination.from_entities, destination.type)
        merged_destinations[key].anatomical_entities.update(destination.anatomical_entities)

    return list(merged_destinations.values())


## Based on:
## https://github.com/tgbugs/pyontutils/blob/30c415207b11644808f70c8caecc0c75bd6acb0a/neurondm/docs/composer.py#L668-L698
def main(local=False, anatomical_entities=False, anatent_simple=False, do_reconcile=False, viz=False, chains=False):
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

    # full imports
    for f in ('apinat-partial-orders',
              'apinat-pops-more',
              'apinat-simple-sheet',
              'sparc-nlp'):
        if local:
            ori = OntResPath(local_base / (f + suffix))
        else:
            ori = OntResIri(remote_base + f + suffix)
        [g.add(t) for t in ori.graph]

    # label only imports
    for f in ('apinatomy-neuron-populations',
              '../../npo'):
        p = os.path.normpath(gen_neurons_path + f)
        if local:
            ori = OntResPath(olr / (p + suffix))
        else:
            ori = OntResIri(orr + p + suffix)

        [g.add((s, rdfs.label, o)) for s, o in ori.graph[:rdfs.label:]]

    config.load_existing(g)
    neurons = config.neurons()

    fcs = [for_composer(n) for n in neurons]

    myFile = open('./composer/services/cs_ingestion/neurons.csv', 'w')
    writer = csv.DictWriter(myFile,
                            fieldnames=['id', 'label', 'origins', 'vias', 'destinations', 'species', 'sex',
                                        'circuit_type', 'circuit_role' 'phenotype', 'other_phenotypes',
                                        'forward_connection', 'provenance', 'sentence_number', 'note_alert',
                                        'classification_phenotype'])
    writer.writeheader()
    writer.writerows(fcs)
    myFile.close()

    return fcs


if __name__ == '__main__':
    main()
