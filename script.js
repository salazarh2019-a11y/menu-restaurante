const DRIVE_URL = "SU_URL_DE_APPS_SCRIPT"; 

let db = { currentDay: "LUNES", menus: {} };
let pressTimer;

// Función para activar Administrador con presión larga
const adminTrigger = document.getElementById('admin-trigger');

adminTrigger.addEventListener('mousedown', startPress);
adminTrigger.addEventListener('touchstart', startPress);
adminTrigger.addEventListener('mouseup', cancelPress);
adminTrigger.addEventListener('mouseleave', cancelPress);
adminTrigger.addEventListener('touchend', cancelPress);

function startPress() {
    pressTimer = window.setTimeout(() => {
        accessAdmin();
    }, 5000); // 5 segundos exactos
}

function cancelPress() {
    clearTimeout(pressTimer);
}

async function load() {
    try {
        const r = await fetch(DRIVE_URL);
        db = await r.json();
        render();
    } catch(e) { console.error("Error conectando con la base de datos"); }
}

function render() {
    const day = db.currentDay;
    document.getElementById('current-day-label').textContent = day;
    
    // Cambiar fondo según el día
    const body = document.getElementById('main-body');
    body.className = 'bg-' + day.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    const sections = {
        'principio': 'list-principio',
        'proteina': 'list-proteina',
        'especial': 'list-especial',
        'acompanamiento': 'list-acompanamiento'
    };

    Object.entries(sections).forEach(([key, id]) => {
        const list = document.getElementById(id);
        const items = db.menus[day][key] || [];
        list.innerHTML = items.map((it, idx) => `
            <li style="animation-delay: ${idx * 0.1}s">
                <span class="${it.stock === false ? 'strike' : ''}">${it.name}</span>
                ${it.stock === false ? '<span class="stamp-agotado">AGOTADO</span>' : ''}
            </li>
        `).join('') || '<li>Preparando delicias...</li>';
    });
}

// Efecto de Scroll Dinámico
window.addEventListener('scroll', () => {
    const cards = document.querySelectorAll('.card-restaurante');
    cards.forEach(card => {
        const rect = card.getBoundingClientRect();
        if (rect.top < 100) {
            const opacity = rect.top / 100;
            card.style.opacity = opacity;
            card.style.transform = `scale(${0.9 + (opacity * 0.1)}) rotate(-3deg)`;
        } else {
            card.style.opacity = 1;
            card.style.transform = `scale(1) rotate(-1deg)`;
        }
    });
});

function accessAdmin() {
    if(prompt("Clave de Seguridad:") === db.pass) {
        document.getElementById('view-client').style.display='none';
        document.getElementById('view-admin').style.display='block';
    }
}

function exitAdmin() {
    document.getElementById('view-admin').style.display='none';
    document.getElementById('view-client').style.display='block';
}

document.addEventListener('DOMContentLoaded', load);
