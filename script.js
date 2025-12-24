const DRIVE_URL = "https://script.google.com/macros/s/AKfycbyubjBaIpWbHTjIk3aMBm6Zy3obyEBMtZoACPlQh_t2xxg7NbNVnPDePpkjqIGInag9Dw/exec"; 

let db = { 
    currentDay: "LUNES", 
    price1: "0", 
    price2: "0", 
    menus: { "LUNES": { principio: [], proteina: [], especial: [] }, "MARTES": { principio: [], proteina: [], especial: [] }, "MIERCOLES": { principio: [], proteina: [], especial: [] }, "JUEVES": { principio: [], proteina: [], especial: [] }, "VIERNES": { principio: [], proteina: [], especial: [] } } 
};

async function load() {
    try {
        const r = await fetch(DRIVE_URL);
        const d = await r.json();
        if(d && d.menus) { 
            db = d; 
            render(); 
        }
    } catch(e) { 
        console.error("Error cargando base de datos, usando local.");
        render(); 
    }
}

function render() {
    const day = db.currentDay;
    document.getElementById('current-day-label').textContent = day;
    document.body.className = 'bg-' + day.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    document.getElementById('price-p1').textContent = "$" + db.price1;
    document.getElementById('price-p2').textContent = "$" + db.price2;

    ['principio', 'proteina', 'especial'].forEach(sid => {
        const list = document.getElementById('list-' + sid);
        const items = db.menus[day][sid] || [];
        list.innerHTML = items.map(it => `
            <li>
                <span class="${it.stock === false ? 'strike' : ''}">${it.name}</span>
                ${it.stock === false ? '<span class="stamp-agotado">AGOTADO</span>' : ''}
            </li>
        `).join('') || '<li>Cocinando...</li>';
    });

    if(!window.fxDone) { 
        startEpicFX(day); 
        window.fxDone = true; 
    }
}

function startEpicFX(day) {
    const canvas = document.getElementById('fx-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    if (day === "MARTES") {
        const flash = document.getElementById('kitchen-fx');
        flash.style.display = 'block';
        setTimeout(() => { flash.style.opacity = '0'; flash.style.transition = '2s'; }, 500);
    }

    if (day === "LUNES") {
        let particles = [];
        for(let i=0; i<50; i++) particles.push({x: Math.random()*canvas.width, y: canvas.height+10, s: Math.random()*3, v: Math.random()*2+1});
        function animate() {
            ctx.clearRect(0,0,canvas.width, canvas.height);
            ctx.fillStyle = "#ff5722";
            particles.forEach(p => {
                p.y -= p.v; p.x += Math.sin(p.y/20);
                ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, Math.PI*2); ctx.fill();
            });
            if(particles[0].y > -10) requestAnimationFrame(animate);
        }
        animate();
    }
}

function accessAdmin() { 
    let p = prompt("Clave:"); 
    if(p === db.pass) { 
        document.getElementById('view-client').style.display='none'; 
        document.getElementById('view-admin').style.display='block'; 
    } 
}

function exitAdmin() { 
    document.getElementById('view-admin').style.display='none'; 
    document.getElementById('view-client').style.display='block'; 
}

document.addEventListener('DOMContentLoaded', load);
