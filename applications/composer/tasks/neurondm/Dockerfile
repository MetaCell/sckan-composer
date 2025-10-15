FROM python:3.9-slim

WORKDIR /usr/src/app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install ONLY neurondm and pyontutils packages (not full Django app)
RUN pip install --no-cache-dir \
    neurondm==0.1.8 \
    pyontutils==0.1.38 \
    rdflib

# Copy only the necessary composer modules (NOT the entire backend/)
# These are pure Python modules with no Django dependencies
COPY backend/composer/__init__.py /usr/src/app/composer/
COPY backend/composer/pure_enums.py /usr/src/app/composer/
COPY backend/composer/services/__init__.py /usr/src/app/composer/services/
COPY backend/composer/services/cs_ingestion/__init__.py /usr/src/app/composer/services/cs_ingestion/
COPY backend/composer/services/cs_ingestion/exceptions.py /usr/src/app/composer/services/cs_ingestion/
COPY backend/composer/services/cs_ingestion/models.py /usr/src/app/composer/services/cs_ingestion/
COPY backend/composer/services/cs_ingestion/logging_service.py /usr/src/app/composer/services/cs_ingestion/
COPY backend/composer/services/cs_ingestion/neurondm_script.py /usr/src/app/composer/services/cs_ingestion/
COPY backend/composer/services/cs_ingestion/helpers/__init__.py /usr/src/app/composer/services/cs_ingestion/helpers/
COPY backend/composer/services/cs_ingestion/helpers/common_helpers.py /usr/src/app/composer/services/cs_ingestion/helpers/

# Copy the standalone script
COPY tasks/neurondm/process_neurondm_standalone.py /usr/src/app/

# Clone NIF-Ontology repository (required by neurondm)
RUN git clone -b neurons https://github.com/SciCrunch/NIF-Ontology.git /usr/src/app/NIF-Ontology

# Set ontology local repo (no need for pip install -e . since we're not installing Django app)
RUN ontutils set ontology-local-repo /usr/src/app/NIF-Ontology/

# No Django environment variables needed!
ENV PYTHONUNBUFFERED=1

CMD ["python", "process_neurondm_standalone.py"]
