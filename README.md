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


### Optional: install docker and docker-compose (get it [here](https://docs.docker.com/get-docker/))

docker and docker-compose is needed to build and run the composer and
database images on a Docker virtual environment.
This step is an optional step



## Development setup

### Running locally
```bash
cd backend
# make sure your virtual env is activated
# and install the requirements
pip install --upgrade -r requirements.txt
# run the migrations
python3 manage.py migrate
# run the development server
python3 manage.py runserver
```

### Running on docker with docker-compose
the command below will start a docker container that maps/uses the backend folder
into the container. It will also start the Django development server with DEBUG=True

```bash
BUILDKIT_PROGRESS=plain docker-compose -f docker-compose-dev.yaml up --build
```

to stop:
```bash
docker-compose -f docker-compose-dev.yaml down
```

### Open the admin page
there will be a superuser created with username/password: `admin/admin`

browse the Django [admin](http://127.0.0.1:8000/admin/) interface


## Production setup

Running on docker with docker-compose
the command below will start two docker containers: backend server and database server
the backend server has a persistent disk connected for it's media files
the database server has a persistent disk connected for the data

```bash
docker-compose up --build
```

to stop:
```bash
docker-compose down
```

### Open the admin page
there will be a superuser created with username/password: `admin/admin`

browse the Django [admin](http://127.0.0.1:8000/admin/) interface
