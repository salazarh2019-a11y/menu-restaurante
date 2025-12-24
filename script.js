const DRIVE_URL = "https://script.google.com/macros/s/AKfycbxIuq4QqVGNN5TSpEo6W2HMsWX1Mp7KO1qYnd8U1P-Gs_0njUV9apSsiL6pANgVoOo0gQ/exec"; 

let db = {
    currentDay: "LUNES", 
    pass: "3762", 
    price1: "0", 
    price2: "0", 
    recom: "",
    menus: { 
        "LUNES": { principio: [], proteina: [], especial: [], acompanamiento: [] }, 
        "MARTES": { principio: [], proteina: [], especial: [], acompanamiento: [] }, 
        "MIERCOLES": { principio: [], proteina: [], especial: [], acompanamiento: [] }, 
        "JUEVES": { principio: [], proteina: [], especial: [], acompanamiento: [] }, 
        "VIERNES": { principio: [], proteina: [], especial: [], acompanamiento: [] }, 
        "SABADO": { principio: [], proteina: [], especial: [], acompanamiento: [] }, 
        "DOMINGO": { principio: [], proteina: [], especial: [], acompanamiento: [] } 
    }
};

let isEditing = false;
let saveTimeout;
let lastData = "";

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    load();
    // Consulta rápida cada 5 segundos para clientes
    setInterval(() => { if(!isEditing) load(); }, 5000);
    
    // Mostrar promo a los 15 seg
    setTimeout(() => { 
        document.getElementById('promo-box').style.display = 'block'; 
    }, 15000);

    // Lógica Recomendación de la casa (aparece a los 10 segundos)
    setTimeout(() => {
        const box = document.getElementById('recomienda-box');
        if(db.recom && db.recom.trim() !== "") {
            box.innerHTML = `🔥 RECOMENDACIÓN:<br><span style="font-family:'Courgette'">${db.recom}</span>`;
            box.style.display = 'block';
        }
    }, 10000);
});

async function load() {
    try {
        const r = await fetch(DRIVE_URL);
        const d = await r.json();
        // Solo actualiza si hay cambios reales para evitar parpadeos
        if(d && d.menus && JSON.stringify(d) !== lastData) {
            db = d; 
            lastData = JSON.stringify(d);
            render(); 
            if(isEditing) buildEditor();
        }
    } catch(e){ console.log("Error de conexión"); }
}

async function saveToCloud() {
    try { 
        await fetch(DRIVE_URL, { 
            method: 'POST', 
            mode: 'no-cors', // Necesario para Google Apps Script en algunos casos
            body: JSON.stringify(db) 
        }); 
    } catch(e){ console.log("Error al guardar"); }
}

function autoSave() {
    clearTimeout(saveTimeout);
    render(); // Reflejo inmediato visual
    saveTimeout = setTimeout(saveToCloud, 1000);
}

function render() {
    const day = db.currentDay;
    document.getElementById('display-day').textContent = day;
    
    // Cambiar color de fondo según el día
    const dayClass = day.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    document.getElementById('bg-body').className = 'bg-' + dayClass;

    // Actualizar Precios en tarjetas
    document.getElementById('price-v1').textContent = db.price1 ? `$${db.price1}` : '';
    document.getElementById('price-v2').textContent = db.price2 ? `$${db.price2}` : '';

    const mapping = { 
        principio: 'list-principio', 
        proteina: 'list-proteina', 
        especial: 'list-especial', 
        acompanamiento: 'list-extras' 
    };

    Object.keys(mapping).forEach(key => {
        const list = document.getElementById(mapping[key]);
        const items = db.menus[day][key] || [];
        list.innerHTML = items.map(it => `
            <li>
                <span class="${it.stock === false ? 'agotado-text' : ''}">${it.name}</span>
                ${it.stock === false ? '<span class="stamp-agotado">AGOTADO</span>' : ''}
            </li>`).join('') || '<li>Cocinando...</li>';
    });
}

function buildEditor() {
    document.getElementById('edit-title').textContent = "EDITANDO: " + db.currentDay;
    document.getElementById('admin-pass').value = db.pass;
    document.getElementById('p1').value = db.price1;
    document.getElementById('p2').value = db.price2;
    document.getElementById('recom-input').value = db.recom || "";

    const box = document.getElementById('sections-editor');
    box.innerHTML = '';
    const menu = db.menus[db.currentDay];

    Object.keys(menu).forEach(sec => {
        let h = `<h4 style="color:var(--amarillo-maiz); margin: 25px 0 10px; border-bottom: 1px solid #555;">${sec.toUpperCase()}</h4>`;
        menu[sec].forEach((it, i) => {
            h += `<div class="item-editor" draggable="true" ondragstart="startDrag('${sec}',${i})" ontouchstart="startDragTouch('${sec}',${i})">
                <input type="text" value="${it.name}" oninput="db.menus['${db.currentDay}']['${sec}'][${i}].name=this.value; autoSave()">
                <button class="btn-stock ${it.stock?'on':'off'}" onclick="toggleS('${sec}',${i})">${it.stock?'✔':'✘'}</button>
            </div>`;
        });
        h += `<button onclick="addI('${sec}')" style="width:100%; padding:10px; background:#444; color:white; border:none; border-radius:8px; margin-top:5px; cursor:pointer;">+ Añadir Plato</button>`;
        box.innerHTML += h;
    });
}

// --- LÓGICA DE ELIMINACIÓN (DRAG & DROP) ---
let dragData = null;

function startDrag(sec, i) { 
    dragData = {sec, i}; 
}

// Soporte para móviles (Touch)
function startDragTouch(sec, i) {
    dragData = {sec, i};
    document.getElementById('trash-can').style.background = "rgba(255,0,0,0.2)";
}

document.getElementById('trash-can').ondragover = e => e.preventDefault();
document.getElementById('trash-can').ondrop = () => { handleDrop(); };

// Ejecutar eliminación
function handleDrop() {
    if(dragData) {
        db.menus[db.currentDay][dragData.sec].splice(dragData.i, 1);
        dragData = null;
        document.getElementById('trash-can').style.background = "";
        buildEditor(); 
        autoSave();
    }
}

// Detectar si sueltan el touch sobre la papelera
document.addEventListener('touchend', (e) => {
    if(!isEditing) return;
    const trash = document.getElementById('trash-can');
    const rect = trash.getBoundingClientRect();
    const touch = e.changedTouches[0];

    if (touch.clientX > rect.left && touch.clientX < rect.right &&
        touch.clientY > rect.top && touch.clientY < rect.bottom) {
        handleDrop();
    }
    trash.style.background = "";
});

// --- FUNCIONES DE BOTONES ---
function toggleS(s, i) { 
    db.menus[db.currentDay][s][i].stock = !db.menus[db.currentDay][s][i].stock; 
    buildEditor(); 
    autoSave(); 
}

function addI(s) { 
    db.menus[db.currentDay][s].push({name:"Nuevo Plato", stock:true}); 
    buildEditor(); 
}

function nextDay() {
    const d = ['LUNES','MARTES','MIERCOLES','JUEVES','VIERNES','SABADO','DOMINGO'];
    db.currentDay = d[(d.indexOf(db.currentDay)+1)%7];
    buildEditor(); 
    autoSave();
}

function accessAdmin() {
    const p = prompt("Clave de acceso:");
    if(p === db.pass) {
        isEditing = true;
        document.getElementById('view-client').style.display='none';
        document.getElementById('view-admin').style.display='block';
        buildEditor();
    } else if (p !== null) {
        alert("Clave incorrecta");
    }
}

function exitAdmin() { 
    isEditing = false; 
    document.getElementById('view-admin').style.display='none'; 
    document.getElementById('view-client').style.display='flex'; 
    render(); 
}

// Función de Explosión al tocar recomendación
function exploder(el) {
    el.classList.add('explode');
    // Sonido opcional aquí si se desea
    setTimeout(() => { 
        el.style.display = 'none'; 
        el.classList.remove('explode'); 
    }, 500);
}
