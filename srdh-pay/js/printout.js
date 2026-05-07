/*<!-- printout.js (ควบคุมหน้าพิมพ์ PDF) - version : 00108 -->*/

function initPrintout() {
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type');
    const dataStr = params.get('data');
    if(dataStr) {
        const records = JSON.parse(decodeURIComponent(dataStr));
        renderPrintout(type, records);
    }
}
function renderPrintout(type, records) { /* สร้างตารางตามประเภท */ window.print(); }
