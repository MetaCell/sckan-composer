from django.test import TestCase

from composer.models import Sentence, ConnectivityStatement, AnatomicalEntity, Via, Destination
from composer.services.graph_service import generate_paths, consolidate_paths


class JourneyTestCase(TestCase):

    def test_journey_simple_graph_with_jump(self):
        #####################################################################

        # Oa -> V1a -> Da
        # Ob -> Da

        sentence = Sentence.objects.create()
        cs = ConnectivityStatement.objects.create(sentence=sentence)

        # Create Anatomical Entities
        origin1 = AnatomicalEntity.objects.create(name='Oa')
        origin2 = AnatomicalEntity.objects.create(name='Ob')
        via1 = AnatomicalEntity.objects.create(name='V1a')
        destination1 = AnatomicalEntity.objects.create(name='Da')

        # Add origins
        cs.origins.add(origin1, origin2)

        # Create Via
        via = Via.objects.create(connectivity_statement=cs, order=0)
        via.anatomical_entities.add(via1)
        via.from_entities.add(origin1)

        # Create Destination
        destination = Destination.objects.create(connectivity_statement=cs)
        destination.anatomical_entities.add(destination1)
        destination.from_entities.add(via1, origin2)

        ######################################################################

        origins = list(cs.origins.all())
        vias = list(Via.objects.filter(connectivity_statement=cs))
        destinations = list(Destination.objects.filter(connectivity_statement=cs))

        expected_paths = [
            [('Oa', 0), ('V1a', 1), ('Da', 2)],
            [('Ob', 0), ('Da', 2)]
        ]

        all_paths = generate_paths(origins, vias, destinations)

        all_paths.sort()
        expected_paths.sort()
        self.assertTrue(all_paths == expected_paths)

        expected_journey = [
            [('Oa', 0), ('V1a', 1), ('Da', 2)],
            [('Ob', 0), ('Da', 2)]
        ]

        journey_paths = consolidate_paths(all_paths)
        expected_journey.sort()
        journey_paths.sort()
        self.assertTrue(journey_paths == expected_journey)

    def test_journey_simple_direct_graph(self):
        #####################################################################

        # Oa -> Da
        # Ob -> Da

        sentence = Sentence.objects.create()
        cs = ConnectivityStatement.objects.create(sentence=sentence)

        # Create Anatomical Entities
        origin1 = AnatomicalEntity.objects.create(name='Oa')
        origin2 = AnatomicalEntity.objects.create(name='Ob')
        destination1 = AnatomicalEntity.objects.create(name='Da')

        # Add origins
        cs.origins.add(origin1, origin2)

        # Create Destination
        destination = Destination.objects.create(connectivity_statement=cs)
        destination.anatomical_entities.add(destination1)
        destination.from_entities.add(origin1, origin2)

        ######################################################################

        origins = list(cs.origins.all())
        destinations = list(Destination.objects.filter(connectivity_statement=cs))

        expected_paths = [
            [('Oa', 0), ('Da', 1)],
            [('Ob', 0), ('Da', 1)]
        ]

        all_paths = generate_paths(origins, None, destinations)

        all_paths.sort()
        expected_paths.sort()
        self.assertTrue(all_paths == expected_paths)

        journey_paths = consolidate_paths(all_paths)
        expected_journey = [[('Oa, Ob', 0), ('Da', 1)]]
        self.assertTrue(journey_paths == expected_journey)

    def test_journey_simple_graph_no_jumps(self):
        #####################################################################

        # Oa -> V1a -> Da
        # Ob -> V1a -> Da

        sentence = Sentence.objects.create()
        cs = ConnectivityStatement.objects.create(sentence=sentence)

        # Create Anatomical Entities
        origin1 = AnatomicalEntity.objects.create(name='Oa')
        origin2 = AnatomicalEntity.objects.create(name='Ob')
        via1 = AnatomicalEntity.objects.create(name='V1a')
        destination1 = AnatomicalEntity.objects.create(name='Da')

        # Add origins
        cs.origins.add(origin1, origin2)

        # Create Via
        via = Via.objects.create(connectivity_statement=cs, order=0)
        via.anatomical_entities.add(via1)
        via.from_entities.add(origin1, origin2)

        # Create Destination
        destination = Destination.objects.create(connectivity_statement=cs)
        destination.anatomical_entities.add(destination1)
        destination.from_entities.add(via1)

        ######################################################################

        origins = list(cs.origins.all())
        vias = list(Via.objects.filter(connectivity_statement=cs))
        destinations = list(Destination.objects.filter(connectivity_statement=cs))

        expected_paths = [
            [('Ob', 0), ('V1a', 1), ('Da', 2)],
            [('Oa', 0), ('V1a', 1), ('Da', 2)]
        ]

        all_paths = generate_paths(origins, vias, destinations)

        all_paths.sort()
        expected_paths.sort()
        self.assertTrue(all_paths == expected_paths)

        expected_journey = [[('Oa, Ob', 0), ('V1a', 1), ('Da', 2)]]
        journey_paths = consolidate_paths(all_paths)
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
        origin1 = AnatomicalEntity.objects.create(name='Oa')
        origin2 = AnatomicalEntity.objects.create(name='Ob')
        via1 = AnatomicalEntity.objects.create(name='V1a')
        via2 = AnatomicalEntity.objects.create(name='V1b')
        destination1 = AnatomicalEntity.objects.create(name='Da')

        # Add origins
        cs.origins.add(origin1, origin2)

        # Create Via
        via = Via.objects.create(connectivity_statement=cs, order=0)
        via.anatomical_entities.add(via1, via2)
        via.from_entities.add(origin1, origin2)

        # Create Destination
        destination = Destination.objects.create(connectivity_statement=cs)
        destination.anatomical_entities.add(destination1)
        destination.from_entities.add(via1, via2)

        ######################################################################

        origins = list(cs.origins.all())
        vias = list(Via.objects.filter(connectivity_statement=cs))
        destinations = list(Destination.objects.filter(connectivity_statement=cs))

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
            [('Oa, Ob', 0), ('V1a, V1b', 1), ('Da', 2)]
        ]
        journey_paths = consolidate_paths(all_paths)
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

        # Create Anatomical Entities
        origin_a = AnatomicalEntity.objects.create(name='Oa')
        origin_b = AnatomicalEntity.objects.create(name='Ob')
        via1_a = AnatomicalEntity.objects.create(name='V1a')
        via2_a = AnatomicalEntity.objects.create(name='V2a')
        via2_b = AnatomicalEntity.objects.create(name='V2b')
        via3_a = AnatomicalEntity.objects.create(name='V3a')
        via4_a = AnatomicalEntity.objects.create(name='V4a')
        destination_a = AnatomicalEntity.objects.create(name='Da')

        # Add origins
        cs.origins.add(origin_a, origin_b)

        # Create Vias
        via1 = Via.objects.create(connectivity_statement=cs, order=0)
        via1.anatomical_entities.add(via1_a)
        via1.from_entities.add(origin_a, origin_b)

        via2 = Via.objects.create(connectivity_statement=cs, order=1)
        via2.anatomical_entities.add(via2_a, via2_b)
        via2.from_entities.add(via1_a)

        via3 = Via.objects.create(connectivity_statement=cs, order=2)
        via3.anatomical_entities.add(via3_a)
        via3.from_entities.add(via2_a, origin_a)

        via4 = Via.objects.create(connectivity_statement=cs, order=3)
        via4.anatomical_entities.add(via4_a)
        via4.from_entities.add(via2_a)

        # Create Destination
        destination = Destination.objects.create(connectivity_statement=cs)
        destination.anatomical_entities.add(destination_a)
        destination.from_entities.add(via4_a, via3_a, via2_b)

        ######################################################################

        origins = list(cs.origins.all())
        vias = list(Via.objects.filter(connectivity_statement=cs))
        destinations = list(Destination.objects.filter(connectivity_statement=cs))

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

        expected_journey = [[('Oa, Ob', 0), ('V1a', 1), ('V2a', 2), ('V3a', 3), ('Da', 5)],
                            [('Oa, Ob', 0), ('V1a', 1), ('V2a', 2), ('V4a', 4), ('Da', 5)],
                            [('Oa, Ob', 0), ('V1a', 1), ('V2b', 2), ('Da', 5)],
                            [('Oa', 0), ('V3a', 3), ('Da', 5)]]
        journey_paths = consolidate_paths(all_paths)
        self.assertTrue(journey_paths == expected_journey)
