from enum import Enum
from typing import Set, Optional, Dict, List, Any


class NeuronDMOrigin:
    def __init__(self, anatomical_entities: Set):
        self.anatomical_entities = anatomical_entities
    
    def to_dict(self) -> Dict:
        """Convert NeuronDMOrigin to a JSON-serializable dictionary."""
        return {
            'anatomical_entities': self._convert_anatomical_entities_to_list(self.anatomical_entities)
        }
    
    @staticmethod
    def _convert_anatomical_entities_to_list(anatomical_entities: Set) -> List:
        """Convert a set of anatomical entities to a list for JSON serialization."""
        from neurondm import orders
        
        result = []
        for entity in anatomical_entities:
            if isinstance(entity, orders.rl):
                # For region-layer pairs, create a structured representation
                result.append({
                    'region': str(entity.region),
                    'layer': str(entity.layer)
                })
            else:
                result.append(str(entity))
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
            'anatomical_entities': NeuronDMOrigin._convert_anatomical_entities_to_list(self.anatomical_entities),
            'from_entities': NeuronDMOrigin._convert_anatomical_entities_to_list(self.from_entities),
            'order': self.order,
            'type': self.type
        }


class NeuronDMDestination:
    def __init__(self, anatomical_entities: Set, from_entities: Set, type: str):
        self.anatomical_entities = anatomical_entities
        self.from_entities = from_entities
        self.type = type
    
    def to_dict(self) -> Dict:
        """Convert NeuronDMDestination to a JSON-serializable dictionary."""
        return {
            'anatomical_entities': NeuronDMOrigin._convert_anatomical_entities_to_list(self.anatomical_entities),
            'from_entities': NeuronDMOrigin._convert_anatomical_entities_to_list(self.from_entities),
            'type': self.type
        }


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
    - ValidationErrors objects to strings
    - RDF statement_alerts to simple dicts
    - Removes non-serializable _neuron object
    
    Args:
        statement: Statement dict from neurondm_script.for_composer()
    
    Returns:
        JSON-serializable dict with all objects converted
    """
    result = statement.copy()
    
    # Convert origins
    if isinstance(result.get('origins'), NeuronDMOrigin):
        result['origins'] = result['origins'].to_dict()
    
    # Convert vias
    if isinstance(result.get('vias'), list):
        result['vias'] = [v.to_dict() if isinstance(v, NeuronDMVia) else v for v in result['vias']]
    
    # Convert destinations
    if isinstance(result.get('destinations'), list):
        result['destinations'] = [d.to_dict() if isinstance(d, NeuronDMDestination) else d for d in result['destinations']]
    
    # Convert validation_errors
    if isinstance(result.get('validation_errors'), ValidationErrors):
        result['validation_errors'] = result['validation_errors'].to_string()
    
    # Convert statement_alerts (RDF triples) to simple dicts
    if 'statement_alerts' in result and result['statement_alerts']:
        alerts = result['statement_alerts']
        if alerts and not isinstance(alerts[0], dict):
            # If not already converted, convert RDF triples
            result['statement_alerts'] = [
                {
                    'predicate': str(item[0]),
                    'object': str(item[1])
                }
                for item in alerts
            ]
    
    # Remove non-serializable neuron object
    result.pop('_neuron', None)
    
    return result
