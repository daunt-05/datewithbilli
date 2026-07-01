let noCount = 0;
let selectedDate = '';
let selectedFood = '';
let selectedFoodEmoji = '';
let selectedLocation = '';
let selectedTheme = 'pink'; // Loaded from Firebase config

function handleNo() {
    const btnNo = document.getElementById('btn-no');
    const h1 = document.getElementById('question-text');
    
    noCount++;
    
    if (noCount === 1) {
        h1.innerText = "Meow? Please lets go 🥺🐾";
        btnNo.innerText = "Still No 😿";
    } else if (noCount === 2) {
        h1.innerText = "Don't be a grumpy cat! 🙏💕";
        btnNo.innerText = "Nope 😾";
    } else if (noCount === 3) {
        // Force them to the force card
        document.getElementById('card-1').classList.remove('active');
        document.getElementById('card-force').classList.add('active');
    }
}

function nextCard(cardNumber) {
    document.querySelectorAll('.card').forEach(card => card.classList.remove('active'));
    document.getElementById(`card-${cardNumber}`).classList.add('active');
}

/* WHEEL PICKER LOGIC */
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function populateWheel(id, items) {
    const col = document.getElementById(id);
    let html = '<div class="wheel-spacer"></div>';
    items.forEach(item => {
        html += `<div class="wheel-item" data-val="${item}">${item}</div>`;
    });
    html += '<div class="wheel-spacer"></div>';
    col.innerHTML = html;
}

function setupWheelSnap(id) {
    const col = document.getElementById(id);
    col.addEventListener('scroll', () => {
        const itemHeight = 50;
        const index = Math.round(col.scrollTop / itemHeight);
        const items = col.querySelectorAll('.wheel-item');
        items.forEach((el, i) => {
            if (i === index) {
                el.style.color = '#e91e63';
                el.style.fontWeight = '600';
                el.style.transform = 'scale(1.1)';
            } else {
                el.style.color = '#888';
                el.style.fontWeight = '500';
                el.style.transform = 'scale(1)';
            }
        });
    });
    
    // Add click-to-scroll functionality for convenience
    col.addEventListener('click', (e) => {
        if (e.target.classList.contains('wheel-item')) {
            const items = Array.from(col.querySelectorAll('.wheel-item'));
            const index = items.indexOf(e.target);
            col.scrollTo({ top: index * 50, behavior: 'smooth' });
        }
    });
}

function getWheelValue(id) {
    const col = document.getElementById(id);
    const itemHeight = 50;
    const index = Math.round(col.scrollTop / itemHeight);
    const items = col.querySelectorAll('.wheel-item');
    if (items[index]) return items[index].dataset.val;
    return items[0].dataset.val;
}

function setWheelValue(id, val) {
    const col = document.getElementById(id);
    const items = col.querySelectorAll('.wheel-item');
    let index = 0;
    items.forEach((el, i) => {
        if (el.dataset.val == val) index = i;
    });
    col.scrollTop = index * 50;
    col.dispatchEvent(new Event('scroll'));
}

window.onload = function() {
    // Populate the lists
    populateWheel('wheel-month', months);
    populateWheel('wheel-day', Array.from({length: 31}, (_, i) => i + 1));
    populateWheel('wheel-hour', Array.from({length: 12}, (_, i) => i + 1));
    populateWheel('wheel-minute', Array.from({length: 60}, (_, i) => (i < 10 ? '0' : '') + i));
    
    // Attach listeners
    ['wheel-month', 'wheel-day', 'wheel-hour', 'wheel-minute', 'wheel-ampm'].forEach(setupWheelSnap);

    const preview = document.getElementById('date-card-preview');
    preview.style.cursor = 'pointer';
    preview.title = 'Tap to open the image and save it if download is blocked.';
    preview.addEventListener('click', () => {
        if (cachedCardUrl) {
            const opened = window.open(cachedCardUrl, '_blank');
            if (!opened) {
                window.location.href = cachedCardUrl;
            }
        }
    });
    
    // Set default date to tomorrow at 7:00 PM
    setTimeout(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        setWheelValue('wheel-month', months[tomorrow.getMonth()]);
        setWheelValue('wheel-day', tomorrow.getDate());
        setWheelValue('wheel-hour', 7);
        setWheelValue('wheel-minute', '00');
        setWheelValue('wheel-ampm', 'PM');
    }, 100); 

    // Load dynamic config (foods + theme) from Firebase
    db.collection('config').doc('global').get().then((doc) => {
        let foods = [];
        let config = {};
        if (doc.exists) {
            config = doc.data();
            foods = config.foods || [];
            selectedTheme = config.theme || 'pink';
        }
        if (foods.length === 0) {
            // Defaults if db is empty
            foods = [
                { name: 'Pizza', emoji: '\ud83c\udf55' },
                { name: 'Burger', emoji: '\ud83c\udf54' },
                { name: 'Ice Cream', emoji: '\ud83c\udf66' },
                { name: 'Pasta', emoji: '\ud83c\udf5d' },
                { name: 'Ramen', emoji: '\ud83c\udf5c' },
                { name: 'Cake', emoji: '\ud83c\udf70' }
            ];
            db.collection('config').doc('global').set({ foods: foods, theme: 'pink' }, { merge: true });
        }
        
        const grid = document.getElementById('dynamic-food-grid');
        grid.innerHTML = '';
        foods.forEach(food => {
            grid.innerHTML += `
                <div class="food-item" onclick="selectFood('${food.name}', '${food.emoji}', this)">
                    <span class="food-emoji">${food.emoji}</span>${food.name}
                </div>
            `;
        });
    }).catch(err => {
        console.error("Error loading config:", err);
    });
}

function saveDateAndNext() {
    const m = getWheelValue('wheel-month');
    const d = getWheelValue('wheel-day');
    const h = getWheelValue('wheel-hour');
    const min = getWheelValue('wheel-minute');
    const ampm = getWheelValue('wheel-ampm');
    
    selectedDate = `${m} ${d} at ${h}:${min} ${ampm}`;
    
    nextCard(3);
}
/* END WHEEL PICKER LOGIC */

function selectFood(foodName, emoji, element) {
    selectedFood = foodName;
    selectedFoodEmoji = emoji;
    
    // Update UI
    document.querySelectorAll('.food-item').forEach(item => item.classList.remove('selected'));
    element.classList.add('selected');
}

// Cached preview URL and blob for download — generated once when card-5 opens
let cachedCardUrl = null;
let cachedCardBlob = null;

function saveFoodAndNext() {
    if (!selectedFood) {
        alert('Please choose something to eat, hungry cat! 🥺🐟');
        return;
    }
    
    nextCard(4);
}

function saveLocationAndNext() {
    const locInput = document.getElementById('location-picker').value.trim();
    if (!locInput) {
        alert('Please tell me where we are going, Billi! 🥺📍');
        return;
    }
    selectedLocation = locInput;
    
    // Write the completed date to Firebase!
    db.collection('dates').add({
        dateString: selectedDate,
        food: selectedFood,
        foodEmoji: selectedFoodEmoji,
        location: selectedLocation,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        status: 'pending'
    }).then(() => {
        console.log("Date successfully saved to the admin panel! 💖");
    }).catch(err => {
        console.error("Error saving date:", err);
    });

    nextCard(5);
    createConfetti();
    generatePreview();
}

function generatePreview() {
    if (cachedCardUrl) {
        URL.revokeObjectURL(cachedCardUrl);
        cachedCardUrl = null;
        cachedCardBlob = null;
    }
    const preview = document.getElementById('date-card-preview');
    const spinner = document.getElementById('preview-spinner');
    preview.style.display = 'none';
    spinner.style.display = 'flex';

    // Pick the correct template based on the theme loaded from Firebase
    let captureArea;
    if (selectedTheme === 'dark') {
        document.getElementById('card-date-dark').innerText = selectedDate;
        document.getElementById('card-location-dark').innerText = selectedLocation;
        document.getElementById('card-food-dark').innerText = `${selectedFoodEmoji} ${selectedFood}`;
        captureArea = document.getElementById('date-card-img-dark');
    } else {
        document.getElementById('card-date').innerText = selectedDate;
        document.getElementById('card-location').innerText = selectedLocation;
        document.getElementById('card-food').innerText = `${selectedFoodEmoji} ${selectedFood}`;
        captureArea = document.getElementById('date-card-img');
    }

    html2canvas(captureArea, { scale: 2, backgroundColor: null, useCORS: true }).then(canvas => {
        canvas.toBlob(blob => {
            if (!blob) throw new Error('Unable to generate card blob');
            cachedCardBlob = blob;
            cachedCardUrl = URL.createObjectURL(blob);
            preview.src = cachedCardUrl;
            preview.style.display = 'block';
            spinner.style.display = 'none';
        }, 'image/png');
    }).catch(err => {
        console.error("Preview generation failed:", err);
        spinner.style.display = 'none';
    });
}

function downloadDateCard() {
    if (!cachedCardBlob || !cachedCardUrl) {
        alert('Please wait while the card is being generated! 🐾');
        return;
    }

    const link = document.createElement('a');
    link.href = cachedCardUrl;
    link.download = 'Our_Purrfect_Date.png';
    link.style.display = 'none';
    document.body.appendChild(link);

    if (typeof link.download === 'undefined') {
        window.open(cachedCardUrl, '_blank');
    } else {
        link.click();
    }

    document.body.removeChild(link);
}

function createConfetti() {
    const colors = ['#e91e63', '#fce4ec', '#f8bbd0', '#ffeb3b', '#00bcd4'];
    const emojis = ['🐾', '🐟', '💖', '✨', '😻'];
    
    for (let i = 0; i < 70; i++) {
        const confetti = document.createElement('div');
        
        // Randomize shape (emoji or colored square/circle)
        if (Math.random() > 0.4) {
            confetti.innerText = emojis[Math.floor(Math.random() * emojis.length)];
            confetti.style.fontSize = Math.random() * 15 + 10 + 'px';
        } else {
            confetti.style.width = Math.random() * 10 + 5 + 'px';
            confetti.style.height = Math.random() * 10 + 5 + 'px';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
        }
        
        confetti.style.position = 'fixed';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.top = -50 + 'px';
        confetti.style.zIndex = 9999;
        
        // Random animation duration and delay
        const duration = Math.random() * 3 + 2;
        const delay = Math.random() * 2;
        
        confetti.style.animation = `fall ${duration}s linear ${delay}s forwards`;
        document.body.appendChild(confetti);
    }
}

const style = document.createElement('style');
style.innerHTML = `
  @keyframes fall {
    0% { transform: translateY(-50px) rotate(0deg); opacity: 1; }
    100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
  }
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-15px); }
  }
`;
document.head.appendChild(style);
