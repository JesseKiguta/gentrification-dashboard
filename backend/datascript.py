import json
import random
import math

# --- CONFIG ---
YEAR_VARIATION = 0.08     # 8% random movement per year
AREA_VARIATION = 0.15     # up to 15% difference between subcounties
RANDOM_SEED = 42          # reproducible results

random.seed(RANDOM_SEED)

INPUT_FILE = "data/subcounty_reference.json"
OUTPUT_FILE = "data/subcounty_reference_updated.json"

# fields that should vary significantly across years
ECON_FIELDS = ["Rent", "Food", "Transport", "Utilities", "Misc"]

# fields we do NOT alter across years
STATIC_FIELDS = [
    "pop_density", "employment_rate", "median_income", "household_size",
    "dist_to_cbd_km", "neighbors",
    "Subcounty_clean_embakasi",
    "Subcounty_clean_kasarani",
    "Subcounty_clean_langata",
    "Subcounty_clean_makadara",
    "Subcounty_clean_westlands"
]

def vary_value(base, year_offset):
    """
    Produces a new value based on:
      - yearly drift
      - additional cross-area variation
    """
    drift_factor = 1 + random.uniform(-YEAR_VARIATION, YEAR_VARIATION)
    area_factor = 1 + (year_offset * random.uniform(-AREA_VARIATION, AREA_VARIATION))

    new_val = base * drift_factor * area_factor
    return round(new_val, 3)

# --- PROCESSING ---
with open(INPUT_FILE, "r") as f:
    data = json.load(f)

new_data = {}

for subcounty, years in data.items():
    new_data[subcounty] = {}
    sorted_years = sorted(years.keys())  # ensures chronological processing

    # establish a random base multiplier per subcounty
    subcounty_offset = random.uniform(0.85, 1.25)

    for i, year in enumerate(sorted_years):
        year_data = years[year]
        new_year_data = {}

        for key, value in year_data.items():

            # 🎯 Preserve static fields exactly
            if key in STATIC_FIELDS:
                new_year_data[key] = value
                continue

            # 🎯 Create much stronger yearly variation for economic fields
            if key in ECON_FIELDS:
                base = value * subcounty_offset
                new_year_data[key] = vary_value(base, i)
                continue

            # 🎯 Handle month, quarter, encoded subcounty, or other numeric fields
            if isinstance(value, (int, float)):
                new_year_data[key] = vary_value(value, i)
                continue

            # otherwise copy as is
            new_year_data[key] = value

        new_data[subcounty][year] = new_year_data

# --- SAVE OUTPUT ---
with open(OUTPUT_FILE, "w") as f:
    json.dump(new_data, f, indent=2)

print("Generated:", OUTPUT_FILE)
