// Handle Tab Switching
function switchTab(tabId, el) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    document.getElementById(`tab-${tabId}`).classList.add('active');
}

// Authentication
function login() {
    const e = document.getElementById('email').value.trim();
    const p = document.getElementById('password').value.trim();
    if (!e || !p) {
        alert("Please enter email and password");
        return;
    }
    firebase.auth().signInWithEmailAndPassword(e, p).catch(err => {
        alert("Login Failed: " + err.message);
    });
}

function logout() {
    firebase.auth().signOut();
}

// Auth State Listener
firebase.auth().onAuthStateChanged(user => {
    if (user) {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        loadDates();
        loadConfig();
    } else {
        document.getElementById('login-screen').style.display = 'block';
        document.getElementById('dashboard').style.display = 'none';
    }
});

// Load Dates from Firestore
function loadDates() {
    db.collection('dates').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
        const list = document.getElementById('dates-list');
        list.innerHTML = '';
        
        if (snapshot.empty) {
            list.innerHTML = '<div style="text-align: center; color: #888; padding: 40px;">No dates booked yet! Send her the link! 😿</div>';
            return;
        }
        
        snapshot.forEach(doc => {
            const data = doc.data();
            const done = data.status === 'done';
            
            // Format the Firestore timestamp
            let timeAgo = "Just now";
            if (data.createdAt) {
                const date = data.createdAt.toDate();
                timeAgo = date.toLocaleString();
            }

            list.innerHTML += `
                <div class="date-card ${done ? 'done' : ''}">
                    <div>
                        <span style="font-size: 0.8rem; color: #888; text-transform: uppercase; font-weight: bold;">Submitted: ${timeAgo}</span><br>
                        <strong style="font-size: 1.4rem; color: #e91e63; line-height: 1.5;">${data.dateString}</strong><br>
                        <span style="font-size: 1.1rem; color: #444;">📍 ${data.location}</span><br>
                        <span style="font-size: 1.1rem; color: #444;">🍽️ ${data.foodEmoji} ${data.food}</span>
                    </div>
                    <div style="background: ${done ? '#eee' : '#fce4ec'}; padding: 15px; border-radius: 12px; text-align: center;">
                        <label style="cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 5px; color: ${done ? '#888' : '#e91e63'}; font-weight: 600;">
                            <input type="checkbox" ${done ? 'checked' : ''} onchange="toggleDone('${doc.id}', this.checked)" style="transform: scale(1.5); cursor: pointer;">
                            DONE
                        </label>
                    </div>
                </div>
            `;
        });
    });
}

// Mark Date as Done
function toggleDone(id, isDone) {
    db.collection('dates').doc(id).update({ 
        status: isDone ? 'done' : 'pending' 
    });
}

// Configuration Editor
let currentFoods = [];

function loadConfig() {
    db.collection('config').doc('global').get().then(doc => {
        if (doc.exists) {
            const data = doc.data();
            if (data.foods) currentFoods = data.foods;
            if (data.theme) {
                document.getElementById('theme-selector').value = data.theme;
            }
        }
        renderFoodEditor();
    });
}

function renderFoodEditor() {
    const list = document.getElementById('foods-list');
    list.innerHTML = '';
    currentFoods.forEach((food, index) => {
        list.innerHTML += `
            <div class="config-item">
                <input type="text" class="input-sm emoji-input" value="${food.emoji}" placeholder="Emoji" style="width: 70px; text-align: center; font-size: 1.2rem;">
                <input type="text" class="input-sm name-input" value="${food.name}" placeholder="Food Name (e.g. Pizza)" style="flex: 1;">
                <button onclick="removeFood(${index})" style="background: #ff5252; color: white; border: none; border-radius: 8px; cursor: pointer; padding: 0 15px; font-weight: bold; font-family: 'Poppins';">X</button>
            </div>
        `;
    });
}

function addFoodRow() {
    currentFoods.push({ name: '', emoji: '🍽️' });
    renderFoodEditor();
}

function removeFood(index) {
    currentFoods.splice(index, 1);
    renderFoodEditor();
}

function saveConfig() {
    const names = document.querySelectorAll('.name-input');
    const emojis = document.querySelectorAll('.emoji-input');
    const newFoods = [];
    const theme = document.getElementById('theme-selector').value;
    
    for (let i = 0; i < names.length; i++) {
        const foodName = names[i].value.trim();
        if (foodName) {
            newFoods.push({
                name: foodName,
                emoji: emojis[i].value.trim() || '🍽️'
            });
        }
    }
    
    db.collection('config').doc('global').set({ foods: newFoods, theme: theme }, { merge: true }).then(() => {
        alert('✅ Configuration saved! The main app will now show these foods and the selected theme.');
        loadConfig();
    }).catch(err => {
        alert("Error saving: " + err.message);
    });
}
