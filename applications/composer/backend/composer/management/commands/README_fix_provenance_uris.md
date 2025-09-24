# Fix Provenance URIs Command

This Django management command fixes provenance URIs that were affected by the URL decoding bug, where URIs are missing a slash after the protocol (e.g., `https:/example.com` instead of `https://example.com`).

## Usage

### Basic usage (dry run - recommended first):
```bash
python manage.py fix_provenance_uris --dry-run
```

### Apply the fixes:
```bash
python manage.py fix_provenance_uris
```

### Custom options:
```bash
python manage.py fix_provenance_uris --dry-run --batch-size 500 --output-file my_fixes.txt
```

## Options

- `--dry-run`: Show what would be fixed without making changes (recommended for testing)
- `--output-file`: Specify output file for results (default: auto-generated with timestamp)
- `--batch-size`: Number of provenances to process in each batch (default: 1000)

## Output

The command creates a detailed text file containing:
1. List of fixed provenance IDs (one per line) for easy scripting
2. Detailed change log showing original and fixed URIs
3. Associated connectivity statement IDs
4. Timestamp and summary information

## What it fixes

The command identifies and fixes URIs with these patterns:
- `http:/example.com` → `http://example.com`
- `https:/example.com` → `https://example.com`

It validates fixes to ensure they:
- Add exactly one slash after the protocol
- Don't break already valid URIs
- Follow expected URI patterns

## Safety features

- **Dry run mode**: Test before applying changes
- **Validation**: Ensures fixes are logical and safe
- **Atomic transactions**: All changes are made atomically
- **Progress reporting**: Shows progress for large datasets
- **Detailed logging**: Records all changes for audit purposes
- **Batch processing**: Efficient memory usage for large datasets

## Example output file

```
# Fixed Provenance URIs Report
# Generated: 2025-09-24 15:30:45
# Total fixed: 3
# Format: ID | Original URI | Fixed URI | Connectivity Statement ID

# Fixed Provenance IDs (one per line):
123
456
789

# Detailed Changes:
ID: 123
  Connectivity Statement: 15
  Original: https:/www.example.com
  Fixed:    https://www.example.com
  Change:   Added missing slash after protocol
------------------------------------------------------------
```