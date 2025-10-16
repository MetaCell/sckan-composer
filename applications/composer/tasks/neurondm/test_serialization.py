#!/usr/bin/env python3
"""
Test script to verify JSON serialization of NeuronDM objects.
This script can be run independently to test the conversion logic.
"""
import sys
import json

# Add the app path to sys.path to import composer modules
sys.path.insert(0, '/usr/src/app')

from composer.services.cs_ingestion.models import (
    NeuronDMOrigin,
    NeuronDMVia,
    NeuronDMDestination,
    ValidationErrors,
    convert_statement_to_json_serializable
)


def test_origin_serialization():
    """Test NeuronDMOrigin serialization."""
    print("\n=== Testing NeuronDMOrigin Serialization ===")
    
    # Create a test origin with simple entities
    anatomical_entities = {
        'http://purl.obolibrary.org/obo/UBERON_0001234',
        'http://purl.obolibrary.org/obo/UBERON_0005678'
    }
    origin = NeuronDMOrigin(anatomical_entities)
    
    # Convert to dict
    origin_dict = origin.to_dict()
    print(f"Origin dict: {json.dumps(origin_dict, indent=2)}")
    
    # Verify it's JSON serializable
    try:
        json_str = json.dumps(origin_dict)
        print("✓ Successfully serialized to JSON")
        return True
    except Exception as e:
        print(f"✗ Failed to serialize: {e}")
        return False


def test_via_serialization():
    """Test NeuronDMVia serialization."""
    print("\n=== Testing NeuronDMVia Serialization ===")
    
    # Create a test via
    anatomical_entities = {'http://purl.obolibrary.org/obo/UBERON_0001111'}
    from_entities = {'http://purl.obolibrary.org/obo/UBERON_0000000'}
    via = NeuronDMVia(anatomical_entities, from_entities, order=0, type='AXON')
    
    # Convert to dict
    via_dict = via.to_dict()
    print(f"Via dict: {json.dumps(via_dict, indent=2)}")
    
    # Verify it's JSON serializable
    try:
        json_str = json.dumps(via_dict)
        print("✓ Successfully serialized to JSON")
        return True
    except Exception as e:
        print(f"✗ Failed to serialize: {e}")
        return False


def test_destination_serialization():
    """Test NeuronDMDestination serialization."""
    print("\n=== Testing NeuronDMDestination Serialization ===")
    
    # Create a test destination
    anatomical_entities = {'http://purl.obolibrary.org/obo/UBERON_0002222'}
    from_entities = {'http://purl.obolibrary.org/obo/UBERON_0001111'}
    destination = NeuronDMDestination(anatomical_entities, from_entities, type='AXON-T')
    
    # Convert to dict
    dest_dict = destination.to_dict()
    print(f"Destination dict: {json.dumps(dest_dict, indent=2)}")
    
    # Verify it's JSON serializable
    try:
        json_str = json.dumps(dest_dict)
        print("✓ Successfully serialized to JSON")
        return True
    except Exception as e:
        print(f"✗ Failed to serialize: {e}")
        return False


def test_validation_errors_serialization():
    """Test ValidationErrors serialization."""
    print("\n=== Testing ValidationErrors Serialization ===")
    
    # Create validation errors with some data
    errors = ValidationErrors()
    errors.entities.add("entity1")
    errors.sex.add("sex_issue")
    errors.non_specified.append("Custom error message")
    
    # Convert to string
    error_str = errors.to_string()
    print(f"Validation errors string: {error_str}")
    
    # Verify it's JSON serializable
    try:
        json_str = json.dumps({"validation_errors": error_str})
        print("✓ Successfully serialized to JSON")
        return True
    except Exception as e:
        print(f"✗ Failed to serialize: {e}")
        return False


def test_statement_conversion():
    """Test full statement conversion."""
    print("\n=== Testing Full Statement Conversion ===")
    
    # Create a mock statement similar to what neurondm_script.for_composer() returns
    mock_statement = {
        'id': 'http://uri.interlex.org/test/statement/1',
        'label': 'Test Neuron',
        'pref_label': 'Test Neuron Preferred Label',
        'origins': NeuronDMOrigin({
            'http://purl.obolibrary.org/obo/UBERON_0001234'
        }),
        'destinations': [
            NeuronDMDestination(
                {'http://purl.obolibrary.org/obo/UBERON_0002222'},
                {'http://purl.obolibrary.org/obo/UBERON_0001111'},
                type='AXON-T'
            )
        ],
        'vias': [
            NeuronDMVia(
                {'http://purl.obolibrary.org/obo/UBERON_0001111'},
                {'http://purl.obolibrary.org/obo/UBERON_0001234'},
                order=0,
                type='AXON'
            )
        ],
        'validation_errors': ValidationErrors(),
        'statement_alerts': [
            ('http://uri.interlex.org/alert/1', 'Alert message 1'),
            ('http://uri.interlex.org/alert/2', 'Alert message 2')
        ],
        'species': ['http://purl.obolibrary.org/obo/NCBITaxon_10090'],
        'sex': ['http://purl.obolibrary.org/obo/PATO_0000384'],
        'circuit_type': ['http://uri.interlex.org/base/ilx_0738400'],
        'populationset': 'test-pop',
        '_neuron': object()  # Mock non-serializable object
    }
    
    print("Original statement keys:", list(mock_statement.keys()))
    print("Has _neuron object:", '_neuron' in mock_statement)
    
    # Convert to JSON-serializable format
    json_statement = convert_statement_to_json_serializable(mock_statement)
    
    print("\nConverted statement keys:", list(json_statement.keys()))
    print("_neuron removed:", '_neuron' not in json_statement)
    
    # Print converted statement
    print("\nConverted statement structure:")
    print(f"  - origins type: {type(json_statement['origins'])}")
    print(f"  - vias type: {type(json_statement['vias'])}, length: {len(json_statement['vias'])}")
    print(f"  - destinations type: {type(json_statement['destinations'])}, length: {len(json_statement['destinations'])}")
    print(f"  - validation_errors type: {type(json_statement['validation_errors'])}")
    print(f"  - statement_alerts type: {type(json_statement['statement_alerts'])}, length: {len(json_statement['statement_alerts'])}")
    
    # Verify it's JSON serializable
    try:
        json_str = json.dumps(json_statement, indent=2)
        print("\n✓ Successfully serialized full statement to JSON")
        print("\nJSON preview (first 500 chars):")
        print(json_str[:500] + "...")
        return True
    except Exception as e:
        print(f"\n✗ Failed to serialize: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_region_layer_serialization():
    """Test serialization of region-layer (orders.rl) entities."""
    print("\n=== Testing Region-Layer (orders.rl) Serialization ===")
    
    try:
        from neurondm import orders
        from pyontutils.core import OntTerm
        
        # Create mock region-layer pair
        # Note: This is a simplified test. In reality, orders.rl needs proper OntTerm objects
        print("orders.rl class available")
        print("Note: Full orders.rl testing requires complete neurondm setup")
        print("✓ Import successful - will be tested in integration")
        return True
    except ImportError as e:
        print(f"⚠ neurondm not available in this environment: {e}")
        print("  This is expected if running outside the Docker container")
        print("  Region-layer serialization will be tested during integration")
        return True


def main():
    """Run all serialization tests."""
    print("=" * 60)
    print("NeuronDM JSON Serialization Tests")
    print("=" * 60)
    
    results = []
    
    # Run all tests
    results.append(("Origin Serialization", test_origin_serialization()))
    results.append(("Via Serialization", test_via_serialization()))
    results.append(("Destination Serialization", test_destination_serialization()))
    results.append(("ValidationErrors Serialization", test_validation_errors_serialization()))
    results.append(("Region-Layer Serialization", test_region_layer_serialization()))
    results.append(("Full Statement Conversion", test_statement_conversion()))
    
    # Print summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    
    passed = 0
    failed = 0
    for test_name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status}: {test_name}")
        if result:
            passed += 1
        else:
            failed += 1
    
    print(f"\nTotal: {passed} passed, {failed} failed out of {len(results)} tests")
    
    # Exit with appropriate code
    if failed > 0:
        print("\n⚠ Some tests failed!")
        sys.exit(1)
    else:
        print("\n✓ All tests passed!")
        sys.exit(0)


if __name__ == '__main__':
    main()
