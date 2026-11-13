import logging
import os
from pathlib import Path

# Ensure logs directory exists under backend
log_dir = Path(__file__).resolve().parent.parent / "logs"
os.makedirs(log_dir, exist_ok=True)
log_file = log_dir / "ipca.log"

logging.basicConfig(
    level=logging.INFO,
    format=(
        "%(asctime)s | %(levelname)s | "
        "%(name)s | %(message)s"
    ),
    handlers=[
        logging.FileHandler(str(log_file), encoding="utf-8"),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger("IPCA")
