from enum import Enum
from composer.enums import DestinationType, ViaType
from composer.models import (
    AnatomicalEntityMeta,
    AnatomicalEntity,
    Phenotype,
    ProjectionPhenotype,
    Specie,
    Sex,
    FunctionalCircuitRole,
)


class IExportRelationship:
    @property
    def predicate(self):
        raise NotImplementedError

    @property
    def label(self):
        raise NotImplementedError

    @property
    def uri(self):
        raise NotImplementedError


class DynamicExportRelationship(IExportRelationship):
    def __init__(self, predicate, label, uri):
        self._predicate = predicate
        self._label = label
        self._uri = uri

    @property
    def predicate(self):
        return self._predicate

    @property
    def label(self):
        return self._label

    @property
    def uri(self):
        return self._uri


class PredicateToDBMapping(IExportRelationship, Enum):
    hasBiologicalSex = Sex
    hasAnatomicalSystemPhenotype = Phenotype
    hasFunctionalCircuitRolePhenotype = FunctionalCircuitRole
    hasInstanceInTaxon = Specie
    hasSomaPhenotype = Phenotype
    hasProjectionPhenotype = ProjectionPhenotype
    hasSomaLocatedIn = AnatomicalEntity
    hasAxonPresynapticElementIn = AnatomicalEntity
    hasAxonSensorySubcellularElementIn = AnatomicalEntity
    hasAxonLocatedIn = AnatomicalEntity
    hasDendriteLocatedIn = AnatomicalEntity
    hasAxonLeadingToSensorySubcellularElementIn = AnatomicalEntity


class ExportRelationships(IExportRelationship, Enum):
    hasBiologicalSex = (
        "hasBiologicalSex",
        "Sex",
        "http://uri.interlex.org/tgbugs/uris/readable/hasBiologicalSex",
    )
    prefLabel = (
        "skos:prefLabel",
        "prefLabel",
        "http://www.w3.org/2004/02/skos/core#prefLabel",
    )
    hasCircuitRolePhenotype = (
        "hasCircuitRolePhenotype",
        "CircuitRole",
        "http://uri.interlex.org/tgbugs/uris/readable/hasCircuitRolePhenotype",
    )
    hasAnatomicalSystemPhenotype = (
        "hasAnatomicalSystemPhenotype",
        "Phenotype",
        "http://uri.interlex.org/tgbugs/uris/readable/hasAnatomicalSystemPhenotype",
    )
    hasFunctionalCircuitRolePhenotype = (
        "hasFunctionalCircuitRolePhenotype",
        "FunctionalCircuitRole",
        "http://uri.interlex.org/tgbugs/uris/readable/hasFunctionalCircuitRolePhenotype",
    )
    hasInstanceInTaxon = (
        "hasInstanceInTaxon",
        "Species",
        "http://uri.interlex.org/tgbugs/uris/readable/hasInstanceInTaxon",
    )
    hasProjectionLaterality = (
        "hasProjectionLaterality",
        "Laterality",
        "http://uri.interlex.org/tgbugs/uris/readable/hasProjectionLaterality",
    )
    hasSomaPhenotype = (
        "hasSomaPhenotype",
        "SomaPhenotype",
        "http://uri.interlex.org/tgbugs/uris/readable/hasSomaPhenotype",
    )
    hasAlert = (
        "hasAlert",
        "Alert",
        "http://uri.interlex.org/tgbugs/uris/readable/alertNote",
    )
    hasSomaLocatedIn = (
        "hasSomaLocatedIn",
        "Soma",
        "http://uri.interlex.org/tgbugs/uris/readable/hasSomaLocatedIn",
    )
    hasProjectionPhenotype = (
        "hasProjectionPhenotype",
        "ProjectionPhenotype",
        "http://uri.interlex.org/tgbugs/uris/readable/hasProjection",
    )
    hasAxonPresynapticElementIn = (
        "hasAxonPresynapticElementIn",
        "Axon terminal",
        "http://uri.interlex.org/tgbugs/uris/readable/hasAxonPresynapticElementIn",
    )
    hasAxonSensorySubcellularElementIn = (
        "hasAxonSensorySubcellularElementIn",
        "Afferent terminal",
        "http://uri.interlex.org/tgbugs/uris/readable/hasAxonSensorySubcellularElementIn",
    )
    hasAxonLocatedIn = (
        "hasAxonLocatedIn",
        "Axon",
        "http://uri.interlex.org/tgbugs/uris/readable/hasAxonLocatedIn",
    )
    hasDendriteLocatedIn = (
        "hasDendriteLocatedIn",
        "Dendrite",
        "http://uri.interlex.org/tgbugs/uris/readable/hasDendriteLocatedIn",
    )
    hasAxonLeadingToSensorySubcellularElementIn = (
        "hasAxonLeadingToSensorySubcellularElementIn",
        "Axon to PNS",
        "http://uri.interlex.org/tgbugs/uris/readable/hasAxonLeadingToSensorySubcellularElementIn",
    )
    hasForwardConnection = (
        "hasForwardConnectionPhenotype",
        "Forward Connection",
        "http://uri.interlex.org/tgbugs/uris/readable/hasForwardConnectionPhenotype",
    )
    composerGenLabel = (
        "composerGenLabel",
        "Knowledge Statement",
        "http://uri.interlex.org/tgbugs/uris/readable/composerGenLabel",
    )
    hasComposerUri = (
        "hasComposerUri",
        "Composer URI",
        "https://uri.interlex.org/composer/uris/readable/hasComposerURI",
    )

    @property
    def predicate(self):
        return self.value[0]

    @property
    def label(self):
        return self.value[1]

    @property
    def uri(self):
        return self.value[2]


DESTINATION_PREDICATE_MAP = {
    DestinationType.AFFERENT_T: ExportRelationships.hasAxonSensorySubcellularElementIn,
    DestinationType.AXON_T: ExportRelationships.hasAxonPresynapticElementIn,
}

VIA_PREDICATE_MAP = {
    ViaType.AXON: ExportRelationships.hasAxonLocatedIn,
    ViaType.DENDRITE: ExportRelationships.hasDendriteLocatedIn,
    ViaType.SENSORY_AXON: ExportRelationships.hasAxonLeadingToSensorySubcellularElementIn,
}
