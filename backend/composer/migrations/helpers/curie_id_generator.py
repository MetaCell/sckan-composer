def generate_connectivity_statement_curie_id_for_composer_statements(statement):
    """
    Generate a curie_id for a connectivity statement based on its population and index.
    Format: neuron type {population_name} {index}
    """
    if statement.population:
        return f"neuron type {statement.population.name} {statement.population_index}"
    return None
