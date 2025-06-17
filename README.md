# sckan-composer


## Development setup


This guide will help you set up the Composer project for local development.

## Prerequisites

- Python 3.12 (recommended: use [pyenv](https://github.com/pyenv/pyenv))
- [Yarn](https://classic.yarnpkg.com/lang/en/docs/install/)
- VS Code (recommended)

---

## 1. Clone the Project

```bash
git clone git@github.com:MetaCell/sckan-composer.git
cd sckan-composer
git checkout develop
```

---

## 2. Create and Activate Python Virtual Environment

Using `pyenv`:

```bash
pyenv install 3.12.0
pyenv virtualenv 3.12.0 sckan
pyenv activate sckan
```

---

## 3. Clone and Set Up CloudHarness

```bash
git clone https://github.com/metacell/cloud-harness.git
cd cloud-harness
git checkout feature/ch-158
bash install.sh
pip install -e libraries/cloudharness-common
pip install -e infrastructure/common-images/cloudharness-django/libraries/cloudharness-django
```

---

## 4. Install Python Dependencies

```bash
cd applications/composer/backend
pip install -r requirements.txt
```

---

## 5. VS Code Debug Configuration

Add the following to your `.vscode/launch.json`:

```json
{
  "configurations": [
    {
      "name": "Django Server",
      "type": "debugpy",
      "request": "launch",
      "program": "${workspaceFolder}/applications/composer/backend/manage.py",
      "args": ["runsslserver", "127.0.0.1:8000"],
      "console": "integratedTerminal",
      "cwd": "${workspaceFolder}/applications/composer/backend",
      "env": {
        "ACCOUNTS_ADMIN_PASSWORD": "ask",
        "ACCOUNTS_ADMIN_USERNAME": "Dario",
        "CH_VALUES_PATH": "${workspaceFolder}/deployment/helm/values.yaml",
        "DJANGO_SETTINGS_MODULE": "backend.settings",
        "KUBERNETES_SERVICE_HOST": "ssdds",
        "DEBUG": "true"
      },
      "justMyCode": false
    },
    {
      "name": "Django Command",
      "type": "debugpy",
      "request": "launch",
      "program": "${workspaceFolder}/applications/composer/backend/manage.py",
      "args": ["migrate"],
      "console": "integratedTerminal",
      "cwd": "${workspaceFolder}/applications/composer/backend",
      "env": {
        "ACCOUNTS_ADMIN_PASSWORD": "ask",
        "ACCOUNTS_ADMIN_USERNAME": "Dario",
        "CH_VALUES_PATH": "${workspaceFolder}/deployment/helm/values.yaml",
        "DJANGO_SETTINGS_MODULE": "backend.settings",
        "KUBERNETES_SERVICE_HOST": "ssdds",
        "DEBUG": "true"
      },
      "justMyCode": false
    },
    {
      "name": "Frontend",
      "type": "node",
      "request": "launch",
      "cwd": "${workspaceFolder}/applications/composer/frontend",
      "runtimeExecutable": "yarn",
      "runtimeArgs": ["start"],
      "console": "integratedTerminal",
      "env": {
        "HOST": "127.0.0.1",
        "DANGEROUSLY_DISABLE_HOST_CHECK": "true"
      }
    },
    {
      "name": "CloudHarness: Run/Debug",
      "type": "cloudcode.kubernetes",
      "request": "launch",
      "skaffoldConfig": "${workspaceFolder}/skaffold.yaml",
      "portForward": true,
      "watch": true,
      "imageRegistry": "localhost:5000",
      "debug": [
        {
          "image": "cloudharness/composer",
          "sourceFileMap": {
            "${workspaceFolder}/applications/composer/backend": "/usr/src/app",
            "justMyCode": false
          }
        }
      ],
      "cleanUp": false
    }
  ],
  "version": "0.2.0"
}
```

Make sure your IDE is using the Python virtual environment you created earlier.

---

## 6. Run Migrations

Use the "Django Command" configuration in VS Code or run:

```bash
python manage.py migrate
```

---

## 7. Run the Django Development Server

Use the "Django Server" launch configuration or run:

```bash
python manage.py runsslserver 127.0.0.1:8000
```

> ⚠️ Access the admin at `https://127.0.0.1:8000/admin/` (not `localhost` or `0.0.0.0`) to ensure ORCID redirects work correctly.

---

## 8. Set Permissions

Log in to the Django admin and assign appropriate permissions to your user.

---

## 9. Set Up the Frontend

```bash
cd applications/composer/frontend
yarn install
```

---

## 10. Run the Frontend

```bash
yarn start
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
