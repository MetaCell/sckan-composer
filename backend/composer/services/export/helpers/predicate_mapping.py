from composer.enums import DestinationType, ExportRelationships, ViaType


class PredicateMapping:
    def __init__(self, predicate, label, uri):
        self.predicate = predicate
        self.label = label
        self.uri = uri


DESTINATION_PREDICATE_MAP = {
    DestinationType.AFFERENT_T: ExportRelationships.hasAxonSensorySubcellularElementIn,
    DestinationType.AXON_T: ExportRelationships.hasAxonPresynapticElementIn,
}

VIA_PREDICATE_MAP = {
    ViaType.AXON: ExportRelationships.hasAxonLocatedIn,
    ViaType.DENDRITE: ExportRelationships.hasDendriteLocatedIn,
    ViaType.SENSORY_AXON: ExportRelationships.hasAxonSensorySubcellularElementIn,
}


EXPORT_RELATIONSHIP_MAPPINGS = {
    ExportRelationships.hasBiologicalSex: PredicateMapping(
        predicate=ExportRelationships.hasBiologicalSex,
        label="Sex",
        uri="http://uri.interlex.org/tgbugs/uris/readable/hasBiologicalSex",
    ),
    ExportRelationships.hasCircuitRolePhenotype: PredicateMapping(
        predicate=ExportRelationships.hasCircuitRolePhenotype,
        label="CircuitRole",
        uri="http://uri.interlex.org/tgbugs/uris/readable/hasCircuitRolePhenotype",
    ),
    ExportRelationships.hasAnatomicalSystemPhenotype: PredicateMapping(
        predicate=ExportRelationships.hasAnatomicalSystemPhenotype,
        label="Phenotype",
        uri="http://uri.interlex.org/tgbugs/uris/readable/hasPhenotype",
    ),
    ExportRelationships.hasFunctionalCircuitRolePhenotype: PredicateMapping(
        predicate=ExportRelationships.hasFunctionalCircuitRolePhenotype,
        label="FunctionalCircuitRole",
        uri="http://uri.interlex.org/tgbugs/uris/readable/hasFunctionalCircuitRolePhenotype",
    ),
    ExportRelationships.hasInstanceInTaxon: PredicateMapping(
        predicate=ExportRelationships.hasInstanceInTaxon,
        label="Species",
        uri="http://uri.interlex.org/tgbugs/uris/readable/hasInstanceInTaxon",
    ),
    ExportRelationships.hasProjectionLaterality: PredicateMapping(
        predicate=ExportRelationships.hasProjectionLaterality,
        label="Laterality",
        uri="http://uri.interlex.org/tgbugs/uris/readable/hasProjectionLaterality",
    ),
    ExportRelationships.hasSomaPhenotype: PredicateMapping(
        predicate=ExportRelationships.hasSomaPhenotype,
        label="SomaPhenotype",
        uri="http://uri.interlex.org/tgbugs/uris/readable/hasSomaPhenotype",
    ),
    ExportRelationships.hasAlert: PredicateMapping(
        predicate=ExportRelationships.hasAlert,
        label="Alert",
        uri="http://uri.interlex.org/tgbugs/uris/readable/alertNote",
    ),
    ExportRelationships.hasSomaLocatedIn: PredicateMapping(
        predicate=ExportRelationships.hasSomaLocatedIn,
        label="Soma",
        uri="http://uri.interlex.org/tgbugs/uris/readable/hasSomaLocatedIn",
    ),
    ExportRelationships.hasProjectionPhenotype: PredicateMapping(
        predicate=ExportRelationships.hasProjectionPhenotype,
        label="ProjectionPhenotype",
        uri="http://uri.interlex.org/tgbugs/uris/readable/hasProjection",
    ),
    ExportRelationships.hasAxonPresynapticElementIn: PredicateMapping(
        predicate=ExportRelationships.hasAxonPresynapticElementIn,
        label="Axon terminal",
        uri="http://uri.interlex.org/tgbugs/uris/readable/hasAxonPresynapticElementIn",
    ),
    ExportRelationships.hasAxonSensorySubcellularElementIn: PredicateMapping(
        predicate=ExportRelationships.hasAxonSensorySubcellularElementIn,
        label="Afferent terminal",
        uri="http://uri.interlex.org/tgbugs/uris/readable/hasAxonSensorySubcellularElementIn",
    ),
    ExportRelationships.hasAxonLocatedIn: PredicateMapping(
        predicate=ExportRelationships.hasAxonLocatedIn,
        label="Axon",
        uri="http://uri.interlex.org/tgbugs/uris/readable/hasAxonLocatedIn",
    ),
    ExportRelationships.hasDendriteLocatedIn: PredicateMapping(
        predicate=ExportRelationships.hasDendriteLocatedIn,
        label="Dendrite",
        uri="http://uri.interlex.org/tgbugs/uris/readable/hasDendriteLocatedIn",
    ),
    ExportRelationships.hasAxonLeadingToSensorySubcellularElementIn: PredicateMapping(
        predicate=ExportRelationships.hasAxonLeadingToSensorySubcellularElementIn,
        label="Axon to PNS",
        uri="http://uri.interlex.org/tgbugs/uris/readable/hasAxonLeadingToSensorySubcellularElementIn",
    ),
    ExportRelationships.hasForwardConnection: PredicateMapping(
        predicate=ExportRelationships.hasForwardConnection,
        label="Forward Connection",
        uri="http://uri.interlex.org/tgbugs/uris/readable/hasForwardConnectionPhenotype",
    ),
}
