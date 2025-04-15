import * as THREE from 'https://unpkg.com/three@0.153.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.153.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.153.0/examples/jsm/loaders/GLTFLoader.js';

/* ==============  THREE.JS SETUP  ============== */
const container = document.getElementById('car3dContainer');
const scene = new THREE.Scene();
// scene.background = new THREE.Color(0x000000); // Black Background
// scene.background = new THREE.Color(0x222222);  // Dark Grey Background
scene.background = new THREE.Color(0xffffff); // White Background

// Camera
const camera = new THREE.PerspectiveCamera(
  60,
  container.clientWidth / container.clientHeight,
  0.1,
  1000
);
camera.position.set(0, 2, 5);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 1, 0);

// ============== IMPROVED LIGHTING SETUP ==============
const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.position.set(5, 10, 7);
directionalLight.castShadow = true; // Enables shadows
scene.add(directionalLight);

// GLTF Loader
const loader = new GLTFLoader();

// Function to Load Car Model
function loadCarModel(modelPath) {
  loader.load(
      modelPath,
      (gltf) => {
          const carModel = gltf.scene;

          carModel.traverse((child) => {
              if (child.isMesh) {
                  child.geometry.center();  // Centers the model
                }
          });  

          carModel.scale.set(1, 1, 1);  

          // Adjust Position (Move up if underground)
          carModel.position.set(0, 1, 0);  

          // Adjust Rotation (Fix upside-down or wrong orientation)
          carModel.rotation.y = Math.PI; 

          // Clear the scene and add the new model
          scene.clear();
          scene.add(carModel);
      },
      (xhr) => {
          console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
      },
      (error) => {
          console.error('Error loading model:', error);
      }
  );
}

// Load Default Model (Tesla)
loadCarModel('models/Tesla/scene.gltf');

// Animate
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

// Handle Resize
window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
});

/* ==============  FORM & CURRENCY LOGIC  ============== */
const carForm = document.getElementById('carForm');
const basePrice = document.getElementById('basePrice');  
const convertedPrice = document.getElementById('convertedPrice');
const convertedCurrency = document.getElementById('convertedCurrency');
const currencySelect = document.getElementById('currencySelect');

// Predict Price Function
carForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Gather input data
    const mileage = parseFloat(document.getElementById('mileage').value);
    const fuelType = document.getElementById('fuelType').value;  
    const engine = parseFloat(document.getElementById('engine').value); 
    const transmission = document.getElementById('transmission').value === "1" ? 1 : 0;
    const accident = document.getElementById('accident').value === "1" ? 1 : 0;
    const cleanTitle = document.getElementById('cleanTitle').value === "1" ? 1 : 0;

    // Prepare data for API
    const requestData = {
        features: [mileage, fuelType, engine, transmission, accident, cleanTitle]
    };

    try {
        const response = await fetch("http://127.0.0.1:5000/predict", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestData),
        });

        const data = await response.json();

        if (response.ok) {
            basePrice.textContent = data.predicted_price;
            convertedPrice.textContent = data.predicted_price;
            convertedCurrency.textContent = "INR"; // Default currency
        } else {
            console.error("API Error:", data.error);
            basePrice.textContent = "Error";
            convertedPrice.textContent = "Error";
        }
    } catch (error) {
        console.error("Request failed:", error);
        basePrice.textContent = "Network Error";
        convertedPrice.textContent = "Network Error";
    }
});

// Currency Conversion Logic
currencySelect.addEventListener("change", async () => {
    const selectedCurrency = currencySelect.value;
    const priceInINR = parseFloat(basePrice.textContent);

    if (isNaN(priceInINR)) {
        console.error("Invalid base price, cannot convert currency.");
        return;
    }

    try {
        const response = await fetch(`https://api.exchangerate-api.com/v4/latest/INR`);
        const data = await response.json();

        if (data && data.rates[selectedCurrency]) {
            const conversionRate = data.rates[selectedCurrency];
            const convertedValue = (priceInINR * conversionRate).toFixed(2);

            convertedPrice.textContent = convertedValue;
            convertedCurrency.textContent = selectedCurrency;
        } else {
            console.error("Conversion rate not found.");
        }
    } catch (error) {
        console.error("Currency conversion failed:", error);
    }
});

/* ============== CAR MODEL SEARCH FUNCTIONALITY ============== */
const carModels = [
    { name: "Tesla", path: "models/Tesla/scene.gltf" },
    { name: "Mercedes G Wagon", path: "models/mercedez/scene.gltf" }
];

const searchInput = document.getElementById("carSearch");
const searchBtn = document.getElementById("searchBtn");
const suggestionsBox = document.getElementById("suggestions");

// Function to filter and display search suggestions
function searchCarModels(query) {
    suggestionsBox.innerHTML = "";
    suggestionsBox.style.display = "none"; 

    const lowerCaseQuery = query.toLowerCase();
    let filteredCars = carModels.filter(car => 
        car.name.toLowerCase().includes(lowerCaseQuery)
    );

    if (lowerCaseQuery === "car") {
        filteredCars = carModels;
    }

    if (filteredCars.length > 0) {
        suggestionsBox.style.display = "block";
        filteredCars.forEach(car => {
            const suggestionItem = document.createElement("div");
            suggestionItem.classList.add("suggestion-item");
            suggestionItem.textContent = car.name;
            suggestionItem.onclick = () => selectCar(car);
            suggestionsBox.appendChild(suggestionItem);
        });
    }
}

// Function to select a car from search results
function selectCar(car) {
    searchInput.value = car.name; 
    loadCarModel(car.path); 
    suggestionsBox.innerHTML = ""; 
    suggestionsBox.style.display = "none"; 
}

// Listen for input in the search box
searchInput.addEventListener("input", () => {
    const query = searchInput.value.trim();
    if (query.length > 0) {
        searchCarModels(query);
    } else {
        suggestionsBox.innerHTML = "";
        suggestionsBox.style.display = "none";
    }
});

// Handle clicking the search button
searchBtn.addEventListener("click", () => {
    const query = searchInput.value.trim();
    const car = carModels.find(c => c.name.toLowerCase() === query.toLowerCase());
    if (car) {
        selectCar(car);
    } else {
        alert("Car model not found!");
    }
});


