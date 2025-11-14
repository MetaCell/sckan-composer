#!/usr/bin/env python3
"""
Standalone test for serialization/deserialization without Django.
Run this script directly: python test_serialization_standalone.py
"""
import json
import sys
import os

# Add the backend to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from composer.services.cs_ingestion.models import (
    NeuronDMOrigin,
    NeuronDMVia,
    NeuronDMDestination,
    ValidationErrors,
    convert_statement_to_json_serializable,
    convert_statement_from_json,
)


def test_origin_round_trip():
    """Test NeuronDMOrigin serialization round-trip."""
    print("\n=== Testing NeuronDMOrigin Round-Trip ===")
    
    # Create origin
    entities = {
        'http://purl.obolibrary.org/obo/UBERON_0001234',
        'http://purl.obolibrary.org/obo/UBERON_0005678'
    }
    origin1 = NeuronDMOrigin(entities)
    print(f"Original entities: {origin1.anatomical_entities}")
    
    # Serialize
    origin_dict = origin1.to_dict()
    print(f"Serialized: {json.dumps(origin_dict, indent=2)}")
    
    # Deserialize
    origin2 = NeuronDMOrigin.from_dict(origin_dict)
    print(f"Deserialized entities: {origin2.anatomical_entities}")
    
    # Verify
    assert origin1.anatomical_entities == origin2.anatomical_entities, "Data mismatch!"
    print("✓ Round-trip successful!")
    return True


def test_region_layer_serialization():
    """Test serialization of region-layer (orders.rl) entities."""
    print("\n=== Testing Region-Layer (orders.rl) Serialization ===")
    
    try:
        from neurondm import orders
        from pyontutils.core import OntId
        
        # Create region-layer pair
        region = OntId('http://purl.obolibrary.org/obo/UBERON_0002222')
        layer = OntId('http://purl.obolibrary.org/obo/UBERON_0003333')
        rl_entity = orders.rl(region, layer)
        
        # Create origin with mixed entities (simple and region-layer)
        anatomical_entities = {
            'http://purl.obolibrary.org/obo/UBERON_0001111',
            rl_entity
        }
        origin1 = NeuronDMOrigin(anatomical_entities)
        
        print(f"Original entities: {len(origin1.anatomical_entities)} items")
        print(f"  - Contains orders.rl: {any(isinstance(e, orders.rl) for e in origin1.anatomical_entities)}")
        
        # Serialize
        origin_dict = origin1.to_dict()
        print(f"\nSerialized: {json.dumps(origin_dict, indent=2)}")
        
        # Deserialize
        origin2 = NeuronDMOrigin.from_dict(origin_dict)
        print(f"\nDeserialized entities: {len(origin2.anatomical_entities)} items")
        
        # Verify orders.rl was reconstructed
        rl_entities = [e for e in origin2.anatomical_entities if isinstance(e, orders.rl)]
        print(f"  - Contains orders.rl: {len(rl_entities) > 0}")
        
        if rl_entities:
            reconstructed_rl = rl_entities[0]
            print(f"  - Region: {reconstructed_rl.region}")
            print(f"  - Layer: {reconstructed_rl.layer}")
            
            # Verify region and layer match
            assert str(reconstructed_rl.region) == str(region), "Region mismatch!"
            assert str(reconstructed_rl.layer) == str(layer), "Layer mismatch!"
        
        print("✓ Region-layer serialization successful!")
        return True
    except ImportError as e:
        print(f"⚠ neurondm not available: {e}")
        print("  This test requires neurondm to be installed")
        return False


def test_via_round_trip():
    """Test NeuronDMVia serialization round-trip."""
    print("\n=== Testing NeuronDMVia Round-Trip ===")
    
    # Create via
    via1 = NeuronDMVia(
        anatomical_entities={'http://purl.obolibrary.org/obo/UBERON_0001111'},
        from_entities={'http://purl.obolibrary.org/obo/UBERON_0000000'},
        order=0,
        type='AXON'
    )
    print(f"Original: order={via1.order}, type={via1.type}")
    
    # Serialize
    via_dict = via1.to_dict()
    print(f"Serialized: {json.dumps(via_dict, indent=2)}")
    
    # Deserialize
    via2 = NeuronDMVia.from_dict(via_dict)
    print(f"Deserialized: order={via2.order}, type={via2.type}")
    
    # Verify
    assert via1.anatomical_entities == via2.anatomical_entities, "Anatomical entities mismatch!"
    assert via1.from_entities == via2.from_entities, "From entities mismatch!"
    assert via1.order == via2.order, "Order mismatch!"
    assert via1.type == via2.type, "Type mismatch!"
    print("✓ Round-trip successful!")
    return True


def test_destination_round_trip():
    """Test NeuronDMDestination serialization round-trip."""
    print("\n=== Testing NeuronDMDestination Round-Trip ===")
    
    # Create destination
    dest1 = NeuronDMDestination(
        anatomical_entities={'http://purl.obolibrary.org/obo/UBERON_0002222'},
        from_entities={'http://purl.obolibrary.org/obo/UBERON_0001111'},
        type='AXON-T'
    )
    print(f"Original: type={dest1.type}")
    
    # Serialize
    dest_dict = dest1.to_dict()
    print(f"Serialized: {json.dumps(dest_dict, indent=2)}")
    
    # Deserialize
    dest2 = NeuronDMDestination.from_dict(dest_dict)
    print(f"Deserialized: type={dest2.type}")
    
    # Verify
    assert dest1.anatomical_entities == dest2.anatomical_entities, "Anatomical entities mismatch!"
    assert dest1.from_entities == dest2.from_entities, "From entities mismatch!"
    assert dest1.type == dest2.type, "Type mismatch!"
    print("✓ Round-trip successful!")
    return True


def test_statement_round_trip():
    """Test full statement serialization round-trip."""
    print("\n=== Testing Full Statement Round-Trip ===")
    
    # Create mock statement with statement_alerts as tuples (alert_uri, alert_text)
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
            ),
            NeuronDMDestination(
                {'http://purl.obolibrary.org/obo/UBERON_0003333'},
                {'http://purl.obolibrary.org/obo/UBERON_0001111'},
                type='AFFERENT-T'
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
    
    print(f"Original statement has _neuron: {'_neuron' in mock_statement}")
    print(f"Original origins type: {type(mock_statement['origins'])}")
    print(f"Original vias count: {len(mock_statement['vias'])}")
    print(f"Original destinations count: {len(mock_statement['destinations'])}")
    print(f"Original statement_alerts: {mock_statement['statement_alerts']}")
    print(f"  - First alert type: {type(mock_statement['statement_alerts'][0])}")
    
    # Serialize
    json_statement = convert_statement_to_json_serializable(mock_statement)
    print(f"\nAfter serialization:")
    print(f"  - _neuron removed: {'_neuron' not in json_statement}")
    print(f"  - origins type: {type(json_statement['origins'])}")
    print(f"  - vias type: {type(json_statement['vias'])}")
    print(f"  - destinations type: {type(json_statement['destinations'])}")
    print(f"  - statement_alerts: {json_statement['statement_alerts']}")
    print(f"  - First alert type: {type(json_statement['statement_alerts'][0])}")
    
    # Verify JSON serializable
    json_str = json.dumps(json_statement, indent=2)
    print(f"\nJSON length: {len(json_str)} characters")
    
    # Load from JSON (simulating file save/load)
    loaded_json = json.loads(json_str)
    
    # Deserialize
    object_statement = convert_statement_from_json(loaded_json)
    print(f"\nAfter deserialization:")
    print(f"  - origins type: {type(object_statement['origins'])}")
    print(f"  - vias type: {type(object_statement['vias'])}")
    print(f"  - destinations type: {type(object_statement['destinations'])}")
    print(f"  - statement_alerts: {object_statement['statement_alerts']}")
    print(f"  - First alert type: {type(object_statement['statement_alerts'][0])}")
    
    # Verify
    assert '_neuron' not in object_statement, "_neuron should be removed!"
    assert isinstance(object_statement['origins'], NeuronDMOrigin), "Origins should be NeuronDMOrigin!"
    assert len(object_statement['vias']) == 1, "Vias count mismatch!"
    assert isinstance(object_statement['vias'][0], NeuronDMVia), "Via should be NeuronDMVia!"
    assert len(object_statement['destinations']) == 2, "Destinations count mismatch!"
    assert isinstance(object_statement['destinations'][0], NeuronDMDestination), "Destination should be NeuronDMDestination!"
    assert object_statement['id'] == mock_statement['id'], "ID mismatch!"
    assert object_statement['vias'][0].order == 0, "Via order mismatch!"
    assert object_statement['vias'][0].type == 'AXON', "Via type mismatch!"
    
    # Verify statement_alerts are properly restored as tuples
    assert len(object_statement['statement_alerts']) == 2, "Statement alerts count mismatch!"
    assert isinstance(object_statement['statement_alerts'][0], tuple), "Statement alert should be tuple!"
    assert object_statement['statement_alerts'][0][0] == 'http://uri.interlex.org/alert/1', "Alert URI mismatch!"
    assert object_statement['statement_alerts'][0][1] == 'Alert message 1', "Alert text mismatch!"
    
    print("✓ Round-trip successful!")
    return True


def test_statement_alerts_serialization():
    """Test statement_alerts serialization/deserialization."""
    print("\n=== Testing Statement Alerts Serialization ===")
    
    # Create simple statement with alerts
    statement = {
        'id': 'http://uri.interlex.org/test/statement/alerts',
        'statement_alerts': [
            ('http://uri.interlex.org/alert/warning1', 'Warning: Missing data'),
            ('http://uri.interlex.org/alert/error1', 'Error: Invalid format'),
            ('http://uri.interlex.org/alert/info1', 'Info: Processing complete')
        ]
    }
    
    print(f"Original alerts: {len(statement['statement_alerts'])} items")
    print(f"  - First alert: {statement['statement_alerts'][0]}")
    print(f"  - Type: {type(statement['statement_alerts'][0])}")
    
    # Serialize
    json_statement = convert_statement_to_json_serializable(statement)
    print(f"\nSerialized alerts:")
    for i, alert in enumerate(json_statement['statement_alerts']):
        print(f"  - Alert {i+1}: {alert} (type: {type(alert)})")
    
    # Verify JSON serializable
    json_str = json.dumps(json_statement, indent=2)
    print(f"\nJSON representation:")
    print(json_str)
    
    # Load from JSON
    loaded_json = json.loads(json_str)
    
    # Deserialize
    object_statement = convert_statement_from_json(loaded_json)
    print(f"\nDeserialized alerts: {len(object_statement['statement_alerts'])} items")
    print(f"  - First alert: {object_statement['statement_alerts'][0]}")
    print(f"  - Type: {type(object_statement['statement_alerts'][0])}")
    
    # Verify alerts are tuples (as expected by create_or_update_statement_alert)
    assert len(object_statement['statement_alerts']) == 3, "Alert count mismatch!"
    for i, alert in enumerate(object_statement['statement_alerts']):
        assert isinstance(alert, tuple), f"Alert {i} should be tuple, got {type(alert)}"
        assert len(alert) == 2, f"Alert {i} should have 2 elements"
        assert isinstance(alert[0], str), f"Alert {i} URI should be string"
        assert isinstance(alert[1], str), f"Alert {i} text should be string"
    
    # Verify specific values
    assert object_statement['statement_alerts'][0][0] == 'http://uri.interlex.org/alert/warning1'
    assert object_statement['statement_alerts'][0][1] == 'Warning: Missing data'
    assert object_statement['statement_alerts'][1][0] == 'http://uri.interlex.org/alert/error1'
    assert object_statement['statement_alerts'][1][1] == 'Error: Invalid format'
    
    print("✓ Statement alerts serialization successful!")
    return True


def test_validation_errors_removal():
    """Test that validation_errors are removed during serialization."""
    print("\n=== Testing Validation Errors Removal ===")
    
    # Create statement with validation_errors
    statement = {
        'id': 'http://uri.interlex.org/test/statement/validation',
        'origins': NeuronDMOrigin({'http://test.org/entity1'}),
        'validation_errors': ValidationErrors(),
        '_neuron': object()  # Also test _neuron removal
    }
    
    # Add some errors
    statement['validation_errors'].entities.add('http://test.org/missing')
    statement['validation_errors'].species.add('http://test.org/unknown_species')
    
    print(f"Original has validation_errors: {statement['validation_errors'].has_errors()}")
    print(f"  - Entities errors: {statement['validation_errors'].entities}")
    print(f"  - Species errors: {statement['validation_errors'].species}")
    
    # Serialize
    json_statement = convert_statement_to_json_serializable(statement)
    
    print(f"\nAfter serialization:")
    print(f"  - Has validation_errors: {'validation_errors' in json_statement}")
    print(f"  - Has _neuron: {'_neuron' in json_statement}")
    
    # Verify JSON serializable
    try:
        json_str = json.dumps(json_statement, indent=2)
        print(f"\n✓ Successfully converted to JSON ({len(json_str)} bytes)")
        
        # Verify validation_errors and _neuron are not in the JSON
        assert 'validation_errors' not in json_statement, "validation_errors should be removed!"
        assert '_neuron' not in json_statement, "_neuron should be removed!"
        
        print("✓ validation_errors and _neuron properly removed!")
        return True
    except TypeError as e:
        print(f"\n✗ Failed to serialize: {e}")
        return False


def test_multiple_statements():
    """Test serializing multiple statements (simulating batch processing)."""
    print("\n=== Testing Multiple Statements ===")
    
    # Create multiple statements (without validation_errors)
    statements = []
    for i in range(3):
        stmt = {
            'id': f'http://uri.interlex.org/test/statement/{i}',
            'label': f'Test Neuron {i}',
            'origins': NeuronDMOrigin({f'http://test.org/entity{i}'}),
            'vias': [],
            'destinations': [],
        }
        statements.append(stmt)
    
    print(f"Created {len(statements)} statements")
    
    # Serialize all
    json_statements = [convert_statement_to_json_serializable(stmt) for stmt in statements]
    
    # Save to JSON
    json_str = json.dumps(json_statements, indent=2)
    print(f"JSON size: {len(json_str)} characters")
    
    # Load and deserialize
    loaded_json = json.loads(json_str)
    object_statements = [convert_statement_from_json(stmt) for stmt in loaded_json]
    
    # Verify
    assert len(object_statements) == 3, "Statement count mismatch!"
    for i, stmt in enumerate(object_statements):
        assert stmt['id'] == f'http://uri.interlex.org/test/statement/{i}', f"ID mismatch for statement {i}!"
        assert isinstance(stmt['origins'], NeuronDMOrigin), f"Origins type mismatch for statement {i}!"
    
    print("✓ Multiple statements successful!")
    return True


def main():
    """Run all tests."""
    print("=" * 60)
    print("NeuronDM Serialization/Deserialization Tests")
    print("=" * 60)
    
    results = []
    tests = [
        ("Origin Round-Trip", test_origin_round_trip),
        ("Via Round-Trip", test_via_round_trip),
        ("Destination Round-Trip", test_destination_round_trip),
        ("Region-Layer Serialization", test_region_layer_serialization),
        ("Statement Alerts Serialization", test_statement_alerts_serialization),
        ("Validation Errors Removal", test_validation_errors_removal),
        ("Statement Round-Trip", test_statement_round_trip),
        ("Multiple Statements", test_multiple_statements),
    ]
    
    for test_name, test_func in tests:
        try:
            success = test_func()
            results.append((test_name, success, None))
        except Exception as e:
            results.append((test_name, False, str(e)))
            import traceback
            traceback.print_exc()
    
    # Print summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    
    passed = 0
    failed = 0
    for test_name, success, error in results:
        if success:
            print(f"✓ PASS: {test_name}")
            passed += 1
        else:
            print(f"✗ FAIL: {test_name}")
            if error:
                print(f"  Error: {error}")
            failed += 1
    
    print(f"\nTotal: {passed} passed, {failed} failed out of {len(results)} tests")
    
    if failed > 0:
        print("\n⚠ Some tests failed!")
        sys.exit(1)
    else:
        print("\n✓ All tests passed!")
        sys.exit(0)


if __name__ == '__main__':
    main()
