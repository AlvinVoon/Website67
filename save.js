import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBlqiRasyTXBWzivMtLZkeS1p2SPgoymKY",
  authDomain: "website67-eabea.firebaseapp.com",
  projectId: "website67-eabea",
  storageBucket: "website67-eabea.firebasestorage.app",
  messagingSenderId: "108324128833",
  appId: "1:108324128833:web:4ce0d93007037c51a79ec0",
  measurementId: "G-60J32Z9YP4"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const savedDocRef = () => doc(db, "collections", "saved");

const saveAll = async (savedArray) => {
  try {
    await setDoc(savedDocRef(), {
      saved: savedArray,
      updatedAt: new Date()
    });
    console.log("Saved list written to Firestore");
  } catch (e) {
    console.error("Error saving list: ", e);
  }
};

const loadAll = async () => {
  try {
    const snap = await getDoc(savedDocRef());
    if (snap.exists()) {
      return snap.data().saved ?? [];
    }
    return [];
  } catch (e) {
    console.error("Error loading list: ", e);
    return [];
  }
};

// Expose to the global scope instead of `export default`,
// so sketch.js can stay a normal (non-module) script.
window.firebaseFns = { saveAll, loadAll };