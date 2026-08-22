import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from seed_master_data import seed_master_data

if __name__ == "__main__":
    seed_master_data()
