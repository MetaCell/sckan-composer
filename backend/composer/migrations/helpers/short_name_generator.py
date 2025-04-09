def generate_connectivity_statement_short_name(statement):
    """
    Generate a short name for a connectivity statement based on its population and index.
    """
    if statement.population:
        return f"neuron type {statement.population.name} {statement.population_index}"
    return None
