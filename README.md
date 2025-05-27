# sckan-composer

## Prerequisites

### Python

The deployment process is based on Python 3.9+ scripts. It is recommended to setup a virtual
environment first.

With venv:
```bash
python3 -m venv venv
source venv/bin/activate
```

With pyenv (get it [here](https://github.com/pyenv/pyenv)):
```bash
pyenv virtualenv 3.9.15 composer
pyenv activate composer
```

With (mini)conda (get it [here](https://docs.conda.io/en/latest/miniconda.html)):
```bash
conda create --name composer python=3.9
conda activate composer
```


## Development setup

### Running locally
```bash
cd backend
# make sure your virtual env is activated
# and install the requirements
pip3 install --upgrade -r requirements.txt
# run the migrations
python3 manage.py migrate
# run the development server (https)
python3 manage.py runsslserver
```

### Ingest sample NLP data
The git repository comes with some sample NLP data. This data can be ingested using 
the "ingest_nlp_sentence" management command

```bash
cd applications/composer/backend
python3 manage.py ingest_nlp_sentence ./composer/resources/pmc_oai_202209.csv
```

### Ingest sample Anatomical Entities data
The git repository comes with some sampleAnatomical Entities data. This data can be ingested using 
the "ingest_anatomical_entities" management command

```bash
cd applications/composer/backend
python3 manage.py ingest_anatomical_entities ./composer/resources/anatomical_entities.csv
```

### Ingest Statements
You can get the detailed shell script at - backend/run_ingest.sh
```
python manage.py ingest_statements --update_upstream
```

You can add custom full imports and label imports to the above command by using the flags `--full_imports` and `--label_imports` respectively. Example below:
```
python manage.py ingest_statements --update_upstream --full_imports apinat-partial-orders apinat-pops-more sparc-nlp --label_imports apinatomy-neuron-populations ../../npo
```
here - `apinat-partial-orders` and `apinat-pops-more sparc-nlp` are the full imports and `apinatomy-neuron-populations` and `../../npo` are the label imports.

NOTE: full imports are done from `https://raw.githubusercontent.com/SciCrunch/NIF-Ontology/neurons/ttl/generated/neurons/*.ttl` and label imports are done from `https://raw.githubusercontent.com/SciCrunch/NIF-Ontology/neurons/ttl/generated/neurons/*.ttl`, and if you want a different path, you can use it relatively like - `../../npo`


### Ingest Statement's Curie ID
You can run the following command to ingest the curie id for the statements
```
python manage.py update_connectivity_statement_field--cs_field curie_id --neurondm_field label
```

### Open the admin page
there will be a superuser created with username/password: `admin/admin`

browse the Django [admin](http://127.0.0.1:8000/admin/) interface

### Install openapi generator

For generating the frontend api client use the openapi generator
install:

```bash
npm install -g @openapitools/openapi-generator-cli
```

and then run 
```bash
cd frontend
./genapi.sh
```

## ORCID login setup

browse to [ORCID dev tools](https://orcid.org/developer-tools) and create a new api
configure settings.py with the new key and secret
