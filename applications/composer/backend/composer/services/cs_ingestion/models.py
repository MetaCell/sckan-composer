from enum import Enum
from typing import Set, Optional, Dict, List, Any

from composer.services.cs_ingestion.helpers.common_helpers import (
    ANATOMICAL_ENTITIES,
    FROM_ENTITIES,
    ORDER,
    TYPE,
    REGION,
    LAYER,
    ORIGINS,
    VIAS,
    DESTINATIONS,
    STATEMENT_ALERTS,
    VALIDATION_ERRORS,
)


class NeuronDMOrigin:
    def __init__(self, anatomical_entities: Set):
        self.anatomical_entities = anatomical_entities
    
    def to_dict(self) -> Dict:
        """Convert NeuronDMOrigin to a JSON-serializable dictionary."""
        return {
            ANATOMICAL_ENTITIES: self._convert_anatomical_entities_to_list(self.anatomical_entities)
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'NeuronDMOrigin':
        """Create NeuronDMOrigin from a dictionary (deserialization)."""
        anatomical_entities = cls._convert_list_to_anatomical_entities(
            data.get(ANATOMICAL_ENTITIES, [])
        )
        return cls(anatomical_entities)
    
    @staticmethod
    def _convert_anatomical_entities_to_list(anatomical_entities: Set) -> List:
        """Convert a set of anatomical entities to a list for JSON serialization."""
        from neurondm import orders
        
        result = []
        for entity in anatomical_entities:
            if isinstance(entity, orders.rl):
                # For region-layer pairs, create a structured representation
                result.append({
                    REGION: str(entity.region),
                    LAYER: str(entity.layer)
                })
            else:
                result.append(str(entity))
        return result
    
    @staticmethod
    def _convert_list_to_anatomical_entities(entities_list: List) -> Set:
        """Convert a list back to a set of anatomical entities (deserialization)."""
        from neurondm import orders
        from pyontutils.core import OntId
        
        result = set()
        for entity in entities_list:
            if isinstance(entity, dict) and REGION in entity and LAYER in entity:
                # This is a region-layer pair, recreate orders.rl object
                region = OntId(entity[REGION])
                layer = OntId(entity[LAYER])
                result.add(orders.rl(region, layer))
            else:
                result.add(str(entity))
        return result


class NeuronDMVia:
    def __init__(self, anatomical_entities: Set, from_entities: Set, order: int, type: str):
        self.anatomical_entities = anatomical_entities
        self.from_entities = from_entities
        self.order = order
        self.type = type
    
    def to_dict(self) -> Dict:
        """Convert NeuronDMVia to a JSON-serializable dictionary."""
        return {
            ANATOMICAL_ENTITIES: NeuronDMOrigin._convert_anatomical_entities_to_list(self.anatomical_entities),
            FROM_ENTITIES: NeuronDMOrigin._convert_anatomical_entities_to_list(self.from_entities),
            ORDER: self.order,
            TYPE: self.type
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'NeuronDMVia':
        """Create NeuronDMVia from a dictionary (deserialization)."""
        anatomical_entities = NeuronDMOrigin._convert_list_to_anatomical_entities(
            data.get(ANATOMICAL_ENTITIES, [])
        )
        from_entities = NeuronDMOrigin._convert_list_to_anatomical_entities(
            data.get(FROM_ENTITIES, [])
        )
        return cls(
            anatomical_entities=anatomical_entities,
            from_entities=from_entities,
            order=data.get(ORDER, 0),
            type=data.get(TYPE, '')
        )


class NeuronDMDestination:
    def __init__(self, anatomical_entities: Set, from_entities: Set, type: str):
        self.anatomical_entities = anatomical_entities
        self.from_entities = from_entities
        self.type = type
    
    def to_dict(self) -> Dict:
        """Convert NeuronDMDestination to a JSON-serializable dictionary."""
        return {
            ANATOMICAL_ENTITIES: NeuronDMOrigin._convert_anatomical_entities_to_list(self.anatomical_entities),
            FROM_ENTITIES: NeuronDMOrigin._convert_anatomical_entities_to_list(self.from_entities),
            TYPE: self.type
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'NeuronDMDestination':
        """Create NeuronDMDestination from a dictionary (deserialization)."""
        anatomical_entities = NeuronDMOrigin._convert_list_to_anatomical_entities(
            data.get(ANATOMICAL_ENTITIES, [])
        )
        from_entities = NeuronDMOrigin._convert_list_to_anatomical_entities(
            data.get(FROM_ENTITIES, [])
        )
        return cls(
            anatomical_entities=anatomical_entities,
            from_entities=from_entities,
            type=data.get(TYPE, '')
        )


class Severity(Enum):
    ERROR = 'error'
    WARNING = 'warning'


class LoggableAnomaly:
    def __init__(self, statement_id: Optional[str], entity_id: Optional[str], message: str,
                 severity: Severity = Severity.WARNING):
        self.statement_id = statement_id
        self.entity_id = entity_id
        self.message = message
        self.severity = severity


class AxiomType(Enum):
    ORIGIN = 'origin'
    VIA = 'via'
    DESTINATION = 'destination'


class ValidationErrors:
    def __init__(self):
        self.entities = set()
        self.sex = set()
        self.species = set()
        self.forward_connection = set()
        self.axiom_not_found = set()
        self.non_specified = []

    def to_string(self) -> str:
        error_messages = []
        if self.entities:
            error_messages.append(f"Entities not found: {', '.join(self.entities)}")
        if self.sex:
            error_messages.append(f"Sex information not found: {', '.join(self.sex)}")
        if self.species:
            error_messages.append(f"Species not found: {', '.join(self.species)}")
        if self.forward_connection:
            error_messages.append(
                f"Forward connection(s) not found: {', '.join(self.forward_connection)}")
        if self.axiom_not_found:
            error_messages.append(f"Axiom(s) not found for: {', '.join(self.axiom_not_found)}")
        if self.non_specified:
            error_messages.extend(self.non_specified)

        return '; '.join(error_messages) if error_messages else "No validation errors."

    def has_errors(self) -> bool:
        return bool(
            self.entities or
            self.sex or
            self.species or
            self.forward_connection or
            self.axiom_not_found or
            self.non_specified
        )


def convert_statement_to_json_serializable(statement: Dict[str, Any]) -> Dict[str, Any]:
    """
    Convert a statement dict with NeuronDM objects to a JSON-serializable format.
    
    This function handles conversion of:
    - NeuronDMOrigin objects to dicts
    - Lists of NeuronDMVia objects to dicts
    - Lists of NeuronDMDestination objects to dicts
    - statement_alerts tuples (alert_uri, alert_text) to list format
    - Removes non-serializable objects (_neuron, validation_errors)
    
    Note: validation_errors are handled separately by the logging service and not serialized.
    
    Args:
        statement: Statement dict from neurondm_script.for_composer()
    
    Returns:
        JSON-serializable dict with all objects converted and non-serializable objects removed
    """
    result = statement.copy()
    
    # Convert origins
    if isinstance(result.get(ORIGINS), NeuronDMOrigin):
        result[ORIGINS] = result[ORIGINS].to_dict()
    
    # Convert vias
    if isinstance(result.get(VIAS), list):
        result[VIAS] = [v.to_dict() if isinstance(v, NeuronDMVia) else v for v in result[VIAS]]
    
    # Convert destinations
    if isinstance(result.get(DESTINATIONS), list):
        result[DESTINATIONS] = [d.to_dict() if isinstance(d, NeuronDMDestination) else d for d in result[DESTINATIONS]]
    
    # Convert statement_alerts from tuples (alert_uri, alert_text) to lists for JSON
    if STATEMENT_ALERTS in result and result[STATEMENT_ALERTS]:
        alerts = result[STATEMENT_ALERTS]
        if alerts and isinstance(alerts[0], (tuple, list)):
            # Convert tuples/lists to simple list format [alert_uri, alert_text]
            result[STATEMENT_ALERTS] = [
                [str(item[0]), str(item[1])]
                for item in alerts
            ]
    
    # Remove non-serializable objects
    result.pop('_neuron', None)
    result.pop(VALIDATION_ERRORS, None)  # validation_errors are handled by the logging service
    
    return result


def convert_statement_from_json(statement: Dict[str, Any]) -> Dict[str, Any]:
    """
    Convert a JSON-serialized statement back to object format.
    
    This is the inverse of convert_statement_to_json_serializable().
    It recreates NeuronDM objects (including orders.rl) from their dict representations
    and converts statement_alerts back to tuples.
    
    Args:
        statement: Statement dict from JSON with serialized objects
    
    Returns:
        Statement dict with NeuronDM objects restored and statement_alerts as tuples
    """
    result = statement.copy()
    
    # Convert origins from dict to object
    if isinstance(result.get(ORIGINS), dict):
        result[ORIGINS] = NeuronDMOrigin.from_dict(result[ORIGINS])
    
    # Convert vias from dicts to objects
    if isinstance(result.get(VIAS), list):
        result[VIAS] = [
            NeuronDMVia.from_dict(v) if isinstance(v, dict) else v 
            for v in result[VIAS]
        ]
    
    # Convert destinations from dicts to objects
    if isinstance(result.get(DESTINATIONS), list):
        result[DESTINATIONS] = [
            NeuronDMDestination.from_dict(d) if isinstance(d, dict) else d 
            for d in result[DESTINATIONS]
        ]
    
    # Convert statement_alerts from lists [alert_uri, alert_text] back to tuples
    if STATEMENT_ALERTS in result and result[STATEMENT_ALERTS]:
        alerts = result[STATEMENT_ALERTS]
        if alerts and isinstance(alerts[0], list):
            # Convert lists back to tuples (alert_uri, alert_text)
            result[STATEMENT_ALERTS] = [
                (item[0], item[1])
                for item in alerts
            ]
    
    # Note: validation_errors are handled by the logging service
    
    return result
