// script.js (module)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

/* ---------- FIREBASE CONFIG (senin config) ---------- */
const firebaseConfig = {
  apiKey: "AIzaSyAptgZ2NIwkWPe67bH6_vPerNZBew2Dj0M",
  authDomain: "rotam-rehber.firebaseapp.com",
  projectId: "rotam-rehber",
  storageBucket: "rotam-rehber.firebasestorage.app",
  messagingSenderId: "183962560517",
  appId: "1:183962560517:web:ae6532a6c89a7fd86a146c",
  measurementId: "G-V37B1CXH46"
};
/* ----------------------------------------------------- */

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* ---------- DOM ---------- */
const categoryList = document.getElementById('categoryList');
const placesGrid = document.getElementById('placesGrid');
const addBtn = document.getElementById('addBtn');
const modalBackdrop = document.getElementById('modalBackdrop');
const savePlace = document.getElementById('savePlace');
const cancelPlace = document.getElementById('cancelPlace');
const placeName = document.getElementById('placeName');
const placeImage = document.getElementById('placeImage');
const placeDesc = document.getElementById('placeDesc');
const placeCategory = document.getElementById('placeCategory');
const placeSub = document.getElementById('placeSub');
const resultsCount = document.getElementById('resultsCount');

const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const emailInput = document.getElementById('emailInput');
const passInput = document.getElementById('passInput');

const sliderEl = document.getElementById('slider');
const prevSlide = document.getElementById('prevSlide');
const nextSlide = document.getElementById('nextSlide');

let currentUser = null;
let allPlaces = [];
let visiblePlaces = [];
let currentCategory = null;
let sliderIndex = 0;
let sliderTimer = null;

/* ---------- KATEGORİLER (İSTANBUL ÖRNEKLERİ) ---------- */
const CATEGORIES = [
  { id: 'kafe', title: 'Kafe', subs: ['Kahveci','Kahvaltı Sunan','Patisserie','Kahve & Çalışma'] },
  { id: 'tatlici', title: 'Tatlıcı', subs: ['Dondurma','Pasta','Baklava','Kahve & Tatlı'] },
  { id: 'restoran', title: 'Restoran', subs: ['Türk','Deniz Ürünleri','Dünya Mutfağı','Vejetaryen'] },
  { id: 'kahvalti', title: 'Kahvaltı', subs: ['Serpme','Brunch','Sahil'] },
  { id: 'tarihi', title: 'Tarihi Yer', subs: ['Cami','Müze','Saray','Kale'] },
  { id: 'gece', title: 'Gece Hayatı', subs: ['Bar','Canlı Müzik','Rooftop'] },
  { id: 'konaklama', title: 'Konaklama', subs: ['Butik Otel','Pansiyon','Villa'] },
];

/* ---------- INIT UI ---------- */
function renderCategorySidebar(){
  categoryList.innerHTML = '';
  const allLi = document.createElement('li');
  allLi.textContent = 'Tümü';
  allLi.className = 'active';
  allLi.addEventListener('click', ()=> { currentCategory=null; selectCategory(null); });
  categoryList.appendChild(allLi);

  CATEGORIES.forEach(cat=>{
    const li = document.createElement('li');
    li.textContent = cat.title;
    li.dataset.id = cat.id;
    li.addEventListener('click', ()=> selectCategory(cat.id));
    categoryList.appendChild(li);
  });

  // prepare select options in modal
  placeCategory.innerHTML = '<option value="">Kategori seç</option>';
  CATEGORIES.forEach(cat=>{
    const o = document.createElement('option');
    o.value = cat.id; o.textContent = cat.title;
    placeCategory.appendChild(o);
  });
}

/* ---------- KATEGORİ SEÇİMİ ---------- */
function selectCategory(catId){
  currentCategory = catId;
  document.querySelectorAll('#categoryList li').forEach(li=>li.classList.remove('active'));
  const active = Array.from(document.querySelectorAll('#categoryList li')).find(l=> l.dataset.id === catId);
  if(active) active.classList.add('active'); else document.querySelector('#categoryList li').classList.add('active');

  if(!catId) {
    visiblePlaces = [...allPlaces];
    renderPlaces();
    return;
  }
  visiblePlaces = allPlaces.filter(p => p.cat === catId);
  renderPlaces();
}

/* ---------- RENDER PLACE CARDS ---------- */
function renderPlaces(){
  placesGrid.innerHTML = '';
  resultsCount.textContent = `${visiblePlaces.length} yer bulundu`;
  if(visiblePlaces.length === 0){
    placesGrid.innerHTML = `<div style="padding:12px;background:#fff;border-radius:8px">Henüz gösterilecek yer yok.</div>`;
    renderSlider(); // update slider
    return;
  }

  visiblePlaces.forEach(p=>{
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <img src="${p.image || 'https://via.placeholder.com/600x400?text=No+Image'}" alt="${escapeHtml(p.name)}" onerror="this.src='https://via.placeholder.com/600x400?text=No+Image'">
      <h3>${escapeHtml(p.name)}</h3>
      <p>${escapeHtml(p.desc || '')}</p>
      <div class="meta"><span>${getCategoryTitle(p.cat)}</span><span>${p.sub || ''}</span></div>
    `;
    placesGrid.appendChild(card);
  });

  renderSlider();
}

/* ---------- SLIDER ---------- */
function renderSlider(){
  sliderEl.innerHTML = '';
  const featured = visiblePlaces.slice(0,6);
  if(featured.length === 0){
    sliderEl.innerHTML = '<div style="padding:20px;color:#374151">Henüz görsel yok.</div>';
    return;
  }
  featured.forEach((p, idx)=>{
    const img = document.createElement('img');
    img.src = p.image || 'https://via.placeholder.com/1200x500?text=No+Image';
    img.style.display = (idx===0? 'block':'none');
    sliderEl.appendChild(img);
  });
  // start auto play
  clearInterval(sliderTimer);
  sliderIndex = 0;
  sliderTimer = setInterval(nextSlideFn, 4000);
}
function nextSlideFn(){
  const imgs = sliderEl.querySelectorAll('img');
  if(!imgs.length) return;
  imgs[sliderIndex].style.display='none';
  sliderIndex = (sliderIndex + 1) % imgs.length;
  imgs[sliderIndex].style.display='block';
}
function prevSlideFn(){
  const imgs = sliderEl.querySelectorAll('img');
  if(!imgs.length) return;
  imgs[sliderIndex].style.display='none';
  sliderIndex = (sliderIndex - 1 + imgs.length) % imgs.length;
  imgs[sliderIndex].style.display='block';
}
nextSlide.addEventListener('click', ()=>{ clearInterval(sliderTimer); nextSlideFn(); });
prevSlide.addEventListener('click', ()=>{ clearInterval(sliderTimer); prevSlideFn(); });

/* ---------- HELPERS ---------- */
function getCategoryTitle(id){
  const c = CATEGORIES.find(x=>x.id===id);
  return c ? c.title : id;
}
function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

/* ---------- LOAD / FIRESTORE ---------- */
async function loadPlacesFromFirestore(){
  try{
    const q = query(collection(db, 'mekanlar'), orderBy('createdAt','desc'));
    const snap = await getDocs(q);
    allPlaces = [];
    snap.forEach(doc=>{
      const d = doc.data();
      allPlaces.push({
        id: doc.id,
        name: d.name || '',
        desc: d.desc || '',
        image: d.image || '',
        cat: d.cat || '',
        sub: d.sub || ''
      });
    });
    visiblePlaces = [...allPlaces];
    renderPlaces();
  }catch(err){
    console.error('loadPlaces error', err);
    placesGrid.innerHTML = `<div style="padding:12px;background:#fff;border-radius:8px">Veri yüklenirken hata oldu.</div>`;
  }
}

/* ---------- SAVE PLACE (admin only) ---------- */
savePlace.addEventListener('click', async ()=>{
  if(!currentUser || currentUser.email !== 'admin@rotam.com') return alert('Sadece admin ekleyebilir.');
  const name = placeName.value.trim();
  const cat = placeCategory.value;
  const sub = placeSub.value;
  const img = placeImage.value.trim();
  const desc = placeDesc.value.trim();
  if(!name || !cat) return alert('İsim ve kategori gerekli.');

  try{
    await addDoc(collection(db,'mekanlar'), {
      name, cat, sub, image: img, desc, createdBy: currentUser.email || null, createdAt: Date.now()
    });
    // temizle
    placeName.value=''; placeImage.value=''; placeDesc.value=''; placeCategory.value=''; placeSub.innerHTML='<option value="">Alt Kategori</option>';
    modalBackdrop.style.display='none';
    await loadPlacesFromFirestore();
    alert('Mekan kaydedildi.');
  }catch(e){
    console.error(e); alert('Kaydetme hatası.');
  }
});

/* ---------- modal open/close ---------- */
addBtn.addEventListener('click', ()=>{
  modalBackdrop.style.display='flex';
});
cancelPlace.addEventListener('click', ()=> modalBackdrop.style.display='none');
modalBackdrop.addEventListener('click', (e)=> { if(e.target === modalBackdrop) modalBackdrop.style.display='none'; });

/* ---------- dynamic subcategory fill ---------- */
placeCategory.addEventListener('change', ()=>{
  placeSub.innerHTML = '<option value="">Alt Kategori</option>';
  const c = CATEGORIES.find(x=>x.id === placeCategory.value);
  if(c) c.subs.forEach(s=>{ const o = document.createElement('option'); o.value = s; o.textContent = s; placeSub.appendChild(o); });
});

/* ---------- AUTH ---------- */
loginBtn.addEventListener('click', async ()=>{
  const email = emailInput.value.trim();
  const pass = passInput.value.trim();
  if(!email || !pass) return alert('E-posta ve şifre gerekli.');
  try{
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    // onAuthStateChanged handles UI
  }catch(err){
    console.error(err);
    alert('Giriş başarısız.');
  }
});
logoutBtn.addEventListener('click', async ()=>{ await signOut(auth); });

onAuthStateChanged(auth, user=>{
  currentUser = user;
  if(user && user.email === 'admin@rotam.com'){
    addBtn.style.display = 'inline-block';
    loginBtn.style.display = 'none';
    logoutBtn.style.display = 'inline-block';
    emailInput.style.display = 'none';
    passInput.style.display = 'none';
  } else {
    addBtn.style.display = 'none';
    loginBtn.style.display = 'inline-block';
    logoutBtn.style.display = 'none';
    emailInput.style.display = 'inline-block';
    passInput.style.display = 'inline-block';
  }
});

/* ---------- INIT ---------- */
(function init(){
  renderCategorySidebar();
  loadPlacesFromFirestore();
})();
