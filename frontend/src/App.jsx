import { useEffect, useMemo, useState } from "react";
import {
  Activity, BarChart3, CarFront, CheckCircle2, ChevronDown, ChevronLeft,
  ChevronRight, Clock3, Download, Fuel, Gauge, Heart, Home, Info,
  Menu, Moon, Search, ShieldCheck, SlidersHorizontal, Star, Sun,
  TrendingUp, UserCircle, X, CalendarDays, ArrowUpRight, RefreshCw,
  Trash2, GitCompareArrows, Zap, CircleHelp, MessageSquareQuote,
  Settings2, BadgeCheck, Users, Sparkles
} from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis
} from "recharts";
import "./App.css";

const API = "http://127.0.0.1:5000";
const PAGE_SIZE = 12;

const initialForm = {
  brand: "Maruti", year: "2015", km_driven: "145500", fuel: "Diesel",
  seller_type: "Individual", transmission: "Manual", owner: "First Owner",
  engine: "1248", max_power: "74", seats: "5"
};

const navigation = [
  { id: "home", label: "Home", icon: Home },
  { id: "explore", label: "Explore cars", icon: CarFront },
  { id: "predict", label: "Price predictor", icon: Gauge },
  { id: "compare", label: "Compare", icon: GitCompareArrows },
  { id: "about", label: "About", icon: Info },
  { id: "faq", label: "FAQs", icon: CircleHelp }
];

const money = (value) => new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", maximumFractionDigits: 0
}).format(Number(value || 0));

const readStorage = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const normalizeCar = (raw) => {
  const fullName = raw.name || raw.model || "Unknown vehicle";
  const parts = fullName.trim().split(/\s+/);
  const brand = raw.brand || parts[0] || "Other";
  const model = raw.model || parts.slice(1).join(" ") || fullName;

  return {
    ...raw,
    id: String(raw.id ?? raw.car_id ?? `${fullName}-${raw.year}-${raw.km_driven}`),
    name: fullName,
    brand,
    model,
    year: Number(raw.year || 0),
    price: Number(raw.selling_price ?? raw.price ?? 0),
    kmDriven: Number(raw.km_driven || 0),
    fuel: raw.fuel || "Not specified",
    transmission: raw.transmission || "Not specified",
    sellerType: raw.seller_type || "Not specified",
    engine: Number(raw.engine || 0),
    maxPower: Number(raw.max_power || 0),
    seats: Number(raw.seats || 0)
  };
};

function App() {
  const [page, setPage] = useState("home");
  const [mobileMenu, setMobileMenu] = useState(false);

  const [theme, setTheme] = useState(
    () => localStorage.getItem("carvalue-theme") || "dark"
  );

  const [profile, setProfile] = useState(() =>
    readStorage("carvalue-profile", {
      name: "Car Enthusiast",
      email: "",
      city: "India"
    })
  );

  const [history, setHistory] = useState(() =>
    readStorage("carvalue-history", [])
  );

  const [favourites, setFavourites] = useState(() =>
    readStorage("carvalue-favourites", [])
  );

  const [reviews, setReviews] = useState(() =>
    readStorage("carvalue-reviews", [])
  );

  const [form, setForm] = useState(initialForm);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [apiOnline, setApiOnline] = useState(false);

  const [cars, setCars] = useState([]);

  const [filters, setFilters] = useState({
    brands: [],
    fuel_types: [],
    transmissions: [],
    seller_types: [],
    total_vehicles: 0
  });

  const [catalogueLoading, setCatalogueLoading] = useState(false);
  const [catalogueError, setCatalogueError] = useState("");

  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("All");
  const [fuelFilter, setFuelFilter] = useState("All");
  const [transmissionFilter, setTransmissionFilter] = useState("All");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("newest");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  const [selectedCar, setSelectedCar] = useState(null);
  const [compareIds, setCompareIds] = useState([]);

  const [faqOpen, setFaqOpen] = useState(0);

  const [reviewForm, setReviewForm] = useState({
    name: "",
    rating: "5",
    message: ""
  });

  const [reviewMessage, setReviewMessage] = useState("");
  const [profileMessage, setProfileMessage] = useState("");

  // Theme and local storage
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("carvalue-theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("carvalue-profile", JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem("carvalue-history", JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem("carvalue-favourites", JSON.stringify(favourites));
  }, [favourites]);

  useEffect(() => {
    localStorage.setItem("carvalue-reviews", JSON.stringify(reviews));
  }, [reviews]);

  // Load catalogue filters
  const loadFilters = async () => {
    const response = await fetch(`${API}/api/cars/filters`);

    if (!response.ok) {
      throw new Error("Could not load catalogue filters.");
    }

    setFilters(await response.json());
  };

  // Load vehicle records from Flask
  const loadCars = async (pageNumber = currentPage) => {
    setCatalogueLoading(true);
    setCatalogueError("");

    try {
      const params = new URLSearchParams({
        search,
        brand: brandFilter === "All" ? "" : brandFilter,
        fuel: fuelFilter === "All" ? "" : fuelFilter,
        transmission: transmissionFilter === "All" ? "" : transmissionFilter,
        min_price: minPrice,
        max_price: maxPrice,
        sort,
        page: String(pageNumber),
        per_page: String(PAGE_SIZE)
      });

      const response = await fetch(
        `${API}/api/cars?${params.toString()}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not load vehicles.");
      }

      const rows = data.vehicles || data.cars || data.results || [];

      setCars(rows.map(normalizeCar));

      setCurrentPage(
        Number(data.page || data.pagination?.page || pageNumber)
      );

      setTotalPages(
        Math.max(
          1,
          Number(
            data.total_pages ||
            data.pagination?.total_pages ||
            Math.ceil(
              Number(
                data.total ||
                data.total_records ||
                filters.total_vehicles ||
                rows.length
              ) / PAGE_SIZE
            )
          )
        )
      );

      setTotalResults(
        Number(
          data.total ||
          data.total_records ||
          data.pagination?.total ||
          rows.length
        )
      );

    } catch (err) {
      setCatalogueError(
        err.message === "Failed to fetch"
          ? "Cannot reach Flask. Keep the backend running on port 5000 and try again."
          : err.message
      );
    } finally {
      setCatalogueLoading(false);
    }
  };

  // Check backend availability
  useEffect(() => {
    let alive = true;

    fetch(`${API}/api/health`)
      .then((response) => {
        if (alive) setApiOnline(response.ok);
      })
      .catch(() => {
        if (alive) setApiOnline(false);
      });

    loadFilters().catch(() => {});

    return () => {
      alive = false;
    };
  }, []);

  // Automatically refresh catalogue when filters change
  useEffect(() => {
    if (page !== "explore" && page !== "home") return;

    const timer = setTimeout(() => loadCars(1), 250);

    return () => clearTimeout(timer);
  }, [
    page,
    search,
    brandFilter,
    fuelFilter,
    transmissionFilter,
    minPrice,
    maxPrice,
    sort
  ]);

  const averagePrice = useMemo(() => {
    if (!history.length) return 0;

    return history.reduce(
      (sum, item) => sum + Number(item.price || 0),
      0
    ) / history.length;
  }, [history]);

  const chartData = useMemo(() =>
    [...history].reverse().map((item, index) => ({
      name: `#${index + 1}`,
      price: item.price
    })),
    [history]
  );

  const selectedCompareCars = useMemo(
    () => cars.filter((car) => compareIds.includes(car.id)),
    [cars, compareIds]
  );

  const navigate = (destination) => {
    setPage(destination);
    setMobileMenu(false);
    setSelectedCar(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((old) => ({
      ...old,
      [name]: value
    }));

    setPrediction(null);
    setError("");
  };

  // ML price prediction
  const generatePrediction = async (event) => {
    event.preventDefault();

    setLoading(true);
    setPrediction(null);
    setError("");

    try {
      const payload = {
        ...form,
        year: Number(form.year),
        km_driven: Number(form.km_driven),
        engine: Number(form.engine),
        max_power: Number(form.max_power),
        seats: Number(form.seats)
      };

      const response = await fetch(`${API}/api/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Prediction could not be generated."
        );
      }

      const record = {
        id: `${Date.now()}-${Math.random()}`,
        brand: form.brand,
        year: Number(form.year),
        kmDriven: Number(form.km_driven),
        fuel: form.fuel,
        transmission: form.transmission,
        price: Number(data.predicted_price),
        date: new Date().toLocaleString("en-IN"),
        details: { ...form }
      };

      setPrediction(record);

      setHistory((old) =>
        [record, ...old].slice(0, 100)
      );

    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Cannot connect to Flask. Check that the backend is running on port 5000."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  };

  // Populate predictor from catalogue vehicle
  const useCarInPredictor = (car) => {
    setForm({
      ...initialForm,
      brand: car.brand.split(" ")[0],
      year: String(car.year || 2015),
      km_driven: String(car.kmDriven || 50000),
      fuel: ["Diesel", "Petrol", "CNG", "LPG"].includes(car.fuel)
        ? car.fuel
        : "Petrol",
      transmission: ["Manual", "Automatic"].includes(car.transmission)
        ? car.transmission
        : "Manual",
      seller_type: ["Individual", "Dealer", "Trustmark Dealer"].includes(
        car.sellerType
      )
        ? car.sellerType
        : "Individual",
      engine: String(car.engine || 1248),
      max_power: String(car.maxPower || 74),
      seats: String(car.seats || 5)
    });

    setPrediction(null);
    navigate("predict");
  };

  const toggleFavourite = (id) => {
    setFavourites((old) =>
      old.includes(id)
        ? old.filter((item) => item !== id)
        : [...old, id]
    );
  };

  const toggleCompare = (id) => {
    setCompareIds((old) =>
      old.includes(id)
        ? old.filter((item) => item !== id)
        : old.length < 3
          ? [...old, id]
          : old
    );
  };

  const resetFilters = () => {
    setSearch("");
    setBrandFilter("All");
    setFuelFilter("All");
    setTransmissionFilter("All");
    setMinPrice("");
    setMaxPrice("");
    setSort("newest");
    setCurrentPage(1);
  };

  // Export predictions to CSV
  const exportCSV = () => {
    if (!history.length) return;

    const columns = [
      "Brand",
      "Year",
      "Kilometres",
      "Fuel",
      "Transmission",
      "Predicted Price",
      "Date"
    ];

    const rows = history.map((item) => [
      item.brand,
      item.year,
      item.kmDriven,
      item.fuel,
      item.transmission,
      item.price,
      item.date
    ]);

    const csv = [columns, ...rows]
      .map((row) =>
        row.map((value) =>
          `"${String(value).replaceAll('"', '""')}"`
        ).join(",")
      )
      .join("\n");

    const url = URL.createObjectURL(
      new Blob([csv], {
        type: "text/csv;charset=utf-8;"
      })
    );

    const link = document.createElement("a");
    link.href = url;
    link.download = "carvalue-predictions.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  const clearHistory = () => {
    if (window.confirm("Delete all saved prediction records?")) {
      setHistory([]);
    }
  };

  const saveProfile = (event) => {
    event.preventDefault();

    setProfileMessage(
      "Profile changes saved on this browser."
    );

    setTimeout(() => setProfileMessage(""), 3000);
  };

  // Submit local review
  const submitReview = (event) => {
    event.preventDefault();

    if (!reviewForm.name.trim() || !reviewForm.message.trim()) {
      return;
    }

    setReviews((old) => [
      {
        ...reviewForm,
        id: Date.now(),
        date: new Date().toLocaleDateString("en-IN")
      },
      ...old
    ].slice(0, 20));

    setReviewForm({
      name: "",
      rating: "5",
      message: ""
    });

    setReviewMessage(
      "Thanks — your feedback has been saved in this browser."
    );

    setTimeout(() => setReviewMessage(""), 3500);
  };

  // Reusable components
  const Field = ({ label, name, type = "text", min, max }) => (
    <div className="field">
      <label htmlFor={name}>{label}</label>

      <input
        id={name}
        name={name}
        type={type}
        min={min}
        max={max}
        value={form[name]}
        onChange={handleChange}
        required
      />
    </div>
  );

  const SelectField = ({ label, name, options }) => (
    <div className="field">
      <label htmlFor={name}>{label}</label>

      <select
        id={name}
        name={name}
        value={form[name]}
        onChange={handleChange}
        required
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );

  const PageTitle = ({ eyebrow, title, description }) => (
    <div className="page-title">
      <span className="section-label">{eyebrow}</span>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  );

  const StatCard = ({ label, value, note, icon: Icon }) => (
    <div className="stat-card">
      <div className="stat-top">
        <span>{label}</span>
        <Icon size={18}/>
      </div>

      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );

  // Vehicle catalogue card
  const VehicleCard = ({ car }) => (
    <article className="vehicle-card">
      <div className="vehicle-art">
        <div className="vehicle-art-top">
          <span>{car.year || "Used car"} · Dataset</span>

          <button
            className={`favorite-button ${
              favourites.includes(car.id) ? "selected" : ""
            }`}
            onClick={() => toggleFavourite(car.id)}
            aria-label="Save vehicle"
          >
            <Heart
              size={17}
              fill={
                favourites.includes(car.id)
                  ? "currentColor"
                  : "none"
              }
            />
          </button>
        </div>

        <CarFront size={76} strokeWidth={1.1}/>

        <span className="vehicle-art-label">
          {car.fuel}
        </span>
      </div>

      <div className="vehicle-info">
        <span className="vehicle-brand">{car.brand}</span>
        <h3>{car.model}</h3>
        <p>Pre-owned vehicle · {car.sellerType}</p>

        <div className="vehicle-specs">
          <span>
            <CalendarDays size={13}/>
            {car.year || "—"}
          </span>

          <span>
            <Fuel size={13}/>
            {car.fuel}
          </span>

          <span>{car.transmission}</span>
        </div>

        <div className="vehicle-specs compact-specs">
          <span>
            {car.kmDriven
              ? `${car.kmDriven.toLocaleString("en-IN")} km`
              : "KM not listed"}
          </span>

          {car.engine > 0 && (
            <span>{car.engine} cc</span>
          )}

          {car.seats > 0 && (
            <span>{car.seats} seats</span>
          )}
        </div>

        <div className="vehicle-bottom">
          <div>
            <small>Dataset selling price</small>
            <strong>{money(car.price)}</strong>
          </div>

          <div className="card-actions">
            <button
              className={`icon-action ${
                compareIds.includes(car.id) ? "active" : ""
              }`}
              title="Add to comparison"
              onClick={() => toggleCompare(car.id)}
            >
              <GitCompareArrows size={17}/>
            </button>

            <button
              className="icon-action"
              title="View vehicle details"
              onClick={() => setSelectedCar(car)}
            >
              <ArrowUpRight size={18}/>
            </button>
          </div>
        </div>

        <button
          className="outline-button full-button"
          onClick={() => useCarInPredictor(car)}
        >
          Estimate this vehicle
          <Gauge size={15}/>
        </button>
      </div>
    </article>
  );

  const brands = filters.brands || [];

  const faqs = [
    [
      "What is CarValue?",
      "CarValue is an academic predictive analytics project that combines a used-car dataset with a machine-learning price estimation tool and a vehicle discovery interface."
    ],
    [
      "Are the vehicles live listings?",
      "No. The Explore Cars catalogue is built from the CarDekho vehicle dataset used in this project. It is not a live marketplace, dealer feed or booking service."
    ],
    [
      "How does the price predictor work?",
      "Enter a vehicle's brand, year, kilometres driven, fuel, seller type, transmission, ownership and engine specifications. The Flask API sends these details to the trained Decision Tree Regression model and returns an estimated price."
    ],
    [
      "Is the predicted price guaranteed?",
      "No. It is a model estimate based on patterns in the training data. Actual resale value depends on condition, location, service history, demand, negotiation and other factors not fully represented in the dataset."
    ],
    [
      "What do the model metrics mean?",
      "The current project reports an R² score of 0.8917 and a test MAE of approximately ₹83,858. These are evaluation metrics on a held-out test set, not a guarantee for an individual car."
    ],
    [
      "Can I compare vehicles?",
      "Yes. In Explore Cars, select up to three vehicles using the compare icon. Open Compare to review their available specifications and dataset prices side by side."
    ],
    [
      "Where are my favourites and reviews stored?",
      "This frontend demo stores favourites, profile details, prediction history and feedback in local browser storage. They are not synced to a server or shared between devices."
    ],
    [
      "Can I contact a dealer or purchase a car here?",
      "Not currently. CarValue is a discovery and valuation prototype; it does not process purchases, payments, inspections or dealer enquiries."
    ]
  ];

  return (
    <div className="app-shell">

      {/* HEADER */}
      <header className="site-header">

        <button
          className="mobile-menu-button"
          onClick={() => setMobileMenu(!mobileMenu)}
          aria-label="Toggle navigation"
        >
          {mobileMenu ? <X size={21}/> : <Menu size={21}/>}
        </button>

        <button
          className="brand"
          onClick={() => navigate("home")}
        >
          <span className="brand-icon">
            <CarFront size={21}/>
          </span>

          <span>
            Car<span className="accent">Value</span>
          </span>
        </button>

        <nav className={`main-navigation ${mobileMenu ? "show" : ""}`}>
          {navigation.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={page === id ? "nav-link active" : "nav-link"}
              onClick={() => navigate(id)}
            >
              <Icon size={14}/>
              {label}
            </button>
          ))}

          <button
            className={page === "activity" ? "nav-link active" : "nav-link"}
            onClick={() => navigate("activity")}
          >
            <Activity size={14}/>
            Activity
          </button>
        </nav>

        <div className="header-actions">

          <span className={`api-status ${apiOnline ? "online" : "offline"}`}>
            <span/>
            {apiOnline ? "API online" : "API offline"}
          </span>

          <button
            className="theme-button"
            onClick={() =>
              setTheme(theme === "dark" ? "light" : "dark")
            }
            title="Toggle theme"
          >
            {theme === "dark"
              ? <Sun size={17}/>
              : <Moon size={17}/>}
          </button>

          <button
            className="header-profile"
            onClick={() => navigate("profile")}
          >
            <span className="avatar">
              {(profile.name || "C").trim().charAt(0).toUpperCase()}
            </span>

            <span className="profile-name">
              {profile.name}
            </span>
          </button>
        </div>
      </header>

      <main className="main-area">

        {/* HOME PAGE */}
        {page === "home" && (
          <>
            <section className="hero-section">

              <div className="hero-content">
                <span className="section-label">
                  <Sparkles size={13}/>
                  SMARTER USED-CAR DECISIONS
                </span>

                <h1>
                  Find your next car.
                  <br/>
                  <span>Understand its value.</span>
                </h1>

                <p>
                  Discover vehicles from our curated dataset, compare the
                  details that matter and estimate resale value with a
                  machine-learning model.
                </p>

                <div className="hero-actions">
                  <button
                    className="primary-button"
                    onClick={() => navigate("explore")}
                  >
                    Explore vehicles
                    <ChevronRight size={17}/>
                  </button>

                  <button
                    className="outline-button"
                    onClick={() => navigate("predict")}
                  >
                    Estimate a car
                    <Gauge size={16}/>
                  </button>
                </div>

                <div className="hero-trust">
                  <span>
                    <ShieldCheck size={15}/>
                    Dataset-backed discovery
                  </span>

                  <span>
                    <Activity size={15}/>
                    ML-powered valuation
                  </span>

                  <span>
                    <BadgeCheck size={15}/>
                    Transparent limitations
                  </span>
                </div>
              </div>

              <div className="hero-visual">
                <div className="hero-visual-glow"/>

                <div className="hero-car-outline">
                  <CarFront size={210} strokeWidth={0.8}/>
                </div>

                <div className="hero-floating-card">
                  <span>VALUATION ENGINE</span>
                  <strong>Decision Tree Regression</strong>
                  <small>R² · 0.8917 on test data</small>
                </div>
              </div>
            </section>

            {/* QUICK SEARCH */}
            <section className="quick-search panel">

              <div className="quick-search-heading">
                <div>
                  <span className="section-label">
                    START YOUR SEARCH
                  </span>

                  <h2>What are you looking for?</h2>
                </div>

                <Search size={22}/>
              </div>

              <div className="quick-search-fields">

                <div className="field">
                  <label>Brand or model</label>

                  <input
                    placeholder="Try Maruti, Swift, Hyundai..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && navigate("explore")
                    }
                  />
                </div>

                <div className="field">
                  <label>Fuel preference</label>

                  <select
                    value={fuelFilter}
                    onChange={(e) => setFuelFilter(e.target.value)}
                  >
                    <option>All</option>

                    {filters.fuel_types?.map((fuel) => (
                      <option key={fuel}>{fuel}</option>
                    ))}
                  </select>
                </div>

                <button
                  className="primary-button search-submit"
                  onClick={() => navigate("explore")}
                >
                  Search vehicles
                  <Search size={16}/>
                </button>
              </div>
            </section>

            {/* BRAND DISCOVERY */}
            <section className="content-section">

              <div className="section-heading">
                <div>
                  <span className="section-label">
                    BROWSE BY BRAND
                  </span>

                  <h2>Popular manufacturers</h2>

                  <p>
                    Choose a brand to explore matching vehicles in the dataset.
                  </p>
                </div>

                <button
                  className="text-button"
                  onClick={() => navigate("explore")}
                >
                  All vehicles
                  <ChevronRight size={15}/>
                </button>
              </div>

              <div className="brand-strip">
                {brands.slice(0, 12).map((brand) => (
                  <button
                    key={brand}
                    className="brand-chip"
                    onClick={() => {
                      setBrandFilter(brand);
                      navigate("explore");
                    }}
                  >
                    {brand}
                    <ArrowUpRight size={13}/>
                  </button>
                ))}
              </div>
            </section>

            {/* FEATURED CARS */}
            <section className="content-section">

              <div className="section-heading">
                <div>
                  <span className="section-label">
                    FROM THE DATASET
                  </span>

                  <h2>Recently explored vehicles</h2>

                  <p>
                    Examples from the CarDekho dataset, not live dealer listings.
                  </p>
                </div>

                <button
                  className="text-button"
                  onClick={() => navigate("explore")}
                >
                  Browse catalogue
                  <ChevronRight size={15}/>
                </button>
              </div>

              {catalogueLoading && cars.length === 0 ? (
                <div className="loading-state">
                  <span className="spinner"/>
                  Loading vehicles from CarValue...
                </div>
              ) : (
                <div className="vehicle-grid">
                  {cars.slice(0, 3).map((car) => (
                    <VehicleCard key={car.id} car={car}/>
                  ))}
                </div>
              )}
            </section>

            {/* PROJECT STATS */}
            <section className="stats-grid project-stats">

              <StatCard
                label="DATASET VEHICLES"
                value={filters.total_vehicles?.toLocaleString("en-IN") || "—"}
                note="Records available in catalogue"
                icon={CarFront}
              />

              <StatCard
                label="BRANDS"
                value={brands.length || "—"}
                note="Manufacturers represented"
                icon={Users}
              />

              <StatCard
                label="MODEL R²"
                value="89.17%"
                note="Held-out test-set score"
                icon={TrendingUp}
              />

              <StatCard
                label="YOUR SAVED CARS"
                value={favourites.length}
                note="Stored on this device"
                icon={Heart}
              />
            </section>

            {/* VALUATION BANNER */}
            <section className="valuation-banner">

              <div>
                <span className="section-label">
                  SELLING OR EVALUATING?
                </span>

                <h2>Get a data-driven starting point.</h2>

                <p>
                  Use your vehicle specifications to generate an estimate
                  with the trained Decision Tree model.
                </p>
              </div>

              <button
                className="primary-button"
                onClick={() => navigate("predict")}
              >
                Open price predictor
                <ChevronRight size={17}/>
              </button>
            </section>

            {/* REVIEWS */}
            <section className="content-section">

              <div className="section-heading">
                <div>
                  <span className="section-label">
                    WHAT PEOPLE THINK
                  </span>

                  <h2>Community feedback</h2>

                  <p>
                    Feedback submitted in this demo is stored locally
                    and is not independently verified.
                  </p>
                </div>

                <span className="review-count">
                  {reviews.length} local reviews
                </span>
              </div>

              <div className="review-grid">
                {reviews.length ? (
                  reviews.slice(0, 3).map((review) => (
                    <article className="review-card" key={review.id}>
                      <div className="stars">
                        {Array.from(
                          { length: Number(review.rating) },
                          (_, i) => (
                            <Star
                              key={i}
                              size={14}
                              fill="currentColor"
                            />
                          )
                        )}
                      </div>

                      <p>“{review.message}”</p>

                      <strong>{review.name}</strong>

                      <small>
                        {review.date} · User-submitted
                      </small>
                    </article>
                  ))
                ) : (
                  <div className="review-empty">
                    <MessageSquareQuote size={24}/>

                    <div>
                      <strong>Your feedback can shape CarValue</strong>
                      <p>
                        Try the catalogue or predictor and leave a review below.
                      </p>
                    </div>

                    <button
                      className="outline-button"
                      onClick={() => navigate("about")}
                    >
                      About CarValue
                    </button>
                  </div>
                )}
              </div>
            </section>
          </>
        )}

        {/* EXPLORE CARS */}
        {page === "explore" && (
          <>
            <PageTitle
              eyebrow="VEHICLE DISCOVERY"
              title="Explore the catalogue"
              description={`Search and filter ${
                filters.total_vehicles?.toLocaleString("en-IN") || "available"
              } used-vehicle records from the CarDekho dataset.`}
            />

            <section className="filter-panel panel">

              <div className="filter-title">
                <div>
                  <span className="section-label">
                    FIND YOUR MATCH
                  </span>

                  <h2>Refine your search</h2>
                </div>

                <SlidersHorizontal size={21}/>
              </div>

              <div className="filter-search">
                <Search size={17}/>

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by car name or brand..."
                />
              </div>

              <div className="filter-grid">

                <div className="field">
                  <label>Brand</label>

                  <select
                    value={brandFilter}
                    onChange={(e) => setBrandFilter(e.target.value)}
                  >
                    <option>All</option>

                    {brands.map((brand) => (
                      <option key={brand}>{brand}</option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label>Fuel type</label>

                  <select
                    value={fuelFilter}
                    onChange={(e) => setFuelFilter(e.target.value)}
                  >
                    <option>All</option>

                    {filters.fuel_types?.map((fuel) => (
                      <option key={fuel}>{fuel}</option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label>Transmission</label>

                  <select
                    value={transmissionFilter}
                    onChange={(e) => setTransmissionFilter(e.target.value)}
                  >
                    <option>All</option>

                    {filters.transmissions?.map((transmission) => (
                      <option key={transmission}>{transmission}</option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label>Minimum price (₹)</label>

                  <input
                    type="number"
                    min="0"
                    placeholder="No minimum"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                  />
                </div>

                <div className="field">
                  <label>Maximum price (₹)</label>

                  <input
                    type="number"
                    min="0"
                    placeholder="No maximum"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                  />
                </div>

                <div className="field">
                  <label>Sort by</label>

                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                  >
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                    <option value="price_low">Price: low to high</option>
                    <option value="price_high">Price: high to low</option>
                  </select>
                </div>
              </div>

              <div className="filter-footer">
                <span>
                  {totalResults.toLocaleString("en-IN")} matching records
                  · Page {currentPage} of {totalPages}
                </span>

                <button
                  className="text-button"
                  onClick={resetFilters}
                >
                  <RefreshCw size={13}/>
                  Clear all filters
                </button>
              </div>
            </section>

            {catalogueError && (
              <div className="error-message">
                {catalogueError}

                <button
                  className="text-button"
                  onClick={() => loadCars(1)}
                >
                  Retry
                </button>
              </div>
            )}

            {catalogueLoading ? (
              <div className="loading-state">
                <span className="spinner"/>
                Finding matching vehicles...
              </div>
            ) : cars.length ? (
              <div className="vehicle-grid explore-grid">
                {cars.map((car) => (
                  <VehicleCard key={car.id} car={car}/>
                ))}
              </div>
            ) : (
              <div className="panel empty-state">
                <Search size={30}/>

                <h3>No matching vehicles</h3>

                <p>
                  Try broadening your search or clearing one or more filters.
                </p>

                <button
                  className="primary-button"
                  onClick={resetFilters}
                >
                  Reset filters
                </button>
              </div>
            )}

            <div className="pagination">
              <button
                className="outline-button"
                disabled={currentPage <= 1 || catalogueLoading}
                onClick={() => {
                  setCurrentPage((p) => p - 1);
                  loadCars(currentPage - 1);
                }}
              >
                <ChevronLeft size={16}/>
                Previous
              </button>

              <span>
                Page <strong>{currentPage}</strong> of {totalPages}
              </span>

              <button
                className="outline-button"
                disabled={currentPage >= totalPages || catalogueLoading}
                onClick={() => {
                  setCurrentPage((p) => p + 1);
                  loadCars(currentPage + 1);
                }}
              >
                Next
                <ChevronRight size={16}/>
              </button>
            </div>

            <p className="disclaimer">
              Catalogue records and selling prices originate from the
              CarDekho dataset. They are historical dataset observations,
              not current verified offers or live listings.
            </p>
          </>
        )}

        {/* PRICE PREDICTOR */}
        {page === "predict" && (
          <>
            <PageTitle
              eyebrow="MACHINE-LEARNING VALUATION"
              title="Estimate your car's value"
              description="Enter the vehicle specifications to receive an estimated resale price from the trained Decision Tree Regression model."
            />

            <div className="predict-layout">

              <section className="panel predictor-panel">

                <div className="panel-heading">
                  <div>
                    <span className="section-label">
                      VEHICLE INFORMATION
                    </span>

                    <h2>Tell us about the car</h2>
                  </div>

                  <button
                    className="text-button"
                    onClick={() => {
                      setForm(initialForm);
                      setPrediction(null);
                      setError("");
                    }}
                  >
                    <RefreshCw size={14}/>
                    Reset
                  </button>
                </div>

                <form onSubmit={generatePrediction}>

                  <div className="form-section-title">
                    IDENTIFICATION & USAGE
                  </div>

                  <div className="form-grid">
                    <Field label="Brand" name="brand"/>

                    <Field
                      label="Manufacturing year"
                      name="year"
                      type="number"
                      min="1980"
                      max="2020"
                    />

                    <Field
                      label="Kilometres driven"
                      name="km_driven"
                      type="number"
                      min="0"
                    />

                    <SelectField
                      label="Fuel type"
                      name="fuel"
                      options={["Diesel", "Petrol", "CNG", "LPG"]}
                    />

                    <SelectField
                      label="Seller type"
                      name="seller_type"
                      options={[
                        "Individual",
                        "Dealer",
                        "Trustmark Dealer"
                      ]}
                    />

                    <SelectField
                      label="Transmission"
                      name="transmission"
                      options={["Manual", "Automatic"]}
                    />

                    <SelectField
                      label="Ownership"
                      name="owner"
                      options={[
                        "First Owner",
                        "Second Owner",
                        "Third Owner",
                        "Fourth & Above Owner",
                        "Test Drive Car"
                      ]}
                    />
                  </div>

                  <div className="form-section-title">
                    ENGINE & CAPACITY
                  </div>

                  <div className="form-grid">
                    <Field
                      label="Engine capacity (cc)"
                      name="engine"
                      type="number"
                      min="1"
                    />

                    <Field
                      label="Maximum power (bhp)"
                      name="max_power"
                      type="number"
                      min="1"
                    />

                    <Field
                      label="Number of seats"
                      name="seats"
                      type="number"
                      min="1"
                      max="20"
                    />
                  </div>

                  {error && (
                    <div className="error-message">
                      {error}
                    </div>
                  )}

                  <button
                    className="primary-button full-button"
                    disabled={loading || !apiOnline}
                  >
                    {loading
                      ? "Generating estimate..."
                      : "Generate price estimate"}

                    {!loading && <ChevronRight size={17}/>}
                  </button>

                  {!apiOnline && (
                    <p className="helper-text">
                      Flask API is offline. Start the backend to enable predictions.
                    </p>
                  )}
                </form>
              </section>

              {/* PREDICTION RESULT */}
              <section className="panel estimate-panel">

                <span className="section-label">
                  YOUR VALUATION
                </span>

                {prediction ? (
                  <>
                    <div className="estimate-label">
                      Estimated selling price
                    </div>

                    <div className="estimate-price">
                      {money(prediction.price)}
                    </div>

                    <div className="result-confirm">
                      <CheckCircle2 size={15}/>
                      Estimate generated successfully
                    </div>

                    <div className="result-specs">
                      <div>
                        <span>Vehicle</span>
                        <strong>
                          {prediction.brand} · {prediction.year}
                        </strong>
                      </div>

                      <div>
                        <span>Distance</span>
                        <strong>
                          {prediction.kmDriven.toLocaleString("en-IN")} km
                        </strong>
                      </div>

                      <div>
                        <span>Fuel / transmission</span>
                        <strong>
                          {prediction.fuel} / {prediction.transmission}
                        </strong>
                      </div>
                    </div>

                    <button
                      className="outline-button full-button"
                      onClick={() => navigate("activity")}
                    >
                      View saved estimate
                    </button>
                  </>
                ) : (
                  <div className="estimate-empty">
                    <div className="estimate-mark">₹</div>

                    <h3>Your estimate will appear here</h3>

                    <p>
                      Complete the vehicle details and generate a prediction.
                    </p>
                  </div>
                )}

                <div className="model-note">
                  <span className="section-label">
                    MODEL INFORMATION
                  </span>

                  <strong>Decision Tree Regression</strong>

                  <p>
                    R² score: 0.8917 · Test MAE: ₹83,858
                  </p>

                  <small>
                    Evaluation metrics are from the held-out test set
                    and do not guarantee individual prediction accuracy.
                  </small>
                </div>
              </section>
            </div>
          </>
        )}

        {/* COMPARE CARS */}
        {page === "compare" && (
          <>
            <PageTitle
              eyebrow="SIDE-BY-SIDE ANALYSIS"
              title="Compare vehicles"
              description="Add up to three vehicles from Explore Cars to compare their dataset prices and specifications."
            />

            {compareIds.length < 2 ? (
              <section className="panel empty-state">
                <GitCompareArrows size={34}/>

                <h3>Select vehicles to compare</h3>

                <p>
                  Go to Explore Cars and use the compare icon on up to
                  three vehicle cards.
                </p>

                <button
                  className="primary-button"
                  onClick={() => navigate("explore")}
                >
                  Explore vehicles
                </button>
              </section>
            ) : (
              <section className="panel compare-panel">

                <div className="comparison-results">
                  {selectedCompareCars.map((car) => (
                    <div
                      className="comparison-card"
                      key={car.id}
                    >
                      <button
                        className="remove-compare"
                        onClick={() => toggleCompare(car.id)}
                      >
                        <X size={15}/>
                      </button>

                      <span className="section-label">
                        {car.brand}
                      </span>

                      <h2>{car.model}</h2>

                      <strong className="comparison-price">
                        {money(car.price)}
                      </strong>

                      <div className="result-specs">
                        <div>
                          <span>Year</span>
                          <strong>{car.year || "—"}</strong>
                        </div>

                        <div>
                          <span>Fuel</span>
                          <strong>{car.fuel}</strong>
                        </div>

                        <div>
                          <span>Transmission</span>
                          <strong>{car.transmission}</strong>
                        </div>

                        <div>
                          <span>Distance</span>
                          <strong>
                            {car.kmDriven
                              ? `${car.kmDriven.toLocaleString("en-IN")} km`
                              : "—"}
                          </strong>
                        </div>

                        <div>
                          <span>Engine</span>
                          <strong>{car.engine || "—"} cc</strong>
                        </div>

                        <div>
                          <span>Seats</span>
                          <strong>{car.seats || "—"}</strong>
                        </div>
                      </div>

                      <button
                        className="outline-button full-button"
                        onClick={() => useCarInPredictor(car)}
                      >
                        Estimate this car
                      </button>
                    </div>
                  ))}
                </div>

                <p className="disclaimer">
                  Prices are dataset selling-price observations.
                  Vehicle records may differ in condition, location
                  and other attributes.
                </p>

                <button
                  className="text-button"
                  onClick={() => setCompareIds([])}
                >
                  Clear comparison
                </button>
              </section>
            )}
          </>
        )}

        {/* ABOUT CARVALUE */}
        {page === "about" && (
          <>
            <PageTitle
              eyebrow="THE PROJECT"
              title="About CarValue"
              description="A predictive analytics project designed to make used-car discovery and valuation easier to understand."
            />

            <section className="about-hero panel">

              <div className="about-icon">
                <CarFront size={38}/>
              </div>

              <div>
                <span className="section-label">
                  DISCOVER · COMPARE · ESTIMATE
                </span>

                <h2>
                  Better context for your next car decision.
                </h2>

                <p>
                  CarValue brings together a used-vehicle catalogue and
                  a machine-learning valuation workflow. It is built as
                  an educational prototype using a public vehicle dataset
                  and a trained regression model.
                </p>
              </div>
            </section>

            <div className="about-grid">

              <article className="panel">
                <div className="about-feature-icon">
                  <DatabaseIcon/>
                </div>

                <h3>Dataset-led discovery</h3>

                <p>
                  Browse records derived from the CarDekho vehicle dataset,
                  with filters for brand, fuel, transmission, seller type
                  and price.
                </p>
              </article>

              <article className="panel">
                <div className="about-feature-icon">
                  <Gauge size={22}/>
                </div>

                <h3>Machine-learning valuation</h3>

                <p>
                  Estimate a vehicle's resale value using a trained
                  Decision Tree Regression model served through Flask.
                </p>
              </article>

              <article className="panel">
                <div className="about-feature-icon">
                  <GitCompareArrows size={22}/>
                </div>

                <h3>Useful comparisons</h3>

                <p>
                  Compare up to three catalogue records side by side
                  and use a selected car as a starting point for valuation.
                </p>
              </article>
            </div>

            <section className="panel methodology-panel">
              <span className="section-label">
                HOW IT WORKS
              </span>

              <h2>From vehicle details to an estimate</h2>

              <div className="steps-grid">
                <div>
                  <span>01</span>
                  <strong>Explore</strong>
                  <p>
                    Search the dataset for a vehicle and review its
                    available specifications.
                  </p>
                </div>

                <div>
                  <span>02</span>
                  <strong>Describe</strong>
                  <p>
                    Enter the vehicle's year, mileage, fuel, ownership
                    and engine details.
                  </p>
                </div>

                <div>
                  <span>03</span>
                  <strong>Predict</strong>
                  <p>
                    The frontend sends the input to Flask, which invokes
                    the saved regression model.
                  </p>
                </div>

                <div>
                  <span>04</span>
                  <strong>Review</strong>
                  <p>
                    See the estimated value and keep a local record
                    of your prediction.
                  </p>
                </div>
              </div>
            </section>

            <div className="stats-grid">
              <StatCard
                label="DATASET RECORDS"
                value={filters.total_vehicles?.toLocaleString("en-IN") || "6,926"}
                note="After duplicate removal"
                icon={CarFront}
              />

              <StatCard
                label="MODEL"
                value="Decision Tree"
                note="Regression model"
                icon={BarChart3}
              />

              <StatCard
                label="R² SCORE"
                value="0.8917"
                note="Held-out test set"
                icon={TrendingUp}
              />

              <StatCard
                label="TEST MAE"
                value="₹83,858"
                note="Mean absolute error"
                icon={Gauge}
              />
            </div>

            <p className="disclaimer">
              CarValue is a student project prototype, not a certified
              valuation provider, verified vehicle marketplace, financial
              service or substitute for an independent vehicle inspection.
            </p>
          </>
        )}

        {/* FAQ */}
        {page === "faq" && (
          <>
            <PageTitle
              eyebrow="HELP CENTRE"
              title="Frequently asked questions"
              description="Understand the catalogue, valuation model, saved data and current limitations of CarValue."
            />

            <section className="faq-list panel">
              {faqs.map(([question, answer], index) => (
                <div className="faq-item" key={question}>

                  <button
                    onClick={() =>
                      setFaqOpen(faqOpen === index ? -1 : index)
                    }
                    aria-expanded={faqOpen === index}
                  >
                    <span>{question}</span>

                    <ChevronDown
                      className={faqOpen === index ? "rotate" : ""}
                      size={18}
                    />
                  </button>

                  {faqOpen === index && (
                    <p>{answer}</p>
                  )}
                </div>
              ))}
            </section>

            {/* REVIEW FORM */}
            <section className="panel feedback-panel">

              <div>
                <span className="section-label">
                  STILL HAVE A QUESTION?
                </span>

                <h2>Share your feedback</h2>

                <p>
                  Tell us what worked well or what we should improve.
                  Feedback is saved locally in this demo.
                </p>
              </div>

              <form
                onSubmit={submitReview}
                className="review-form"
              >
                <div className="form-grid">

                  <div className="field">
                    <label>Your name</label>

                    <input
                      required
                      value={reviewForm.name}
                      onChange={(e) =>
                        setReviewForm({
                          ...reviewForm,
                          name: e.target.value
                        })
                      }
                      placeholder="Name"
                    />
                  </div>

                  <div className="field">
                    <label>Rating</label>

                    <select
                      value={reviewForm.rating}
                      onChange={(e) =>
                        setReviewForm({
                          ...reviewForm,
                          rating: e.target.value
                        })
                      }
                    >
                      <option value="5">5 — Excellent</option>
                      <option value="4">4 — Good</option>
                      <option value="3">3 — Average</option>
                      <option value="2">2 — Needs work</option>
                      <option value="1">1 — Poor</option>
                    </select>
                  </div>
                </div>

                <div className="field">
                  <label>Your feedback</label>

                  <textarea
                    required
                    rows="4"
                    value={reviewForm.message}
                    onChange={(e) =>
                      setReviewForm({
                        ...reviewForm,
                        message: e.target.value
                      })
                    }
                    placeholder="What should we improve?"
                  />
                </div>

                {reviewMessage && (
                  <div className="success-notice">
                    {reviewMessage}
                  </div>
                )}

                <button
                  className="primary-button"
                  type="submit"
                >
                  Submit feedback
                  <ChevronRight size={16}/>
                </button>
              </form>
            </section>
          </>
        )}

        {/* ACTIVITY */}
        {page === "activity" && (
          <>
            <PageTitle
              eyebrow="YOUR SPACE"
              title="My activity"
              description="Review your predictions, saved vehicles and personal feedback."
            />

            <div className="stats-grid">
              <StatCard
                label="TOTAL PREDICTIONS"
                value={history.length}
                note="Saved in this browser"
                icon={Activity}
              />

              <StatCard
                label="AVERAGE ESTIMATE"
                value={averagePrice ? money(averagePrice) : "—"}
                note="Across your predictions"
                icon={TrendingUp}
              />

              <StatCard
                label="SAVED VEHICLES"
                value={favourites.length}
                note="Your favourites"
                icon={Heart}
              />

              <StatCard
                label="MODEL R² SCORE"
                value="89.17%"
                note="Held-out test set"
                icon={BarChart3}
              />
            </div>

            <div className="activity-layout">

              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <span className="section-label">
                      VALUATION TRENDS
                    </span>

                    <h2>Your prediction activity</h2>
                  </div>
                </div>

                {chartData.length > 1 ? (
                  <div className="chart-wrap">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>

                        <defs>
                          <linearGradient
                            id="activityGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="#b9e879"
                              stopOpacity={0.25}
                            />

                            <stop
                              offset="100%"
                              stopColor="#b9e879"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>

                        <CartesianGrid
                          stroke="var(--chart-grid)"
                          strokeDasharray="3 3"
                          vertical={false}
                        />

                        <XAxis
                          dataKey="name"
                          stroke="var(--muted)"
                          tickLine={false}
                          axisLine={false}
                        />

                        <YAxis
                          stroke="var(--muted)"
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v) =>
                            `₹${Math.round(v / 1000)}k`
                          }
                        />

                        <Tooltip
                          contentStyle={{
                            background: "var(--panel)",
                            border: "1px solid var(--line)",
                            borderRadius: 8,
                            color: "var(--text)"
                          }}
                          formatter={(value) => [
                            money(value),
                            "Estimate"
                          ]}
                        />

                        <Area
                          type="monotone"
                          dataKey="price"
                          stroke="#a9d96e"
                          strokeWidth={2}
                          fill="url(#activityGradient)"
                        />

                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="chart-empty">
                    <BarChart3 size={30}/>

                    <strong>More data needed</strong>

                    <span>
                      Generate at least two predictions to see your chart.
                    </span>

                    <button
                      className="primary-button"
                      onClick={() => navigate("predict")}
                    >
                      Generate prediction
                    </button>
                  </div>
                )}
              </section>

              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <span className="section-label">
                      SAVED VEHICLES
                    </span>

                    <h2>Your favourites</h2>
                  </div>
                </div>

                {favourites.length ? (
                  <div className="empty-small">
                    {favourites.length} saved vehicle IDs.
                    Open Explore Cars to browse the catalogue
                    and manage your favourites.
                  </div>
                ) : (
                  <div className="empty-small">
                    Vehicles you save will appear here.
                  </div>
                )}

                <button
                  className="outline-button full-button"
                  onClick={() => navigate("explore")}
                >
                  Explore vehicles
                </button>
              </section>
            </div>

            {/* HISTORY TABLE */}
            <section className="panel history-panel">

              <div className="panel-heading">
                <div>
                  <span className="section-label">
                    PREDICTION RECORDS
                  </span>

                  <h2>Recent estimates</h2>
                </div>

                <div className="history-actions">
                  <button
                    className="outline-button"
                    onClick={exportCSV}
                    disabled={!history.length}
                  >
                    <Download size={14}/>
                    Export CSV
                  </button>

                  <button
                    className="danger-button"
                    onClick={clearHistory}
                    disabled={!history.length}
                  >
                    <Trash2 size={14}/>
                    Clear
                  </button>
                </div>
              </div>

              {history.length ? (
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Vehicle</th>
                        <th>Year</th>
                        <th>Fuel</th>
                        <th>Transmission</th>
                        <th>Distance</th>
                        <th>Estimate</th>
                        <th>Date</th>
                      </tr>
                    </thead>

                    <tbody>
                      {history.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <strong>{item.brand}</strong>
                          </td>

                          <td>{item.year}</td>
                          <td>{item.fuel}</td>
                          <td>{item.transmission}</td>

                          <td>
                            {Number(item.kmDriven).toLocaleString("en-IN")} km
                          </td>

                          <td className="table-price">
                            {money(item.price)}
                          </td>

                          <td>{item.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-small">
                  Your generated predictions will appear here.
                </div>
              )}
            </section>

            <p className="disclaimer">
              Prediction history, favourites and profile settings are
              stored locally in this browser. They are not synced
              to an online account.
            </p>
          </>
        )}

        {/* PROFILE */}
        {page === "profile" && (
          <>
            <PageTitle
              eyebrow="ACCOUNT SETTINGS"
              title="My profile"
              description="Manage your local profile and appearance preferences."
            />

            <div className="profile-layout">

              <section className="panel profile-panel">

                <div className="profile-header">
                  <div className="large-avatar">
                    {(profile.name || "C").trim().charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <h2>{profile.name}</h2>
                    <p>CarValue member · Local profile</p>
                  </div>
                </div>

                <form onSubmit={saveProfile}>

                  <div className="form-grid">

                    <div className="field">
                      <label>Full name</label>

                      <input
                        required
                        value={profile.name}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            name: e.target.value
                          })
                        }
                      />
                    </div>

                    <div className="field">
                      <label>Email address</label>

                      <input
                        type="email"
                        placeholder="Enter your email"
                        value={profile.email}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            email: e.target.value
                          })
                        }
                      />
                    </div>

                    <div className="field">
                      <label>City</label>

                      <input
                        value={profile.city}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            city: e.target.value
                          })
                        }
                      />
                    </div>
                  </div>

                  {profileMessage && (
                    <div className="success-notice">
                      {profileMessage}
                    </div>
                  )}

                  <button
                    className="primary-button"
                    type="submit"
                  >
                    Save profile
                  </button>
                </form>
              </section>

              <section className="panel preferences-panel">

                <span className="section-label">
                  PREFERENCES
                </span>

                <h2>Appearance</h2>

                <p>
                  Choose how CarValue looks on this device.
                </p>

                <div className="theme-options">

                  <button
                    className={
                      theme === "light"
                        ? "theme-option selected"
                        : "theme-option"
                    }
                    onClick={() => setTheme("light")}
                  >
                    <Sun size={19}/>
                    <strong>Light</strong>
                    <span>Bright interface</span>
                  </button>

                  <button
                    className={
                      theme === "dark"
                        ? "theme-option selected"
                        : "theme-option"
                    }
                    onClick={() => setTheme("dark")}
                  >
                    <Moon size={19}/>
                    <strong>Dark</strong>
                    <span>Low-light interface</span>
                  </button>
                </div>

                <div className="profile-summary">
                  <div>
                    <strong>{history.length}</strong>
                    <span>Predictions made</span>
                  </div>

                  <div>
                    <strong>{favourites.length}</strong>
                    <span>Saved vehicles</span>
                  </div>
                </div>
              </section>
            </div>

            <div className="profile-note">
              <ShieldCheck size={16}/>

              Your profile, preferences and history are stored in your
              browser only. This is a local demo profile, not secure
              online account authentication.
            </div>
          </>
        )}

      </main>

      {/* FOOTER */}
      <footer className="site-footer">

        <div>
          <strong>
            Car<span className="accent">Value</span>
          </strong>

          <p>
            Discover better. Compare smarter. Estimate with data.
          </p>
        </div>

        <div className="footer-links">
          <button onClick={() => navigate("about")}>About</button>
          <button onClick={() => navigate("faq")}>FAQs</button>
          <button onClick={() => navigate("explore")}>Explore cars</button>
          <button onClick={() => navigate("predict")}>Price predictor</button>
        </div>

        <span>
          Predictive Analytics Project · Dataset-based prototype
        </span>
      </footer>

      {/* VEHICLE DETAILS MODAL */}
      {selectedCar && (
        <div
          className="modal-backdrop"
          onClick={() => setSelectedCar(null)}
        >
          <section
            className="vehicle-modal panel"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setSelectedCar(null)}
            >
              <X size={19}/>
            </button>

            <span className="section-label">
              VEHICLE RECORD
            </span>

            <h2>{selectedCar.name}</h2>

            <strong className="comparison-price">
              {money(selectedCar.price)}
            </strong>

            <div className="result-specs">

              <div>
                <span>Year</span>
                <strong>{selectedCar.year || "—"}</strong>
              </div>

              <div>
                <span>Kilometres driven</span>
                <strong>
                  {selectedCar.kmDriven.toLocaleString("en-IN")} km
                </strong>
              </div>

              <div>
                <span>Fuel</span>
                <strong>{selectedCar.fuel}</strong>
              </div>

              <div>
                <span>Transmission</span>
                <strong>{selectedCar.transmission}</strong>
              </div>

              <div>
                <span>Seller type</span>
                <strong>{selectedCar.sellerType}</strong>
              </div>

              <div>
                <span>Engine</span>
                <strong>{selectedCar.engine || "—"} cc</strong>
              </div>

              <div>
                <span>Maximum power</span>
                <strong>{selectedCar.maxPower || "—"} bhp</strong>
              </div>

              <div>
                <span>Seats</span>
                <strong>{selectedCar.seats || "—"}</strong>
              </div>
            </div>

            <p className="disclaimer">
              This is a dataset record, not an independently inspected
              or currently available listing.
            </p>

            <button
              className="primary-button full-button"
              onClick={() => useCarInPredictor(selectedCar)}
            >
              Estimate this vehicle
              <Gauge size={16}/>
            </button>
          </section>
        </div>
      )}

    </div>
  );
}

function DatabaseIcon() {
  return <BarChart3 size={22}/>;
}

export default App;