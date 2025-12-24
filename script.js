const DRIVE_URL = "https://script.google.com/macros/s/AKfycbxIuq4QqVGNN5TSpEo6W2HMsWX1Mp7KO1qYnd8U1P-Gs_0njUV9apSsiL6pANgVoOo0gQ/exec"; 

let db = {
    currentDay: "LUNES", pass: "3762", price1: "0", price2: "0", recom: "",
    menus: { "LUNES": { principio: [], proteina: [], especial: [], acompanamiento: [] }, "MARTES": { principio: [], proteina: [], especial: [], acompanamiento: [] }, "MIERCOLES": { principio: [], proteina: [], especial: [], acompanamiento: [] }, "JUEVES": { principio: [], proteina: [], especial: [], acompanamiento: [] }, "VIERNES": { principio: [], proteina: [], especial: [], acompanamiento: [] }, "SABADO": { principio: [], proteina: [], especial: [], acompanamiento: [] }, "DOMINGO": { principio: [], proteina: [], especial: [], acompanamiento: [] } }
};

let isEditing = false;
let saveTimeout;
let lastData = "";

document.addEventListener('DOMContentLoaded', () => {
    load();
    setInterval(() => { if(!isEditing) load(); }, 5000);
    setTimeout(() => { document.getElementById('promo-box').style.display = 'block'; }, 15000);
    
    // Lógica Recomendación (Problema 10 segundos)
    setTimeout(() => {
        const box = document.getElementById('recomienda-box');
        if(db.recom && db.recom.trim() !== "") {
            box.innerHTML = `🔥 RECOMENDACIÓN:<br>${db.recom}`;
            box.style.display = 'block';
        }
    }, 10000);
});

async function load() {
    try {
        const r = await fetch(DRIVE_URL);
        const d = await r.json();
        if(d && d.menus && JSON.stringify(d) !== lastData) {
            db = d; lastData = JSON.stringify(d);
            render(); if(isEditing) buildEditor();
        }
    } catch(e){}
}

async function saveToCloud() {
    try { await fetch(DRIVE_URL, { method: 'POST', body: JSON.stringify(db) }); } catch(e){}
}

function autoSave() {
    clearTimeout(saveTimeout);
    render();
    saveTimeout = setTimeout(saveToCloud, 1000);
}

function render() {
    const day = db.currentDay;
    document.getElementById('display-day').textContent = day;
    document.getElementById('bg-body').className = 'bg-' + day.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    document.getElementById('price-v1').textContent = db.price1 ? `$${db.price1}` : '';
    document.getElementById('price-v2').textContent = db.price2 ? `$${db.price2}` : '';

    const mapping = { principio: 'list-principio', proteina: 'list-proteina', especial: 'list-especial', acompanamiento: 'list-extras' };
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
    document.getElementById('edit-title').textContent = "PANEL: " + db.currentDay;
    document.getElementById('admin-pass').value = db.pass;
    document.getElementById('p1').value = db.price1;
    document.getElementById('p2').value = db.price2;
    document.getElementById('recom-input').value = db.recom || "";

    const box = document.getElementById('sections-editor');
    box.innerHTML = '';
    const menu = db.menus[db.currentDay];

    Object.keys(menu).forEach(sec => {
        let h = `<h4 style="color:var(--amarillo-maiz); margin: 20px 0 10px;">${sec.toUpperCase()}</h4>`;
        menu[sec].forEach((it, i) => {
            h += `<div class="item-editor" draggable="true" ondragstart="startDrag('${sec}',${i})">
                <input type="text" value="${it.name}" oninput="db.menus['${db.currentDay}']['${sec}'][${i}].name=this.value; autoSave()">
                <button class="btn-stock ${it.stock?'on':'off'}" onclick="toggleS('${sec}',${i})">${it.stock?'✔':'✘'}</button>
            </div>`;
        });
        h += `<button onclick="addI('${sec}')" style="width:100%; padding:8px; background:#444; color:white; border:none; border-radius:5px;">+ Añadir</button>`;
        box.innerHTML += h;
    });
}

// Drag & Drop para eliminar
let dragData = null;
function startDrag(sec, i) { dragData = {sec, i}; }
document.getElementById('trash-can').ondragover = e => e.preventDefault();
document.getElementById('trash-can').ondrop = () => {
    if(dragData) {
        db.menus[db.currentDay][dragData.sec].splice(dragData.i, 1);
        dragData = null; buildEditor(); autoSave();
    }
};

function toggleS(s, i) { db.menus[db.currentDay][s][i].stock = !db.menus[db.currentDay][s][i].stock; buildEditor(); autoSave(); }
function addI(s) { db.menus[db.currentDay][s].push({name:"", stock:true}); buildEditor(); }
function nextDay() {
    const d = ['LUNES','MARTES','MIERCOLES','JUEVES','VIERNES','SABADO','DOMINGO'];
    db.currentDay = d[(d.indexOf(db.currentDay)+1)%7];
    buildEditor(); autoSave();
}

function accessAdmin() {
    if(prompt("Clave:") === db.pass) {
        isEditing = true;
        document.getElementById('view-client').style.display='none';
        document.getElementById('view-admin').style.display='block';
        buildEditor();
    }
}
function exitAdmin() { isEditing=false; document.getElementById('view-admin').style.display='none'; document.getElementById('view-client').style.display='flex'; render(); }

// Efecto explosión
function exploder(el) {
    el.classList.add('explode');
    setTimeout(() => { el.style.display = 'none'; el.classList.remove('explode'); }, 500);
}
