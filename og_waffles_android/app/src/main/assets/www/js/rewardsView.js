/* OG Waffles & Fried Chicken - Customer Rewards View (INR ₹ Edition) */

let rewardSearchQuery = "";

function renderRewardsView() {
  const state = store.getState();
  const customers = state.customers || [];

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(rewardSearchQuery.toLowerCase()) || 
    c.phone.includes(rewardSearchQuery)
  );

  return `
    <div class="p-6 space-y-6 animate-fade-in">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D4AF37]/20 pb-4">
        <div>
          <span class="text-xs text-[#D4AF37] font-semibold tracking-widest uppercase">Odyssey VIP Loyalty Program</span>
          <h1 class="font-heading text-2xl font-extrabold text-white">Customer Reward System</h1>
          <p class="text-xs text-gray-400">10-Visit purchase tracker. Click the boxes to manually check/uncheck visits. Every 10th visit earns a free luxury meal!</p>
        </div>

        <div class="relative w-full sm:w-72">
          <i class="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-[#D4AF37] text-xs"></i>
          <input type="text" value="${rewardSearchQuery}" oninput="handleRewardSearch(this.value)" placeholder="Search customer name or phone..." class="input-gold pl-9 py-2 text-xs">
        </div>
      </div>

      <!-- Customer Loyalty Cards Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        ${filtered.length === 0 ? `
          <div class="md:col-span-2 lg:col-span-3 text-center py-12 text-gray-500">
            <i class="fas fa-gift text-4xl mb-3 block opacity-30"></i>
            <p class="text-sm">No customers found matching your search.</p>
          </div>
        ` : filtered.map(cust => {
          const isEligibleForFreeReward = cust.rewardProgress >= 10;
          return `
            <div class="glass-card p-6 space-y-4 border border-[#D4AF37]/40 relative overflow-hidden flex flex-col justify-between ${isEligibleForFreeReward ? 'ring-2 ring-[#D4AF37]/60' : ''}">
              ${isEligibleForFreeReward ? `
                <div class="absolute -right-12 top-6 bg-gradient-to-r from-amber-500 to-[#D4AF37] text-black font-extrabold text-[10px] px-12 py-1 rotate-45 shadow-lg uppercase">
                  REWARD AVAILABLE
                </div>
              ` : ''}

              <div class="space-y-1">
                <div class="flex items-center justify-between">
                  <h3 class="font-heading font-bold text-base text-white">${cust.name}</h3>
                  <span class="text-xs text-[#D4AF37] font-mono">${cust.phone}</span>
                </div>
                <p class="text-[11px] text-gray-400">Total Spent: ${formatCurrency(cust.totalSpent || 0)} • Visits: ${cust.visits || 0}</p>
                ${(cust.visitHistory && cust.visitHistory.length > 0) ? `
                  <div class="text-[10px] text-gray-500 mt-1 space-y-0.5 max-h-20 overflow-y-auto">
                    ${cust.visitHistory.map(v =>
                      `<div class="flex justify-between"><span>Visit ${v.visit} — ${v.date}</span><span class="text-[#D4AF37] font-semibold">${formatCurrency(v.amount)}</span></div>`
                    ).join('')}
                  </div>
                ` : ''}
              </div>

              <!-- 10 Purchase Tracker Box Grid — CLICKABLE -->
              <div class="space-y-2 py-2">
                <div class="flex justify-between items-center text-xs">
                  <span class="text-gray-300 font-semibold">10-Visit Loyalty Card:</span>
                  <span class="font-bold text-[#D4AF37]">${cust.rewardProgress || 0} / 10 Visits</span>
                </div>

                <div class="grid grid-cols-5 gap-2">
                  ${Array.from({ length: 10 }).map((_, idx) => {
                    const isChecked = idx < (cust.rewardProgress || 0);
                    return `
                      <button 
                        onclick="toggleRewardBox('${cust.id}', ${idx})" 
                        class="loyalty-box ${isChecked ? 'checked' : ''} cursor-pointer hover:scale-110 active:scale-95 transition-all duration-150"
                        title="Click to ${isChecked ? 'uncheck' : 'check'} visit ${idx + 1}"
                      >
                        ${isChecked ? '<i class="fas fa-check"></i>' : (idx + 1)}
                      </button>
                    `;
                  }).join('')}
                </div>

                <p class="text-[10px] text-gray-600 text-center mt-1">
                  <i class="fas fa-hand-pointer mr-1"></i> Click boxes to manually confirm reward visits
                </p>
              </div>

              <!-- Celebration Alert Banner if 10th visit reached -->
              ${isEligibleForFreeReward ? `
                <div class="p-3 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37] text-center text-xs text-[#D4AF37] font-bold animate-bounce">
                  🎉 REWARD AVAILABLE! Customer has earned a free reward.
                </div>
              ` : ''}

              <!-- Actions -->
              <div class="pt-3 border-t border-gray-800 flex items-center justify-between">
                <span class="text-[10px] text-gray-500">Last visit: ${cust.lastVisit || 'N/A'}</span>
                <button onclick="resetCustomerReward('${cust.id}')" class="btn-gold text-[10px] py-1 px-3">
                  <i class="fas fa-redo-alt"></i> Reset Card
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function handleRewardSearch(val) {
  rewardSearchQuery = val;
  renderView('rewards');
}

async function toggleRewardBox(customerId, boxIndex) {
  const state = store.getState();
  const cust  = state.customers.find(c => c.id === customerId);
  if (!cust) return;

  const currentProgress = cust.rewardProgress !== undefined ? cust.rewardProgress : (cust.reward_visits || 0);

  if (boxIndex < currentProgress) {
    alert("To reset or redeem visits, use the Reset/Redeem Card button.");
    return;
  }

  // Ask "How much did the customer spend on this visit?"
  const targetVisitNum = boxIndex + 1;
  const amtStr = prompt(
    `Visit ${targetVisitNum}\n\nHow much did the customer spend on this visit?\n\n₹`
  );

  if (amtStr === null || amtStr.trim() === '') return;

  const amount = parseFloat(amtStr.replace(/[^\d.]/g, ''));
  if (isNaN(amount) || amount <= 0) {
    alert('Please enter a valid amount greater than 0 in ₹.');
    return;
  }

  try {
    await api.customers.rewardVisit(customerId, { amount: amount });
    store.addNotification('Reward Visit Logged', `Logged visit for ${cust.name} (₹${amount})`, 'success');
    await store.loadMasterData();

    if (currentProgress + 1 >= 10) {
      if (typeof confetti === 'function') {
        try { confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } }); } catch(e) {}
      }
    }
    renderView('rewards');
  } catch (err) {
    console.error("[Reward Visit Error]", err);
    alert(err.message || "Failed to log reward visit.");
  }
}

async function resetCustomerReward(customerId) {
  const state = store.getState();
  const cust = (state.customers || []).find(c => c.id === customerId);
  const rVisits = cust ? (cust.rewardProgress !== undefined ? cust.rewardProgress : (cust.reward_visits || 0)) : 0;

  if (rVisits < 10) {
    if (!confirm(`Customer currently has ${rVisits}/10 visits. 10 visits are required to redeem a luxury reward.\n\nDo you want to proceed?`)) {
      return;
    }
  }

  try {
    await api.customers.redeem(customerId, { reward_name: "Free Waffle / 10 Visits Reward" });
    store.addNotification("Reward Redeemed! 🎉", `Redeemed 10-visit loyalty reward for ${cust ? cust.name : 'customer'}!`, "success");
    if (typeof confetti === 'function') {
      try { confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } }); } catch(e) {}
    }
    await store.loadMasterData();
    renderView('rewards');
  } catch (err) {
    console.error("[Reward Redeem Error]", err);
    alert(err.message || "Failed to redeem reward.");
  }
}

