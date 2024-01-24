import unittest
import rdflib

from composer.services.cs_ingestion.neurondm_script import process_connections, merge_origins, merge_vias, \
    merge_destinations


class TestProcessConnections(unittest.TestCase):
    def test_process_connections_basic(self):
        expected_origins = {'Oa'}
        expected_vias = {'V1a': 'AXON'}
        expected_destinations = {'Da': 'AXON-T'}

        mock_path = (
            rdflib.term.URIRef('Oa'),
            (
                rdflib.term.URIRef('V1a'),
                (
                    rdflib.term.URIRef('Da'),
                )
            )
        )

        tmp_origins, tmp_vias, tmp_destinations = process_connections(
            mock_path,
            expected_origins,
            expected_vias,
            expected_destinations
        )

        origins = merge_origins(tmp_origins)
        vias = merge_vias(tmp_vias)
        destinations = merge_destinations(tmp_destinations)

        self.assertEqual(len(origins.anatomical_entities), 1)
        self.assertEqual(len(vias), 1)
        self.assertEqual(len(destinations), 1)

    def test_process_connections_jump(self):
        expected_origins = {'Oa', 'Ob'}
        expected_vias = {
            'V1a': 'AXON',
            'V2a': 'AXON',
            'V3a': 'AXON'
        }
        expected_destinations = {'Da': 'AXON-T'}

        mock_path_complex = (
            rdflib.term.Literal('blank'),
            # Path from the first origin
            (
                rdflib.term.URIRef('Oa'),
                (
                    rdflib.term.URIRef('V1a'),
                    (
                        rdflib.term.URIRef('V3a'),
                        (
                            rdflib.term.URIRef('Da'),
                        )
                    )

                )
            ),
            # Path from the second origin
            (
                rdflib.term.URIRef('Ob'),
                (
                    rdflib.term.URIRef('V2a'),
                    (
                        rdflib.term.URIRef('V3a'),
                        (
                            rdflib.term.URIRef('Da'),
                        )
                    )

                )
            ),
        )

        tmp_origins, tmp_vias, tmp_destinations = process_connections(
            mock_path_complex,
            expected_origins,
            expected_vias,
            expected_destinations
        )

        origins = merge_origins(tmp_origins)
        vias = merge_vias(tmp_vias)
        destinations = merge_destinations(tmp_destinations)

        self.assertEqual(len(origins.anatomical_entities), 2)
        self.assertEqual(len(vias), 3)
        self.assertEqual(len(destinations), 1)
        via_orders = [via.order for via in vias]
        self.assertEqual(len(via_orders), len(set(via_orders)), "Via orders are not unique")

    def test_process_connections_multiple_predicates(self):
        expected_origins = {'Oa', 'Ob'}
        expected_vias = {
            'V1a': 'AXON',
            'Ob': 'AXON'
        }
        expected_destinations = {'Da': 'AXON-T'}

        mock_path = (
            rdflib.term.Literal('blank'),
            # Path from the first origin
            (
                rdflib.term.URIRef('Oa'),
                (
                    rdflib.term.URIRef('V1a'),
                    (
                        rdflib.term.URIRef('Ob'),
                        (
                            rdflib.term.URIRef('Da'),
                        )
                    )
                )
            ),
            # Path from the second origin
            (
                rdflib.term.URIRef('Ob'),
                (
                    rdflib.term.URIRef('Da'),
                )
            ),
        )

        tmp_origins, tmp_vias, tmp_destinations = process_connections(
            mock_path,
            expected_origins,
            expected_vias,
            expected_destinations
        )

        origins = merge_origins(tmp_origins)
        vias = merge_vias(tmp_vias)
        destinations = merge_destinations(tmp_destinations)

        self.assertEqual(len(origins.anatomical_entities), 2)
        self.assertEqual(len(vias), 2)
        self.assertEqual(len(destinations), 1)


if __name__ == '__main__':
    unittest.main()
