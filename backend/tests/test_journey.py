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
            ['Oa', 'V1a', 'Da'],
            ['Ob', 'Da']
        ]

        all_paths = generate_paths(origins, vias, destinations)

        all_paths.sort()
        expected_paths.sort()
        self.assertTrue(all_paths == expected_paths)

        expected_journey = [
            ['Oa', 'V1a', 'Da'],
            ['Ob', 'Da']
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
            ['Oa', 'Da'],
            ['Ob', 'Da'],
        ]

        all_paths = generate_paths(origins, None, destinations)

        all_paths.sort()
        expected_paths.sort()
        self.assertTrue(all_paths == expected_paths)

        journey_paths = consolidate_paths(all_paths)
        expected_journey = [
            ['Oa, Ob', 'Da'],
        ]
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
            ['Ob', 'V1a', 'Da'],
            ['Oa', 'V1a', 'Da'],
        ]

        all_paths = generate_paths(origins, vias, destinations)

        all_paths.sort()
        expected_paths.sort()
        self.assertTrue(all_paths == expected_paths)

        expected_journey = [
            ['Oa, Ob', 'V1a', 'Da'],
        ]
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
            ['Oa', 'V1a', 'Da'],
            ['Oa', 'V1b', 'Da'],
            ['Ob', 'V1a', 'Da'],
            ['Ob', 'V1b', 'Da']]

        all_paths.sort()
        expected_paths.sort()
        self.assertTrue(all_paths == expected_paths)

        expected_journey = [
            ['Oa, Ob', 'V1a, V1b', 'Da'],
        ]
        journey_paths = consolidate_paths(all_paths)
        self.assertTrue(journey_paths == expected_journey)
