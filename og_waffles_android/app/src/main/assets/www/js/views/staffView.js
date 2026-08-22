/* OG Waffles & Fried Chicken - Staff Management View (INR ₹ Edition) */

function renderStaffView() {
  const state = store.getState();
  const staff = state.staff || [];
  const settings = state.settings;

  return `
    <div class="p-6 space-y-6 animate-fade-in">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D4AF37]/20 pb-4">
        <div>
          <span class="text-xs text-[#D4AF37] font-semibold tracking-widest uppercase">Human Capital Directory</span>
          <h1 class="font-heading text-2xl font-extrabold text-white">Staff Management</h1>
        </div>

        <button onclick="openStaffModal()" class="btn-gold-solid text-xs py-2 px-4">
          <i class="fas fa-user-plus"></i> Add Employee
        </button>
      </div>

      <div class="glass-card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-black/60 border-b border-gray-800 text-gray-400 uppercase font-semibold text-[10px]">
              <tr>
                <th class="p-3.5">Employee ID</th>
                <th class="p-3.5">Name</th>
                <th class="p-3.5">Role</th>
                <th class="p-3.5">Phone</th>
                <th class="p-3.5">Monthly Salary</th>
                <th class="p-3.5">Shift Timing</th>
                <th class="p-3.5">Joining Date</th>
                <th class="p-3.5">Status</th>
                <th class="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-800/60">
              ${staff.map(emp => `
                <tr class="hover:bg-white/5 transition-colors">
                  <td class="p-3.5 font-bold text-white">${emp.id}</td>
                  <td class="p-3.5 font-bold text-[#D4AF37]">${emp.name}</td>
                  <td class="p-3.5 text-gray-300">${emp.role}</td>
                  <td class="p-3.5 text-gray-400 font-mono">${emp.phone}</td>
                  <td class="p-3.5 font-bold text-emerald-400">${formatCurrency(emp.salary)}</td>
                  <td class="p-3.5 text-gray-400">${emp.shift}</td>
                  <td class="p-3.5 text-gray-500">${emp.joiningDate}</td>
                  <td class="p-3.5"><span class="badge-green">${emp.status}</span></td>
                  <td class="p-3.5 text-right">
                    <button onclick="deleteStaffRecord('${emp.id}')" class="text-xs text-red-400 hover:underline">
                      <i class="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Add Staff Modal -->
    <div id="staff-modal" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 hidden">
      <div class="w-full max-w-md glass-card p-6 border border-[#D4AF37]/50 shadow-2xl space-y-4">
        <div class="flex items-center justify-between border-b border-gray-800 pb-3">
          <h3 class="font-heading font-bold text-base text-white">Add New Employee</h3>
          <button onclick="closeStaffModal()" class="text-gray-400 hover:text-white"><i class="fas fa-times"></i></button>
        </div>

        <form onsubmit="handleStaffSubmit(event)" class="space-y-3 text-xs">
          <div>
            <label class="block text-gray-300 font-semibold mb-1">Employee Name</label>
            <input id="staff-name" type="text" required class="input-gold py-2 text-xs">
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-gray-300 font-semibold mb-1">Role / Position</label>
              <input id="staff-role" type="text" required placeholder="Head Chef, Cashier..." class="input-gold py-2 text-xs">
            </div>
            <div>
              <label class="block text-gray-300 font-semibold mb-1">Phone Number</label>
              <input id="staff-phone" type="tel" required class="input-gold py-2 text-xs">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-gray-300 font-semibold mb-1">Monthly Salary (₹)</label>
              <input id="staff-salary" type="number" required class="input-gold py-2 text-xs">
            </div>
            <div>
              <label class="block text-gray-300 font-semibold mb-1">Shift Timing</label>
              <input id="staff-shift" type="text" required placeholder="Morning / Evening" class="input-gold py-2 text-xs">
            </div>
          </div>

          <div class="pt-3 flex justify-end gap-2 border-t border-gray-800">
            <button type="button" onclick="closeStaffModal()" class="btn-outline-dark text-xs py-2 px-4">Cancel</button>
            <button type="submit" class="btn-gold-solid text-xs py-2 px-5">Save Employee</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

function openStaffModal() {
  document.getElementById("staff-modal").classList.remove("hidden");
}

function closeStaffModal() {
  document.getElementById("staff-modal").classList.add("hidden");
}

function handleStaffSubmit(e) {
  e.preventDefault();
  const name = document.getElementById("staff-name").value;
  const role = document.getElementById("staff-role").value;
  const phone = document.getElementById("staff-phone").value;
  const salary = parseFloat(document.getElementById("staff-salary").value);
  const shift = document.getElementById("staff-shift").value;

  store.saveStaff({
    name,
    role,
    phone,
    salary,
    shift,
    joiningDate: new Date().toISOString().split("T")[0],
    status: "Active"
  });

  closeStaffModal();
  renderView('staff');
}

function deleteStaffRecord(id) {
  if (confirm("Delete employee record?")) {
    store.deleteStaff(id);
    renderView('staff');
  }
}
