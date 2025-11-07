import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAptgZ2NIwkWPe67bH6_vPerNZBew2Dj0M",
  authDomain: "rotam-rehber.firebaseapp.com",
  projectId: "rotam-rehber",
  storageBucket: "rotam-rehber.firebasestorage.app",
  messagingSenderId: "183962560517",
  appId: "1:183962560517:web:ae6532a6c89a7fd86a146c",
  measurementId: "G-V37B1CXH46"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Admin Girişi
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const email = document.getElementById("email");
const password = document.getElementById("password");
const authSection = document.getElementById("authSection");
const contentSection = document.getElementById("contentSection");

loginBtn.addEventListener("click", async () => {
  try {
    await signInWithEmailAndPassword(auth, email.value, password.value);
    authSection.style.display = "none";
    contentSection.style.display = "block";
    logoutBtn.style.display = "inline-block";
  } catch {
    alert("Giriş başarısız! Sadece admin erişimi var.");
  }
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  authSection.style.display = "block";
  contentSection.style.display = "none";
  logoutBtn.style.display = "none";
});

// Kategoriler
const categories = {
  "Tatlıcı": ["Dondurmacı", "Baklavacı", "Pastane"],
  "Kafe": ["Kahve", "Çay Bahçesi", "Nargile"],
  "Restoran": ["Balık", "Kebap", "Fast Food"],
  "Kahvaltı": ["Serpme", "Köy Kahvaltısı"],
  "Tarihi Yer": ["Cami", "Müze", "Saray", "Kule"]
};

// Modal
const addPlaceBtn = document.getElementById("addPlaceBtn");
const addPlaceModal = document.getElementById("addPlaceModal");
const closeModalBtn = document.getElementById("closeModal");
const savePlaceBtn = document.getElementById("savePlaceBtn");
const categorySelect = document.getElementById("categorySelect");
const subCategorySelect = document.getElementById("subCategorySelect");
const placeList = document.getElementById("categoryList");

// Modal kontrol
addPlaceBtn.addEventListener("click", () => (addPlaceModal.style.display = "flex"));
closeModalBtn.addEventListener("click", () => (addPlaceModal.style.display = "none"));
window.addEventListener("click", (e) => {
  if (e.target === addPlaceModal) addPlaceModal.style.display = "none";
});

// Kategorileri yükle
Object.keys(categories).forEach(cat => {
  const opt = document.createElement("option");
  opt.value = cat;
  opt.textContent = cat;
  categorySelect.appendChild(opt);
});

categorySelect.addEventListener("change", () => {
  subCategorySelect.innerHTML = '<option value="">Alt Kategori Seç</option>';
  if (categorySelect.value) {
    categories[categorySelect.value].forEach(sub => {
      const opt = document.createElement("option");
      opt.value = sub;
      opt.textContent = sub;
      subCategorySelect.appendChild(opt);
    });
  }
});

// Yer kaydet
savePlaceBtn.addEventListener("click", async () => {
  const name = document.getElementById("placeName").value;
  const img = document.getElementById("placeImage").value;
  const desc = document.getElementById("placeDesc").value;
  const cat = categorySelect.value;
  const sub = subCategorySelect.value;

  if (!name || !cat) return alert("Lütfen gerekli alanları doldurun!");

  await addDoc(collection(db, "mekanlar"), { name, img, desc, cat, sub });
  alert("Mekan eklendi!");
  addPlaceModal.style.display = "none";
});

// Mekanları yükle
async function loadPlaces() {
  const querySnapshot = await getDocs(collection(db, "mekanlar"));
  querySnapshot.forEach(doc => {
    const data = doc.data();
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img src="${data.img || 'https://via.placeholder.com/300'}">
      <h3>${data.name}</h3>
      <p>${data.cat} ${data.sub ? '- ' + data.sub : ''}</p>
      <p>${data.desc || ''}</p>
    `;
    placeList.appendChild(card);
  });
}
loadPlaces();
