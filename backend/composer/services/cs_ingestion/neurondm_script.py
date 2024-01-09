import csv
import logging
import os
import rdflib
from pyontutils.core import OntGraph, OntResIri, OntResPath
from pyontutils.namespaces import rdfs, ilxtr
from neurondm.core import Config, graphBase, log
from neurondm.core import OntTerm, OntId, RDFL
from neurondm import orders


class Origin:
    def __init__(self, anatomical_entity_uri):
        self.anatomical_entity = anatomical_entity_uri


class Via:
    def __init__(self, anatomical_entity_uri, from_entities, order):
        self.anatomical_entity = anatomical_entity_uri
        self.from_entities = from_entities
        self.order = order
        self.type = None


class Destination:
    def __init__(self, anatomical_entity_uri, from_entities):
        self.anatomical_entity = anatomical_entity_uri
        self.from_entities = from_entities
        self.type = None


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

    try:
        origins, vias, destinations = get_connections(n, lambda predicate: lpes(n, predicate))
    except ValueError as e:
        logging.error(f"{e}")
        return

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
    origins_partial_order, vias_partial_order, destinations_partial_order = process_connections(partial_order)

    expected_origins = lpes(ilxtr.hasSomaLocatedIn)
    expected_destinations = create_uri_type_dict(lpes, {ilxtr.hasAxonPresynapticElementIn: 'AXON-T',
                                                        ilxtr.hasAxonSensorySubcellularElementIn: 'AFFERENT-T'})
    expected_vias = create_uri_type_dict(lpes, {ilxtr.hasAxonLocatedIn: 'AXON', ilxtr.hasDendriteLocatedIn: 'DENDRITE'})

    validated_origins = validate_entities(origins_partial_order, expected_origins, 'origin')
    validated_destinations = validate_entities(destinations_partial_order, list(expected_destinations.keys()),
                                               'destination')
    validated_vias = validate_entities(vias_partial_order, list(expected_vias.keys()), 'via')

    extended_vias = extend_with_type(validated_vias, expected_vias)
    extended_destinations = extend_with_type(validated_destinations, expected_destinations)

    return validated_origins, extended_vias, extended_destinations


def create_uri_type_dict(lpes_func, predicate_type_map):
    uri_type_dict = {}
    for predicate, type_name in predicate_type_map.items():
        for uri in lpes_func(predicate):
            uri_type_dict[uri] = type_name
    return uri_type_dict


def process_connections(structure, from_entities=None, order=0, result=None):
    if result is None:
        result = {'origins': [], 'destinations': [], 'vias': []}

    if isinstance(structure, tuple):
        if structure[0] == rdflib.term.Literal('blank'):
            for origin in structure[1:]:
                process_connections(origin, order=0, result=result)
        else:
            current_entity = process_entity(structure[0]).toPython()

            if order == 0:
                result['origins'].append(Origin(current_entity))
            elif len(structure) == 1:
                result['destinations'].append(Destination(current_entity, from_entities))
            else:
                result['vias'].append(Via(current_entity, from_entities, order - 1))

            for next_structure in structure[1:]:
                process_connections(next_structure, current_entity, order + 1, result)

    return result['origins'], result['vias'], result['destinations']


def process_entity(entity):
    # Check if the entity is a complex object
    if isinstance(entity, orders.rl):
        return entity.layer
    else:
        return entity


def validate_entities(processed, expected_uris, entity_type):
    """
    Validate processed entities against the expected list of URIs.
    Log warnings for discrepancies and raise an error if any expected URI is missing.
    """
    # Extract URIs from processed entities
    processed_uris = set(entity.anatomical_entity for entity in processed)

    # Convert expected URIs to a set for efficient comparison
    expected_uris = set(expected_uris)

    # Log warnings for processed URIs not in expected list
    for uri in processed_uris - expected_uris:
        logging.warning(f"Unexpected {entity_type} URI: {uri}")

    # Check for missing URIs
    missing_uris = expected_uris - processed_uris
    if missing_uris:
        raise ValueError(f"Missing {entity_type}(s) in processed data: {missing_uris}")

    return processed


def extend_with_type(processed, uri_type_dict):
    for entity in processed:
        uri = entity.anatomical_entity.toPython() if isinstance(entity.anatomical_entity,
                                                                rdflib.term.URIRef) else entity.anatomical_entity
        entity_type = uri_type_dict.get(uri)
        if entity_type:
            entity.type = entity_type
    return processed


def reconcile(n):
    lobjs = set(o for p in n._location_predicates._litmap.values() for o in n.getObjects(p))
    po_rl = set(e for pair in orders.nst_to_adj(n.partialOrder()) for e in pair)
    po_r = set(t.region if isinstance(t, orders.rl) else t for t in po_rl)
    po_rl.difference_update({rdflib.Literal('blank')})
    po_r.difference_update({rdflib.Literal('blank')})
    # [if isinstance(e, orders.rl) else ]
    both = po_r & lobjs
    either = po_r | lobjs
    missing_axioms = po_r - lobjs
    missing_orders = lobjs - po_r
    withl_missing_axioms = po_rl - lobjs
    withl_missing_orders = lobjs - po_rl
    ok_reg = not (missing_axioms or missing_orders)
    ok_rl = not (withl_missing_axioms or withl_missing_orders)
    return {
        'ok_reg': ok_reg,
        'ok_rl': ok_rl,
        'withl_missing_axioms': withl_missing_axioms,
        'withl_missing_orders': withl_missing_orders,
        'missing_axioms': withl_missing_axioms,
        'missing_orders': withl_missing_orders,
    }


## Based on:
## https://github.com/tgbugs/pyontutils/blob/30c415207b11644808f70c8caecc0c75bd6acb0a/neurondm/docs/composer.py#L668-L698
def main(local=False, anatomical_entities=False, anatent_simple=False, do_reconcile=True, viz=False, chains=False):
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

    if do_reconcile:
        _recs = [(n, reconcile(n)) for n in neurons]
        recs_reg = [(n, r) for n, r in _recs if not r['ok_reg']]
        recs_rl = [(n, r) for n, r in _recs if not r['ok_rl']]
        msg = f'{len(recs_reg)} pops with reg issues, {len(recs_rl)} pops with rl issues'
        log.info(msg)
        sigh_reg = sorted([(len(r["missing_axioms"]), len(r["missing_orders"]), n, r) for n, r in recs_reg],
                          key=lambda t: (t[0] + t[1], t[0], t[1]), reverse=True)
        sigh_how = [s[:2] + tuple(OntId(_.id_).curie for _ in s[2:3]) for s in sigh_reg]
        rep_reg = 'a  o  i\n' + '\n'.join(f'{a: >2} {o: >2} {i}' for a, o, i in sigh_how)
        print(rep_reg)

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
