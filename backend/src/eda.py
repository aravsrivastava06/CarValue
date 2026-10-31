import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

from pathlib import Path

# Find the backend directory

BASE_DIR = Path(__file__).resolve().parents[1]

# Define dataset location

DATA_PATH = BASE_DIR / "data" / "Car details v3.csv"

# Define folder for saving graphs

REPORT_DIR = BASE_DIR / "reports"

# Create reports folder if it does not exist

REPORT_DIR.mkdir(exist_ok=True)

# Load dataset

df = pd.read_csv(DATA_PATH)

# Apply graph styling

sns.set_theme(style="whitegrid")

print("\n=== EXPLORATORY DATA ANALYSIS ===")

# Dataset dimensions

print("\nDataset Shape:")
print(df.shape)

# First five records

print("\nFirst Five Records:")
print(df.head())

# Dataset information

print("\nDataset Information:")
df.info()

# Missing values

print("\nMissing Values:")
print(df.isnull().sum())

# Duplicate records

print("\nDuplicate Records:")
print(df.duplicated().sum())

# Create a separate copy for analysis

eda_df = df.copy()

# Convert mileage, engine and max_power into numeric values

for column in ["mileage", "engine", "max_power"]:

    eda_df[column] = pd.to_numeric(
        eda_df[column]
        .astype("string")
        .str.extract(r"(\d+(?:\.\d+)?)", expand=False),
        errors="coerce"
    )

    plt.figure(figsize=(10, 5))

sns.histplot(
    data=eda_df,
    x="selling_price",
    bins=50,
    kde=True
)

plt.title("Distribution of Used Car Selling Prices")
plt.xlabel("Selling Price (INR)")
plt.ylabel("Number of Cars")

plt.tight_layout()

plt.savefig(REPORT_DIR / "price_distribution.png")

plt.show()

plt.figure(figsize=(10, 5))

sns.scatterplot(
    data=eda_df,
    x="year",
    y="selling_price",
    alpha=0.5
)

plt.title("Manufacturing Year vs Selling Price")
plt.xlabel("Manufacturing Year")
plt.ylabel("Selling Price (INR)")

plt.tight_layout()

plt.savefig(REPORT_DIR / "year_vs_price.png")

plt.show()

plt.figure(figsize=(10, 5))

sns.scatterplot(
    data=eda_df,
    x="km_driven",
    y="selling_price",
    alpha=0.4
)

plt.title("Kilometres Driven vs Selling Price")
plt.xlabel("Kilometres Driven")
plt.ylabel("Selling Price (INR)")

plt.tight_layout()

plt.savefig(REPORT_DIR / "km_vs_price.png")

plt.show()

plt.figure(figsize=(10, 5))

sns.boxplot(
    data=eda_df,
    x="fuel",
    y="selling_price"
)

plt.title("Fuel Type vs Selling Price")
plt.xlabel("Fuel Type")
plt.ylabel("Selling Price (INR)")

plt.tight_layout()

plt.savefig(REPORT_DIR / "fuel_vs_price.png")

plt.show()

numeric_features = [
    "year",
    "km_driven",
    "selling_price",
    "seats",
    "engine",
    "max_power"
]

correlation = eda_df[numeric_features].corr()

plt.figure(figsize=(10, 7))

sns.heatmap(
    correlation,
    annot=True,
    cmap="coolwarm",
    fmt=".2f",
    linewidths=0.5
)

plt.title("Correlation Heatmap of Numerical Features")

plt.tight_layout()

plt.savefig(REPORT_DIR / "correlation_heatmap.png")

plt.show()

print("\n=== EDA SUMMARY ===")

print("\nAverage Selling Price:")

print(eda_df["selling_price"].mean())

print("\nMedian Selling Price:")

print(eda_df["selling_price"].median())

print("\nEDA completed successfully!")

print("\nCharts saved in:", REPORT_DIR)

