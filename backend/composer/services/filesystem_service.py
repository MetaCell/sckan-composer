from pathlib import Path


def create_dir_if_not_exists(dir_path: str):
    Path(dir_path).mkdir(parents=True, exist_ok=True)