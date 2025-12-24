const DRIVE_URL = "https://script.google.com/macros/s/AKfycbxIuq4QqVGNN5TSpEo6W2HMsWX1Mp7KO1qYnd8U1P-Gs_0njUV9apSsiL6pANgVoOo0gQ/exec";

let db = {
    currentDay: "LUNES", pass: "3762", price1: "0", price2: "0", recom: "",
    menus: { "LUNES": { principio: [], proteina: [], especial: [], acompanamiento: [] }, "MARTES": { principio: [], proteina: [], especial: [], acompanamiento: [] }, "MIERCOLES": { principio: [], proteina: [], especial: [], acompanamiento: [] }, "JUEVES": { principio: [], proteina: [], especial: [], acompanamiento: [] }, "VIERNES": { principio: [], proteina: [], especial: [], acompanamiento: [] }, "SABADO": { principio: [], proteina: [], especial: [], acompanamiento: [] }, "DOMINGO": { principio: [], proteina: [], especial: [], acompanamiento: [] } }
};

let isEditing = false;
let lastData = "";

// Función para cargar datos
async function load() {
    try {
        const r = await fetch(DRIVE_URL);
        const d = await r.json();
        if (d && d.menus) {
            db = d;
            render();
            if (isEditing) buildEditor();
        }
    } catch (e) { console.error("Error cargando datos"); }
}

// Función para guardar datos
async function save() {
    try {
        await fetch(DRIVE_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(db) });
    } catch (e) { console.error("Error guardando"); }
}

function render() {
    document.getElementById('display-day').textContent = db.currentDay;
    document.getElementById('price-v1').textContent = db.price1 ? `$${db.price1}` : '';
    document.getElementById('price-v2').textContent = db.price2 ? `$${db.price2}` : '';
    
    const mapping = { principio: 'list-principio', proteina: 'list-proteina', especial: 'list-especial', acompanamiento: 'list-extras' };
    Object.keys(mapping).forEach(key => {
        const list = document.getElementById(mapping[key]);
        const items = db.menus[db.currentDay][key] || [];
        list.innerHTML = items.map(it => `
            <li>
                <span class="${it.stock === false ? 'agotado-text' : ''}">${it.name}</span>
                ${it.stock === false ? '<span class="stamp-agotado">AGOTADO</span>' : ''}
            </li>`).join('') || '<li>Cocinando...</li>';
    });

    // Recomendación
    const rb = document.getElementById('recomienda-box');
    if(db.recom && !isEditing) {
        rb.innerHTML = `🔥 RECOMENDACIÓN:<br>${db.recom}`;
        setTimeout(() => rb.style.display = 'block', 5000);
    } else { rb.style.display = 'none'; }
}

function buildEditor() {
    const box = document.getElementById('sections-editor');
    box.innerHTML = '';
    
    // Vincular inputs generales
    document.getElementById('admin-pass').value = db.pass;
    document.getElementById('p1').value = db.price1;
    document.getElementById('p2').value = db.price2;
    document.getElementById('recom-input').value = db.recom;

    // Escuchar cambios en inputs generales
    document.getElementById('admin-pass').oninput = (e) => { db.pass = e.target.value; save(); };
    document.getElementById('p1').oninput = (e) => { db.price1 = e.target.value; save(); render(); };
    document.getElementById('p2').oninput = (e) => { db.price2 = e.target.value; save(); render(); };
    document.getElementById('recom-input').oninput = (e) => { db.recom = e.target.value; save(); };

    Object.keys(db.menus[db.currentDay]).forEach(sec => {
        let h = `<h4 style="color:orange; margin-bottom:5px">${sec.toUpperCase()}</h4>`;
        db.menus[db.currentDay][sec].forEach((it, i) => {
            h += `<div class="item-editor">
                <input type="text" value="${it.name}" oninput="db.menus['${db.currentDay}']['${sec}'][${i}].name=this.value; save()">
                <button class="${it.stock?'on':'off'}" onclick="toggleS('${sec}',${i})">${it.stock?'✔':'✘'}</button>
                <button onclick="deleteI('${sec}',${i})" style="background:none; border:none; color:red">✕</button>
            </div>`;
        });
        h += `<button onclick="addI('${sec}')" style="width:100%; margin-bottom:15px">+ Añadir</button>`;
        box.innerHTML += h;
    });
}

function toggleS(s, i) { db.menus[db.currentDay][s][i].stock = !db.menus[db.currentDay][s][i].stock; save(); render(); buildEditor(); }
function addI(s) { db.menus[db.currentDay][s].push({name:"Nuevo", stock:true}); save(); buildEditor(); }
function deleteI(s, i) { db.menus[db.currentDay][s].splice(i, 1); save(); buildEditor(); }
function nextDay() {
    const d = ['LUNES','MARTES','MIERCOLES','JUEVES','VIERNES','SABADO','DOMINGO'];
    db.currentDay = d[(d.indexOf(db.currentDay)+1)%7];
    save(); render(); buildEditor();
}

function accessAdmin() {
    if(prompt("Clave:") === db.pass) {
        isEditing = true;
        document.getElementById('view-client').style.display = 'none';
        document.getElementById('view-admin').style.display = 'block';
        buildEditor();
    }
}
function exitAdmin() { isEditing = false; document.getElementById('view-admin').style.display = 'none'; document.getElementById('view-client').style.display = 'block'; render(); }
function exploder(el) { el.classList.add('explode'); setTimeout(() => el.style.display = 'none', 500); }

// Iniciar
window.onload = () => {
    load();
    setInterval(() => { if(!isEditing) load(); }, 7000);
};
