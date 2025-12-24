// ... (Tus constantes y variables iniciales) ...

let lastData = ""; 
const INTERVALO_CLIENTE = 5000; // Reducido a 5 segundos para máxima velocidad

document.addEventListener('DOMContentLoaded', () => {
    loadFromCloud();
    
    // Intervalo de actualización rápida para clientes
    setInterval(() => { 
        if(!isEditing) loadFromCloud(); 
    }, INTERVALO_CLIENTE);

    // Activación de promo
    setTimeout(() => { 
        document.getElementById('promo-box').style.display = 'block'; 
    }, 15000);
});

// Función de guardado optimizada
function autoSave() {
    clearTimeout(saveTimeout);
    
    // MEJORA: Reflejar el cambio VISUALMENTE al instante antes de enviar a la nube
    renderClient(); 
    if(isEditing) buildEditor();

    // Enviar a la nube tras 1 segundo de inactividad al escribir
    saveTimeout = setTimeout(async () => {
        await saveToCloud();
        // Guardamos el estado actual para que el siguiente load no cause parpadeos
        lastData = JSON.stringify(db); 
    }, 1000); 
}

// Función específica para el botón de AGOTADO (Velocidad total)
async function toggleStock(sec, i) {
    db.menus[db.currentDay][sec][i].stock = !db.menus[db.currentDay][sec][i].stock;
    
    // 1. Cambio visual inmediato
    renderClient();
    if(isEditing) buildEditor();
    
    // 2. Guardado inmediato sin esperar (bypass de timeout)
    await saveToCloud();
    lastData = JSON.stringify(db);
}
