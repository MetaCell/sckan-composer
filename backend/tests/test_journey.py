from django.db import connection
from django.test import TestCase, override_settings

from composer.models import Sentence, ConnectivityStatement, AnatomicalEntity, AnatomicalEntityMeta, Via, Destination
from composer.services.graph_service import generate_paths, consolidate_paths


@override_settings(DEBUG=True)
class JourneyTestCase(TestCase):

    def setUp(self):
        self.created_entities = {}

    def create_or_get_anatomical_entity(self, name):
        if name not in self.created_entities:
            meta, _ = AnatomicalEntityMeta.objects.get_or_create(name=name, ontology_uri=name)
            entity, _ = AnatomicalEntity.objects.get_or_create(simple_entity=meta)
            self.created_entities[name] = entity
        return self.created_entities[name]

    def test_journey_simple_graph_with_jump(self):
        # Test setup
        sentence = Sentence.objects.create()
        cs = ConnectivityStatement.objects.create(sentence=sentence)

        origin1 = self.create_or_get_anatomical_entity("Oa")
        origin2 = self.create_or_get_anatomical_entity("Ob")
        via1 = self.create_or_get_anatomical_entity('V1a')
        destination1 = self.create_or_get_anatomical_entity('Da')

        cs.origins.add(origin1, origin2)

        via = Via.objects.create(connectivity_statement=cs)
        via.anatomical_entities.add(via1)
        via.from_entities.add(origin1)

        destination = Destination.objects.create(connectivity_statement=cs)
        destination.anatomical_entities.add(destination1)
        destination.from_entities.add(via1, origin2)

        # Prefetch related data
        origins = list(cs.origins.all())
        vias = list(
            Via.objects.filter(connectivity_statement=cs).prefetch_related('anatomical_entities', 'from_entities'))
        destinations = list(
            Destination.objects.filter(connectivity_statement=cs).prefetch_related('anatomical_entities',
                                                                                   'from_entities'))

        # Test execution
        expected_paths = [
            [('Oa', 0), ('V1a', 1), ('Da', 2)],
            [('Ob', 0), ('Da', 2)]
        ]

        all_paths = generate_paths(origins, vias, destinations)

        all_paths.sort()
        expected_paths.sort()
        self.assertTrue(all_paths == expected_paths)

        consolidated_path, journey_paths = consolidate_paths(all_paths)
        expected_journey = [
            [('Oa', 0), ('V1a', 1), ('Da', 2)],
            [('Ob', 0), ('Da', 2)]
        ]
        journey_paths.sort()
        expected_journey.sort()
        self.assertTrue(journey_paths == expected_journey)

    def test_journey_simple_direct_graph(self):
        #####################################################################

        # Oa -> Da
        # Ob -> Da

        sentence = Sentence.objects.create()
        cs = ConnectivityStatement.objects.create(sentence=sentence)

        # Create Anatomical Entities
        origin1 = self.create_or_get_anatomical_entity("Oa")
        origin2 = self.create_or_get_anatomical_entity("Ob")
        destination1 = self.create_or_get_anatomical_entity('Da')

        # Add origins
        cs.origins.add(origin1, origin2)

        # Create Destination
        destination = Destination.objects.create(connectivity_statement=cs)
        destination.anatomical_entities.add(destination1)
        destination.from_entities.add(origin1, origin2)

        ######################################################################

        # Prefetch related data
        origins = list(cs.origins.all())
        destinations = list(
            Destination.objects.filter(connectivity_statement=cs).prefetch_related('anatomical_entities',
                                                                                   'from_entities'))

        expected_paths = [
            [('Oa', 0), ('Da', 1)],
            [('Ob', 0), ('Da', 1)]
        ]

        all_paths = generate_paths(origins, None, destinations)

        all_paths.sort()
        expected_paths.sort()
        self.assertTrue(all_paths == expected_paths)

        consolidated_path, journey_paths = consolidate_paths(all_paths)
        expected_journey = [[('Oa or Ob', 0), ('Da', 1)]]
        self.assertTrue(journey_paths == expected_journey)

    def test_journey_simple_graph_no_jumps(self):
        #####################################################################

        # Oa -> V1a -> Da
        # Ob -> V1a -> Da

        sentence = Sentence.objects.create()
        cs = ConnectivityStatement.objects.create(sentence=sentence)

        # Create Anatomical Entities
        origin1 = self.create_or_get_anatomical_entity("Oa")
        origin2 = self.create_or_get_anatomical_entity("Ob")
        via1 = self.create_or_get_anatomical_entity('V1a')
        destination1 = self.create_or_get_anatomical_entity('Da')

        # Add origins
        cs.origins.add(origin1, origin2)

        # Create Via
        via = Via.objects.create(connectivity_statement=cs)
        via.anatomical_entities.add(via1)
        via.from_entities.add(origin1, origin2)

        # Create Destination
        destination = Destination.objects.create(connectivity_statement=cs)
        destination.anatomical_entities.add(destination1)
        destination.from_entities.add(via1)

        ######################################################################

        # Prefetch related data
        origins = list(cs.origins.all())
        vias = list(
            Via.objects.filter(connectivity_statement=cs).prefetch_related('anatomical_entities', 'from_entities'))
        destinations = list(
            Destination.objects.filter(connectivity_statement=cs).prefetch_related('anatomical_entities',
                                                                                   'from_entities'))

        expected_paths = [
            [('Ob', 0), ('V1a', 1), ('Da', 2)],
            [('Oa', 0), ('V1a', 1), ('Da', 2)]
        ]

        all_paths = generate_paths(origins, vias, destinations)

        all_paths.sort()
        expected_paths.sort()
        self.assertTrue(all_paths == expected_paths)

        expected_journey = [[('Oa or Ob', 0), ('V1a', 1), ('Da', 2)]]
        consolidated_path, journey_paths = consolidate_paths(all_paths)
        self.assertTrue(journey_paths == expected_journey)

    def test_journey_multiple_vias_no_jumps(self):
        #####################################################################

        # Oa -> V1a -> Da
        # Ob -> V1a -> Da
        # Oa -> V1b -> Da
        # Ob -> V1b -> Da

        sentence = Sentence.objects.create()
        cs = ConnectivityStatement.objects.create(sentence=sentence)

        # Create Anatomical Entities
        origin1 = self.create_or_get_anatomical_entity("Oa")
        origin2 = self.create_or_get_anatomical_entity("Ob")
        via1 = self.create_or_get_anatomical_entity('V1a')
        via2 = self.create_or_get_anatomical_entity('V1b')
        destination1 = self.create_or_get_anatomical_entity('Da')

        # Add origins
        cs.origins.add(origin1, origin2)

        # Create Via
        via = Via.objects.create(connectivity_statement=cs)
        via.anatomical_entities.add(via1, via2)
        via.from_entities.add(origin1, origin2)

        # Create Destination
        destination = Destination.objects.create(connectivity_statement=cs)
        destination.anatomical_entities.add(destination1)
        destination.from_entities.add(via1, via2)

        ######################################################################

        # Prefetch related data
        origins = list(cs.origins.all())
        vias = list(
            Via.objects.filter(connectivity_statement=cs).prefetch_related('anatomical_entities', 'from_entities'))
        destinations = list(
            Destination.objects.filter(connectivity_statement=cs).prefetch_related('anatomical_entities',
                                                                                   'from_entities'))

        all_paths = generate_paths(origins, vias, destinations)

        expected_paths = [
            [('Oa', 0), ('V1a', 1), ('Da', 2)],
            [('Oa', 0), ('V1b', 1), ('Da', 2)],
            [('Ob', 0), ('V1a', 1), ('Da', 2)],
            [('Ob', 0), ('V1b', 1), ('Da', 2)]
        ]

        all_paths.sort()
        expected_paths.sort()
        self.assertTrue(all_paths == expected_paths)

        expected_journey = [
            [('Oa or Ob', 0), ('V1a, V1b', 1), ('Da', 2)]
        ]
        consolidated_path, journey_paths = consolidate_paths(all_paths)
        self.assertTrue(journey_paths == expected_journey)

    def test_journey_complex_graph(self):
        #####################################################################

        # Oa -> V3a -> Da
        # Oa -> V1a -> V2a -> V4a -> Da
        # Oa -> V1a -> V2a -> V3a -> Da
        # Oa -> V1a -> V2b -> Da
        # Ob -> V1a -> V2a -> V4a -> Da
        # Ob -> V1a -> V2a -> V3a -> Da
        # Ob -> V1a -> V2b -> Da

        sentence = Sentence.objects.create()
        cs = ConnectivityStatement.objects.create(sentence=sentence)

        origin_a = self.create_or_get_anatomical_entity("Oa")
        origin_b = self.create_or_get_anatomical_entity("Ob")
        via1_a = self.create_or_get_anatomical_entity('V1a')
        via2_a = self.create_or_get_anatomical_entity('V2a')
        via2_b = self.create_or_get_anatomical_entity('V2b')
        via3_a = self.create_or_get_anatomical_entity('V3a')
        via4_a = self.create_or_get_anatomical_entity('V4a')
        destination_a = self.create_or_get_anatomical_entity('Da')

        # Add origins
        cs.origins.add(origin_a, origin_b)

        # Create Vias
        via1 = Via.objects.create(connectivity_statement=cs)
        via1.anatomical_entities.add(via1_a)
        via1.from_entities.add(origin_a, origin_b)

        via2 = Via.objects.create(connectivity_statement=cs)
        via2.anatomical_entities.add(via2_a, via2_b)
        via2.from_entities.add(via1_a)

        via3 = Via.objects.create(connectivity_statement=cs)
        via3.anatomical_entities.add(via3_a)
        via3.from_entities.add(via2_a, origin_a)

        via4 = Via.objects.create(connectivity_statement=cs)
        via4.anatomical_entities.add(via4_a)
        via4.from_entities.add(via2_a)

        # Create Destination
        destination = Destination.objects.create(connectivity_statement=cs)
        destination.anatomical_entities.add(destination_a)
        destination.from_entities.add(via4_a, via3_a, via2_b)

        ######################################################################

        # Prefetch related data
        origins = list(cs.origins.all())
        vias = list(
            Via.objects.filter(connectivity_statement=cs).prefetch_related('anatomical_entities', 'from_entities'))
        destinations = list(
            Destination.objects.filter(connectivity_statement=cs).prefetch_related('anatomical_entities',
                                                                                   'from_entities'))

        all_paths = generate_paths(origins, vias, destinations)

        expected_paths = [
            [('Oa', 0), ('V3a', 3), ('Da', 5)],
            [('Oa', 0), ('V1a', 1), ('V2a', 2), ('V4a', 4), ('Da', 5)],
            [('Oa', 0), ('V1a', 1), ('V2a', 2), ('V3a', 3), ('Da', 5)],
            [('Oa', 0), ('V1a', 1), ('V2b', 2), ('Da', 5)],
            [('Ob', 0), ('V1a', 1), ('V2a', 2), ('V4a', 4), ('Da', 5)],
            [('Ob', 0), ('V1a', 1), ('V2a', 2), ('V3a', 3), ('Da', 5)],
            [('Ob', 0), ('V1a', 1), ('V2b', 2), ('Da', 5)]
        ]

        all_paths.sort()
        expected_paths.sort()
        self.assertTrue(all_paths == expected_paths)

        expected_journey = [[('Oa or Ob', 0), ('V1a', 1), ('V2a', 2), ('V3a', 3), ('Da', 5)],
                            [('Oa or Ob', 0), ('V1a', 1), ('V2a', 2), ('V4a', 4), ('Da', 5)],
                            [('Oa or Ob', 0), ('V1a', 1), ('V2b', 2), ('Da', 5)],
                            [('Oa', 0), ('V3a', 3), ('Da', 5)]]
        consolidated_path, journey_paths = consolidate_paths(all_paths)
        self.assertTrue(journey_paths == expected_journey)

    def test_journey_complex_graph_2(self):
        sentence = Sentence.objects.create()
        cs = ConnectivityStatement.objects.create(sentence=sentence)

        origin_a = self.create_or_get_anatomical_entity("Oa")
        origin_b = self.create_or_get_anatomical_entity("Ob")
        via1_a = self.create_or_get_anatomical_entity('V1a')
        via2_a = self.create_or_get_anatomical_entity('V2a')
        via2_b = self.create_or_get_anatomical_entity('V2b')
        via3_a = self.create_or_get_anatomical_entity('V3a')
        via4_a = self.create_or_get_anatomical_entity('V4a')
        via5_a = self.create_or_get_anatomical_entity('V5a')
        via5_b = self.create_or_get_anatomical_entity('V5b')
        via6_a = self.create_or_get_anatomical_entity('V6a')
        destination_a = self.create_or_get_anatomical_entity('Da')

        # Add origins
        cs.origins.add(origin_a, origin_b)

        # Create Vias
        via1 = Via.objects.create(connectivity_statement=cs)
        via1.anatomical_entities.add(via1_a)
        via1.from_entities.add(origin_a, origin_b)

        via2 = Via.objects.create(connectivity_statement=cs)
        via2.anatomical_entities.add(via2_a, via2_b)
        via2.from_entities.add(via1_a)

        via3 = Via.objects.create(connectivity_statement=cs)
        via3.anatomical_entities.add(via3_a)
        via3.from_entities.add(via2_a, via1_a)

        via4 = Via.objects.create(connectivity_statement=cs)
        via4.anatomical_entities.add(via4_a)
        via4.from_entities.add(via2_b, via3_a)

        via5 = Via.objects.create(connectivity_statement=cs)
        via5.anatomical_entities.add(via5_a, via5_b)
        via5.from_entities.add(via4_a)

        via6 = Via.objects.create(connectivity_statement=cs)
        via6.anatomical_entities.add(via6_a)
        via6.from_entities.add(via5_a)

        # Create Destination
        destination = Destination.objects.create(connectivity_statement=cs)
        destination.anatomical_entities.add(destination_a)
        destination.from_entities.add(via6_a, via5_b)

        ######################################################################

        # Prefetch related data
        origins = list(cs.origins.all())
        vias = list(
            Via.objects.filter(connectivity_statement=cs).prefetch_related('anatomical_entities', 'from_entities'))
        destinations = list(
            Destination.objects.filter(connectivity_statement=cs).prefetch_related('anatomical_entities',
                                                                                   'from_entities'))

        all_paths = generate_paths(origins, vias, destinations)
        expected_paths = [
            [('Oa', 0), ('V1a', 1), ('V2a', 2), ('V3a', 3), ('V4a', 4), ('V5a', 5), ('V6a', 6), ('Da', 7)],
            [('Ob', 0), ('V1a', 1), ('V2a', 2), ('V3a', 3), ('V4a', 4), ('V5a', 5), ('V6a', 6), ('Da', 7)],
            [('Oa', 0), ('V1a', 1), ('V2b', 2), ('V4a', 4), ('V5a', 5), ('V6a', 6), ('Da', 7)],
            [('Ob', 0), ('V1a', 1), ('V2b', 2), ('V4a', 4), ('V5a', 5), ('V6a', 6), ('Da', 7)],
            [('Oa', 0), ('V1a', 1), ('V3a', 3), ('V4a', 4), ('V5a', 5), ('V6a', 6), ('Da', 7)],
            [('Ob', 0), ('V1a', 1), ('V3a', 3), ('V4a', 4), ('V5a', 5), ('V6a', 6), ('Da', 7)],

            [('Oa', 0), ('V1a', 1), ('V2a', 2), ('V3a', 3), ('V4a', 4), ('V5b', 5), ('Da', 7)],
            [('Ob', 0), ('V1a', 1), ('V2a', 2), ('V3a', 3), ('V4a', 4), ('V5b', 5), ('Da', 7)],
            [('Oa', 0), ('V1a', 1), ('V2b', 2), ('V4a', 4), ('V5b', 5), ('Da', 7)],
            [('Ob', 0), ('V1a', 1), ('V2b', 2), ('V4a', 4), ('V5b', 5), ('Da', 7)],
            [('Oa', 0), ('V1a', 1), ('V3a', 3), ('V4a', 4), ('V5b', 5), ('Da', 7)],
            [('Ob', 0), ('V1a', 1), ('V3a', 3), ('V4a', 4), ('V5b', 5), ('Da', 7)],
        ]

        all_paths.sort()
        expected_paths.sort()
        self.assertTrue(all_paths == expected_paths)

        expected_journey = [
            [('Oa or Ob', 0), ('V1a', 1), ('V2a', 2), ('V3a', 3), ('V4a', 4), ('V5a', 5), ('V6a', 6), ('Da', 7)],
            [('Oa or Ob', 0), ('V1a', 1), ('V2b', 2), ('V4a', 4), ('V5a', 5), ('V6a', 6), ('Da', 7)],
            [('Oa or Ob', 0), ('V1a', 1), ('V2a', 2), ('V3a', 3), ('V4a', 4), ('V5b', 5), ('Da', 7)],
            [('Oa or Ob', 0), ('V1a', 1), ('V3a', 3), ('V4a', 4), ('V5a', 5), ('V6a', 6), ('Da', 7)],
            [('Oa or Ob', 0), ('V1a', 1), ('V2b', 2), ('V4a', 4), ('V5b', 5), ('Da', 7)],
            [('Oa or Ob', 0), ('V1a', 1), ('V3a', 3), ('V4a', 4), ('V5b', 5), ('Da', 7)]
        ]

        consolidated_path, journey_paths = consolidate_paths(all_paths)
        journey_paths.sort()
        expected_journey.sort()
        self.assertTrue(journey_paths == expected_journey)

    def test_journey_cycles(self):
        #####################################################################

        # Oa -> Oa -> Da
        # Ob -> Da

        sentence = Sentence.objects.create()
        cs = ConnectivityStatement.objects.create(sentence=sentence)

        # Create Anatomical Entities
        origin1 = self.create_or_get_anatomical_entity("Oa")
        origin2 = self.create_or_get_anatomical_entity("Ob")
        destination1 = self.create_or_get_anatomical_entity('Da')

        # Add origins
        cs.origins.add(origin1, origin2)

        # Create Via
        via = Via.objects.create(connectivity_statement=cs)
        via.anatomical_entities.add(origin1)
        via.from_entities.add(origin1)

        # Create Destination
        destination = Destination.objects.create(connectivity_statement=cs)
        destination.anatomical_entities.add(destination1)
        destination.from_entities.add(origin1, origin2)

        ######################################################################

        # Prefetch related data
        origins = list(cs.origins.all())
        vias = list(
            Via.objects.filter(connectivity_statement=cs).prefetch_related('anatomical_entities', 'from_entities'))
        destinations = list(
            Destination.objects.filter(connectivity_statement=cs).prefetch_related('anatomical_entities',
                                                                                   'from_entities'))

        expected_paths = [
            [('Oa', 0), ('Da', 2)],
            [('Oa', 0), ('Oa', 1), ('Da', 2)],
            [('Ob', 0), ('Da', 2)]
        ]

        all_paths = generate_paths(origins, vias, destinations)

        all_paths.sort()
        expected_paths.sort()
        self.assertTrue(all_paths == expected_paths)

        expected_journey = [
            [('Oa', 0), ('Oa', 1), ('Da', 2)],
            [('Oa or Ob', 0), ('Da', 2)]
        ]

        consolidated_path, journey_paths = consolidate_paths(all_paths)
        expected_journey.sort()
        journey_paths.sort()
        self.assertTrue(journey_paths == expected_journey)

    def test_journey_nonconsecutive_vias(self):
        # Test setup
        sentence = Sentence.objects.create()
        cs = ConnectivityStatement.objects.create(sentence=sentence)

        origin1 = self.create_or_get_anatomical_entity("Oa")
        via1 = self.create_or_get_anatomical_entity('V1a')
        via2 = self.create_or_get_anatomical_entity("V2a")
        destination1 = self.create_or_get_anatomical_entity('Da')

        cs.origins.add(origin1)

        via_a = Via.objects.create(connectivity_statement=cs)
        via_a.anatomical_entities.add(via1)
        via_a.from_entities.add(origin1)

        via_b = Via.objects.create(connectivity_statement=cs)
        via_b.anatomical_entities.add(via2)
        via_b.from_entities.add(via1)

        # Directly change the order of vias in the database
        Via.objects.filter(pk=via_a.pk).update(order=2)  # Change to non-zero start
        Via.objects.filter(pk=via_b.pk).update(order=5)  # Change to non-consecutive

        destination = Destination.objects.create(connectivity_statement=cs)
        destination.anatomical_entities.add(destination1)
        destination.from_entities.add(via2)

        # Prefetch related data
        origins = list(cs.origins.all())
        vias = list(
            Via.objects.filter(connectivity_statement=cs).prefetch_related('anatomical_entities', 'from_entities'))
        destinations = list(
            Destination.objects.filter(connectivity_statement=cs).prefetch_related('anatomical_entities',
                                                                                   'from_entities'))

        expected_paths = [
            [('Oa', 0), ('V1a', 3), ('V2a', 6), ('Da', 7)],
        ]

        all_paths = generate_paths(origins, vias, destinations)

        all_paths.sort()
        expected_paths.sort()
        self.assertTrue(all_paths == expected_paths, f"Expected paths {expected_paths}, but found {all_paths}")

        consolidated_path, journey_paths = consolidate_paths(all_paths)
        expected_journey = [
            [('Oa', 0), ('V1a', 3), ('V2a', 6), ('Da', 7)],
        ]
        journey_paths.sort()
        expected_journey.sort()
        self.assertTrue(journey_paths == expected_journey,
                        f"Expected journey {expected_journey}, but found {journey_paths}")

    def test_journey_implicit_from_entities(self):
        # Test setup
        sentence = Sentence.objects.create()
        cs = ConnectivityStatement.objects.create(sentence=sentence)

        origin1 = self.create_or_get_anatomical_entity("Myenteric")
        via1 = self.create_or_get_anatomical_entity('Longitudinal')
        via2 = self.create_or_get_anatomical_entity("Serosa")
        via3 = self.create_or_get_anatomical_entity("lumbar")
        destination1 = self.create_or_get_anatomical_entity('inferior')

        cs.origins.add(origin1)

        via_a = Via.objects.create(connectivity_statement=cs)
        via_a.anatomical_entities.add(via1)

        via_b = Via.objects.create(connectivity_statement=cs)
        via_b.anatomical_entities.add(via2)

        via_c = Via.objects.create(connectivity_statement=cs)
        via_c.anatomical_entities.add(via3)

        destination = Destination.objects.create(connectivity_statement=cs)
        destination.anatomical_entities.add(destination1)

        # Prefetch related data
        origins = list(cs.origins.all())
        vias = list(
            Via.objects.filter(connectivity_statement=cs).prefetch_related('anatomical_entities', 'from_entities'))
        destinations = list(
            Destination.objects.filter(connectivity_statement=cs).prefetch_related('anatomical_entities',
                                                                                   'from_entities'))

        expected_paths = [
            [('Myenteric', 0), ('Longitudinal', 1), ('Serosa', 2), ('lumbar', 3), ('inferior', 4)],
        ]

        all_paths = generate_paths(origins, vias, destinations)

        all_paths.sort()
        expected_paths.sort()
        self.assertTrue(all_paths == expected_paths, f"Expected paths {expected_paths}, but found {all_paths}")

        consolidated_path, journey_paths = consolidate_paths(all_paths)
        expected_journey = [
            [('Myenteric', 0), ('Longitudinal', 1), ('Serosa', 2), ('lumbar', 3), ('inferior', 4)],
        ]
        journey_paths.sort()
        expected_journey.sort()
        self.assertTrue(journey_paths == expected_journey,
                        f"Expected journey {expected_journey}, but found {journey_paths}")
