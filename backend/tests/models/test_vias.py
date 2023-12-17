from django.test import TestCase
from composer.models import ConnectivityStatement, Via, Sentence, AnatomicalEntity

class ViaModelTestCase(TestCase):

    def create_initial_state(self):
        sentence = Sentence.objects.create()
        statement = ConnectivityStatement.objects.create(sentence=sentence)

        via0 = Via.objects.create(connectivity_statement=statement)
        via1 = Via.objects.create(connectivity_statement=statement)
        via2 = Via.objects.create(connectivity_statement=statement)

        return statement, [via0, via1, via2]

    def test_via_order_update(self):
        statement, initial_vias = self.create_initial_state()

        # Change the order of the via currently at order 1 to order 0
        via_to_change = initial_vias[1]
        via_to_change.order = 0
        via_to_change.save()

        updated_vias = list(Via.objects.filter(connectivity_statement=statement).order_by('order'))

        # Check the orders and primary keys
        self.assertEqual(updated_vias[0].pk, via_to_change.pk)
        self.assertEqual(updated_vias[1].pk, initial_vias[0].pk)
        self.assertEqual(updated_vias[2].pk, initial_vias[2].pk)

    def test_via_deletion_updates_order(self):
        statement, initial_vias = self.create_initial_state()

        # Delete the second via
        initial_vias[1].delete()

        # Refetch the remaining vias
        remaining_vias = Via.objects.filter(connectivity_statement=statement).order_by('order')
        self.assertEqual(remaining_vias.count(), 2)
        self.assertEqual(remaining_vias[0].order, 0)
        self.assertEqual(remaining_vias[0].pk, initial_vias[0].pk)
        self.assertEqual(remaining_vias[1].order, 1)
        self.assertEqual(remaining_vias[1].pk, initial_vias[2].pk)

    def test_via_order_change_clears_from_entities(self):
        statement, initial_vias = self.create_initial_state()
        anatomical_entity = AnatomicalEntity.objects.create(name="Test Entity")

        for via in initial_vias:
            via.from_entities.add(anatomical_entity)

        # Change the order of via2 and save
        via_to_change = initial_vias[1]
        via_to_change.order = 0
        via_to_change.save()

        # Refetch vias to get updated data
        initial_vias[0].refresh_from_db()
        via_to_change.refresh_from_db()
        initial_vias[2].refresh_from_db()

        # Check if from_entities are cleared
        self.assertFalse(initial_vias[0].from_entities.exists())
        self.assertFalse(via_to_change.from_entities.exists())
        self.assertTrue(initial_vias[2].from_entities.exists())
