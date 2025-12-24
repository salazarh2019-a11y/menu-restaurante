const DRIVE_URL = "TU_URL_DE_APPS_SCRIPT"; 

let db = { currentDay: "LUNES", menus: {} };
let clickCount = 0;

// LÓGICA: Triple toque para entrar a admin
const adminTrigger = document.getElementById('admin-trigger');
adminTrigger.addEventListener('click', () => {
    clickCount++;
    if (clickCount === 3) {
        accessAdmin();
        clickCount = 0;
    }
    setTimeout(() => { clickCount = 0; }, 1000); // Reiniciar contador tras 1s
});

// LÓGICA: Movimiento 3D al tocar
document.querySelectorAll('.card-restaurante').forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const rotateX = ((y / rect.height) - 0.5) * 10; // Inclinación suave
        const rotateY = ((x / rect.width) - 0.5) * -10;
        card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    card.addEventListener('mouseleave', () => {
        card.style.transform = `rotateX(0deg) rotateY(0deg)`;
    });
});

async function load() {
    try {
        const r = await fetch(DRIVE_URL);
        db = await r.json();
        render();
    } catch(e) { console.error("Error cargando datos"); }
}

function render() {
    const day = db.currentDay;
    document.getElementById('current-day-label').textContent = day;
    
    // Cambiar fondo rústico según el día
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
        list.innerHTML = items.map(it => `
            <li>
                <span class="${it.stock === false ? 'strike' : ''}">${it.name}</span>
                ${it.stock === false ? '<span class="stamp-agotado">AGOTADO</span>' : ''}
            </li>
        `).join('') || '<li>Cocinando...</li>';
    });
}

function accessAdmin() {
    if(prompt("Clave:") === db.pass) {
        document.getElementById('view-client').style.display='none';
        document.getElementById('view-admin').style.display='block';
    }
}

function exitAdmin() {
    document.getElementById('view-admin').style.display='none';
    document.getElementById('view-client').style.display='block';
}

document.addEventListener('DOMContentLoaded', load);
