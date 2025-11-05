# Reassign Population Indices Command

## Overview

This Django management command reassigns `population_index` values to connectivity statements based on patterns found in their `curie_id` field. It processes all population sets and their associated exported statements.

## Purpose

The command is designed to:
1. Extract hypothetical population indices from `curie_id` fields
2. Handle conflicts where multiple statements have the same hypothetical index
3. Assign sequential indices to statements that couldn't get a hypothetical index
4. Update the `last_used_index` on population sets

## Expected curie_id Pattern

The command expects `curie_id` values to follow this pattern:
```
neuron type {population_name} {population_index}
```

For example:
- `neuron type rat 1`
- `neuron type mouse 42`

## How It Works

### Phase 1: Analysis
- Retrieves all statements with `has_statement_been_exported=True` for each population
- Extracts the hypothetical population index from each statement's `curie_id`
- Tracks statements that don't match the pattern or have no `curie_id`

### Phase 2: Index Assignment
- For unique hypothetical indices: Assigns directly
- For conflicts (multiple statements with same index): 
  - Statement with smallest `id` (created earliest) gets the index
  - Other statements go into a "bag" for later assignment
- Logs all assignments and conflicts

### Phase 3: Bag Processing
- Statements in the bag (conflicts or no pattern match) get assigned sequential indices
- Starting from the last used index + 1
- Maintains creation order (sorted by statement `id`)

### Phase 4: Database Update
- Updates `population_index` on each statement
- Updates `last_used_index` on the population set
- All changes wrapped in a transaction

## Usage

### Basic Usage
```bash
python manage.py reassign_population_indices
```

### Dry Run (Preview Changes)
```bash
python manage.py reassign_population_indices --dry-run
```

### Process Specific Population
```bash
python manage.py reassign_population_indices --population "rat"
```

### Custom Log File
```bash
python manage.py reassign_population_indices --output-file /path/to/logfile.log
```

### Combined Options
```bash
python manage.py reassign_population_indices --dry-run --population "mouse" --output-file mouse_dry_run.log
```

## Command Options

| Option | Description | Default |
|--------|-------------|---------|
| `--dry-run` | Preview changes without applying them | False |
| `--output-file` | Path to log file | `population_index_reassignment_YYYY-MM-DD_HH-MM-SS.log` |
| `--population` | Process only a specific population set by name | All populations |

## Log Output

The command generates a detailed log file containing:

1. **Per-Statement Details**:
   - Statement ID
   - Hypothetical index extracted from `curie_id`
   - Assigned population index
   - Whether it was a conflict winner/loser or bag assignment

2. **Special Cases**:
   - Statements with missing `curie_id`
   - Statements where pattern couldn't be matched
   - The actual `curie_id` value for debugging

3. **Summary**:
   - Total population sets processed
   - Total statements processed
   - Total statements reassigned
   - Total conflicts resolved

### Example Log Output

```
Population Index Reassignment Report
Generated: 2025-11-05 10:30:45
Mode: LIVE
================================================================================

Processing 2 population set(s)...

Processing Population Set: rat
--------------------------------------------------------------------------------
Found 5 exported statement(s)

Phase 1: Analyzing curie_id patterns...
  Statement 101: Found hypothesis index 1 from curie_id
  Statement 102: Found hypothesis index 2 from curie_id
  Statement 103: Found hypothesis index 2 from curie_id
  Statement 104: WARNING - Could not extract index from curie_id: 'invalid format'
  Statement 105: WARNING - No curie_id present

Phase 2: Assigning population indices...
  Statement 101: Assigned index 1
  Statement 102: Assigned index 2 (conflict winner)
  Statement 103: Moved to bag (conflict loser, had same hypothesis index 2)

Phase 3: Assigning indices to 2 statement(s) in bag...
  Statement 103: Assigned index 3 (from bag)
  Statement 104: Assigned index 4 (from bag)

Phase 4: Updating database...
  Statement 101: No change needed (already 1)
  Statement 102: No change needed (already 2)
  Statement 103: Updated from 2 to 3
  Statement 104: Updated from None to 4
  Population rat: Updated last_used_index from 2 to 4

Special Cases (curie_id issues):
  Statement 104: Pattern not matched
    curie_id: 'invalid format'
  Statement 105: Missing curie_id

Completed population 'rat':
  - Statements processed: 5
  - Statements reassigned: 2
  - Conflicts resolved: 1
  - Special cases: 2

================================================================================
SUMMARY
================================================================================
Total population sets processed: 1
Total statements processed: 5
Total statements reassigned: 2
Total conflicts resolved: 1
```

## Important Notes

1. **Conflict Resolution**: When multiple statements have the same hypothetical index, the statement with the smallest `id` (earliest creation) takes precedence.

2. **Transaction Safety**: All database updates are wrapped in a transaction, so either all changes succeed or none are applied.

3. **Dry Run First**: Always run with `--dry-run` first to preview changes before applying them.

4. **Special Cases**: Statements without a `curie_id` or with non-matching patterns are logged as special cases and assigned sequential indices.

5. **Population Name Matching**: The command uses case-insensitive matching for population names and handles special regex characters in population names.

## When to Use This Command

- After importing/ingesting statements with `curie_id` values
- To resolve duplicate population indices
- To correct population index assignments after data migrations
- To ensure sequential and conflict-free population indices

