
import pandas as pd
import numpy as np
from pathlib import Path

# 1. PATH CONFIGURATION

BASE_DIR = Path(__file__).resolve().parents[1]

INPUT_PATH = BASE_DIR / "data" / "cars_numeric.csv"
OUTPUT_PATH = BASE_DIR / "data" / "cars_prepared.csv"

df = pd.read_csv(INPUT_PATH)

print("\n FINAL DATA PREPARATION ")

print("\nInitial Shape:", df.shape)

# 2. BASIC DATA VALIDATION

# Remove any remaining exact duplicates
df = df.drop_duplicates().copy()

# Remove records with missing or invalid target
df = df.dropna(subset=["selling_price"])

df = df[df["selling_price"] > 0].copy()

# 3. OUTLIER INVESTIGATION

print("\n IQR OUTLIER REPORT ")

features = [
    "selling_price",
    "km_driven",
    "mileage",
    "engine",
    "max_power"
]

for column in features:

    values = df[column].dropna()

    q1 = values.quantile(0.25)
    q3 = values.quantile(0.75)

    iqr = q3 - q1

    lower = q1 - 1.5 * iqr
    upper = q3 + 1.5 * iqr

    outlier_count = (
        (values < lower) | (values > upper)
    ).sum()

    print(f"\n{column}")
    print("Lower boundary:", round(lower, 2))
    print("Upper boundary:", round(upper, 2))
    print("Potential outliers:", outlier_count)

print("\nOutliers are flagged, not automatically deleted.")

# 4. BASIC PLAUSIBILITY CHECKS

# Retain observations with plausible domain values.
# These are explicit data-quality rules, not IQR rules.

df = df[
    (df["year"] >= 1980) &
    (df["year"] <= 2020) &
    (df["km_driven"] >= 0) &
    (df["selling_price"] > 0)
].copy()

# 5. FEATURE ENGINEERING

# Extract car brand from car name
df["brand"] = (
    df["name"]
    .astype(str)
    .str.strip()
    .str.split()
    .str[0]
    .str.title()
)

# Calculate vehicle age using dataset reference year
REFERENCE_YEAR = 2020

df["car_age"] = REFERENCE_YEAR - df["year"]

# 6. SELECT MODEL FEATURES

features = [
    "brand",
    "car_age",
    "km_driven",
    "fuel",
    "seller_type",
    "transmission",
    "owner",
    "mileage",
    "engine",
    "max_power",
    "seats"
]

target = "selling_price"

model_df = df[features + [target]].copy()

# 7. FINAL DATASET SUMMARY

print("\n=== FINAL DATASET ====")

print("\nDataset Shape:", model_df.shape)

print("\nFeatures:")
print(features)

print("\nTarget:")
print(target)

print("\nMissing Values:")
print(model_df.isnull().sum())

print("\nFirst Five Records:")
print(model_df.head())

print("\nCategorical Columns:")
print(model_df.select_dtypes(include="object").columns.tolist())

print("\nNumerical Columns:")
print(model_df.select_dtypes(include=np.number).columns.tolist())

# 8. SAVE PREPARED DATASET

model_df.to_csv(OUTPUT_PATH, index=False)

print("\nPrepared dataset saved successfully!")
print("Location:", OUTPUT_PATH)

print("\nFinal preprocessing completed!")
