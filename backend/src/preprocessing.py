
import pandas as pd
from pathlib import Path

# Locate project directory
BASE_DIR = Path(__file__).resolve().parents[1]

DATA_PATH = BASE_DIR / "data" / "Car details v3.csv"

# Load original dataset
df = pd.read_csv(DATA_PATH)

print("\n========== DATA QUALITY ANALYSIS ==========")

# Dataset dimensions
print("\nOriginal Dataset Shape:")
print(df.shape)

# Duplicate analysis
print("\nTotal Duplicate Records:")
print(df.duplicated().sum())

# Display duplicate records
duplicates = df[df.duplicated(keep=False)]

print("\nSample Duplicate Records:")
print(duplicates.head(10))

# Categorical feature analysis
categorical_columns = [
    "fuel",
    "seller_type",
    "transmission",
    "owner"
]

print("\nCategorical Feature Distributions:")

for column in categorical_columns:
    print(f"\n{column.upper()}")
    print(df[column].value_counts(dropna=False))

# Numerical summary
print("\nNumerical Feature Summary:")
print(
    df[["year", "selling_price", "km_driven"]].describe()
)

print("\nData quality analysis completed.")


# STEP 2: REMOVE DUPLICATE RECORDS

print("\n=== DUPLICATE REMOVAL ===")

# Original dataset size
original_count = len(df)

# Remove exact duplicate records
df_clean = df.drop_duplicates().copy()

# Dataset size after removal
cleaned_count = len(df_clean)

# Number of removed records
removed_count = original_count - cleaned_count

print("\nOriginal Records:", original_count)

print("Records After Removing Duplicates:", cleaned_count)

print("Total Records Removed:", removed_count)

# Verify remaining duplicates
print("\nRemaining Duplicate Records:")
print(df_clean.duplicated().sum())

# Save intermediate cleaned dataset
OUTPUT_PATH = BASE_DIR / "data" / "cars_deduplicated.csv"

df_clean.to_csv(OUTPUT_PATH, index=False)

print("\nDeduplicated dataset saved successfully!")
print("Location:", OUTPUT_PATH)


# STEP 3: NUMERICAL DATA CONVERSION

print("\n=== NUMERICAL DATA CONVERSION ===")

# Load deduplicated dataset
cleaned_path = BASE_DIR / "data" / "cars_deduplicated.csv"

df_clean = pd.read_csv(cleaned_path)

# Columns to convert
numeric_columns = [
    "mileage",
    "engine",
    "max_power",
    "seats"
]

# Extract numerical values from text
for column in numeric_columns:

    df_clean[column] = pd.to_numeric(
        df_clean[column]
        .astype("string")
        .str.extract(r"([-+]?\d*\.?\d+)")[0],
        errors="coerce"
    )

# Remove torque because of inconsistent units
df_clean.drop(columns=["torque"], inplace=True)

print("\nUpdated Data Types:")
print(df_clean.dtypes)

print("\nMissing Values After Conversion:")
print(df_clean.isnull().sum())

print("\nFirst Five Processed Records:")
print(df_clean.head())

# Save converted dataset
converted_path = BASE_DIR / "data" / "cars_numeric.csv"

df_clean.to_csv(converted_path, index=False)

print("\nNumerical conversion completed!")
print("Saved at:", converted_path)



# STEP 4: OUTLIER ANALYSIS USING IQR

print("\n=== OUTLIER ANALYSIS ===")

# Load numerically converted dataset
df_clean = pd.read_csv(
    BASE_DIR / "data" / "cars_numeric.csv"
)

# Features for outlier investigation
features = [
    "selling_price",
    "km_driven",
    "mileage",
    "engine",
    "max_power"
]

# Store outlier statistics
outlier_results = []

for column in features:

    # Remove missing values for calculations
    data = df_clean[column].dropna()

    # Calculate quartiles
    Q1 = data.quantile(0.25)
    Q3 = data.quantile(0.75)

    # Calculate IQR
    IQR = Q3 - Q1

    # Calculate boundaries
    lower_bound = Q1 - 1.5 * IQR
    upper_bound = Q3 + 1.5 * IQR

    # Identify potential outliers
    outliers = data[
        (data < lower_bound) |
        (data > upper_bound)
    ]

    # Print results
    print(f"\nFeature: {column}")

    print("Q1:", Q1)
    print("Q3:", Q3)
    print("IQR:", IQR)

    print("Lower Bound:", lower_bound)
    print("Upper Bound:", upper_bound)

    print("Outlier Count:", len(outliers))

    outlier_results.append({
        "Feature": column,
        "Q1": Q1,
        "Q3": Q3,
        "IQR": IQR,
        "Lower Bound": lower_bound,
        "Upper Bound": upper_bound,
        "Outlier Count": len(outliers)
    })

# Display summary
outlier_df = pd.DataFrame(outlier_results)

print("\n=== OUTLIER SUMMARY ===")
print(outlier_df.to_string(index=False))

print("\nOutlier analysis completed.")
