// version : 00100
function initRegisterList() {
  const sortedData = [...allData].sort((a, b) => {
    const dateA = new Date(a.วันที่รับ), dateB = new Date(b.วันที่รับ);
    if (dateA === dateB) return b.rowId - a.rowId;
    return dateB - dateA;
  });
  renderTable(sortedData);
}

function renderTable(data) {
  const tbody = document.getElementById('table-body');
  tbody.innerHTML = data.map(item => `
    <tr class="border-b hover:bg-gray-50 cursor-pointer" onclick="showDetail(${item.rowId})">
      <td class="p-3 text-xs">
        วันที่รับ: ${formatDate(item.วันที่รับ)}<br>
        <span class="text-gray-400">เลขรับ: ${item.rowId - 1}</span>
      </td>
      <td><span class="px-2 py-1 rounded-full text-xs bg-purple-100">${item.status}</span></td>
      <td class="text-xs">ใบขอเบิก: ${item.เลขที่ใบขอเบิก || '-'}<br>เลขที่ฏีกา: ${item.เลขที่ฏีกา || '-'}</td>
      <td class="font-bold text-lg text-purple-900">${item.ชื่อเจ้าหนี้ || '-'}</td>
      <td class="max-w-xs truncate">${item.รายการ || '-'}</td>
      <td class="font-bold text-xl text-right">${item.จำนวนเงิน.toLocaleString()}</td>
      <td><span class="badge-${getTypeClass(item.ประเภทเงิน)} px-2 py-1 rounded text-xs">${item.ประเภทเงิน}</span></td>
    </tr>
  `).join('');
}
