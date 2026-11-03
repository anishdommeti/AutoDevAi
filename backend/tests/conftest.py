import os
import shutil
import tempfile
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.main import app

@pytest.fixture(scope="session", autouse=True)
def setup_test_data_dir():
    # Use an isolated temp directory for test data
    temp_dir = tempfile.mkdtemp(prefix="autodev_test_")
    original_data_dir = settings.DATA_DIR
    settings.DATA_DIR = Path(temp_dir)
    yield
    settings.DATA_DIR = original_data_dir
    try:
        shutil.rmtree(temp_dir)
    except Exception:
        pass

@pytest.fixture
def client():
    return TestClient(app)

