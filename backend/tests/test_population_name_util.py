from django.test import TestCase
from composer.utils import is_valid_population_name
from composer.models import PopulationSet


class TestPopulationName(TestCase):
    def test_valid_population_names(self):
        valid_names = [
            "Neuron123",
            "Population01",
            "ValidName1234",
            "neuron_pop",
        ]
        for name in valid_names:
            self.assertTrue(is_valid_population_name(name))

    def test_invalid_population_names(self):
        invalid_names = [
            "123Neuron",
            "shot",
            "thisnameiswaytoolongtobevalid",
            "Invalid-Name",
        ]
        for name in invalid_names:
            self.assertFalse(is_valid_population_name(name))

    # we should add PopulationSet, and check if it was converted to lower case
    def test_population_name_to_lower_case(self):
        name = "Neuron123"
        population = PopulationSet.objects.create(name=name)
        self.assertEqual(population.name, name.lower())
        self.assertTrue(is_valid_population_name(population.name))
