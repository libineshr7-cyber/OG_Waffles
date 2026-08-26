/* OG Waffles & Fried Chicken - Comprehensive 7-Day Weekly Report & PDF Generator */

/**
 * Compiles all essential business data for the last 7 days from Store and API
 */
function compile7DayReportData() {
  const state = store.getState();
  const today = new Date();
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const startDateStr = weekAgo.toISOString().split("T")[0];
  const endDateStr = today.toISOString().split("T")[0];

  const orders = (state.orders || []).filter(o => {
    const orderDate = o.date || (o.created_at ? o.created_at.split("T")[0] : "");
    return orderDate >= startDateStr && orderDate <= endDateStr;
  });

  const expenses = (state.expenses || []).filter(e => {
    const expDate = e.date || "";
    return expDate >= startDateStr && expDate <= endDateStr;
  });

  const wasteLogs = (state.wasteLogs || []).filter(w => {
    const wDate = w.date || "";
    return wDate >= startDateStr && wDate <= endDateStr;
  });

  // 1. Revenue & Payment Breakdown
  let grossRevenue = 0;
  let cashSales = 0;
  let upiSales = 0;
  let cardSales = 0;
  let otherSales = 0;

  const productSalesMap = {};
  const categorySalesMap = {};

  orders.forEach(ord => {
    const total = parseFloat(ord.total) || parseFloat(ord.grandTotal) || 0;
    grossRevenue += total;

    const method = (ord.paymentMethod || ord.payment_method || "CASH").toUpperCase();
    if (method.includes("CASH")) cashSales += total;
    else if (method.includes("UPI") || method.includes("GPAY") || method.includes("PHONEPE")) upiSales += total;
    else if (method.includes("CARD")) cardSales += total;
    else otherSales += total;

    // Items Breakdown
    const items = ord.items || [];
    items.forEach(item => {
      const pId = item.id || item.productId || item.name;
      const pName = item.name || "Item";
      const pCat = item.category || "General";
      const pQty = parseInt(item.qty || item.quantity) || 1;
      const pPrice = parseFloat(item.price) || 0;
      const pTotal = pPrice * pQty;

      // Product sales
      if (!productSalesMap[pName]) {
        productSalesMap[pName] = { name: pName, category: pCat, qty: 0, revenue: 0 };
      }
      productSalesMap[pName].qty += pQty;
      productSalesMap[pName].revenue += pTotal;

      // Category sales
      if (!categorySalesMap[pCat]) {
        categorySalesMap[pCat] = { name: pCat, qty: 0, revenue: 0 };
      }
      categorySalesMap[pCat].qty += pQty;
      categorySalesMap[pCat].revenue += pTotal;
    });
  });

  // 2. Expenses & Waste Calculation
  const totalExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  const totalWasteLoss = wasteLogs.reduce((sum, w) => sum + (parseFloat(w.cost || w.amount || 0) || 0), 0);

  // 3. Estimated COGS (approx 35% standard for restaurant or based on recipe costs)
  const estimatedCogs = grossRevenue * 0.35;
  const netProfit = grossRevenue - estimatedCogs - totalExpenses - totalWasteLoss;
  const profitMargin = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;
  const avgOrderValue = orders.length > 0 ? grossRevenue / orders.length : 0;

  // 4. Sort Top Products
  const topProducts = Object.values(productSalesMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 10);

  // 5. Category Breakdown List
  const categoryBreakdown = Object.values(categorySalesMap)
    .sort((a, b) => b.revenue - a.revenue);

  // 6. Inventory Consumption & Shortages
  const ingredients = state.ingredients || [];
  const inventoryStatusList = ingredients.map(ing => {
    const current = parseFloat(ing.currentQty) || 0;
    const min = parseFloat(ing.minLimit) || 5;
    const unit = ing.baseUnit || ing.unit || "unit";
    let status = "Optimal";
    if (current <= 0) status = "Out of Stock";
    else if (current <= min) status = "Running Low";
    return {
      name: ing.name,
      currentQty: current,
      minLimit: min,
      unit: unit,
      status: status
    };
  });

  // 7. System Activity Logs Summary
  const recentLogs = (state.systemLogs || []).slice(0, 8);

  return {
    reportId: `OGW-7D-${Date.now().toString().slice(-6)}`,
    startDate: startDateStr,
    endDate: endDateStr,
    generatedAt: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
    businessInfo: {
      name: state.settings?.businessName || "OG Waffles & Fried Chicken",
      address: state.settings?.address || "No. 390, paneer nagar, thiruvalluvar salai, mogapair east, chennai - 600037",
      phone: state.settings?.phone || "+91 93633 23102",
      currency: state.settings?.currency || "₹",
      owner: state.currentUser?.name || "Store Owner"
    },
    metrics: {
      totalOrders: orders.length,
      grossRevenue,
      cashSales,
      upiSales,
      cardSales,
      otherSales,
      totalExpenses,
      totalWasteLoss,
      estimatedCogs,
      netProfit,
      profitMargin,
      avgOrderValue
    },
    topProducts,
    categoryBreakdown,
    inventoryStatusList,
    expenses,
    recentLogs
  };
}

/**
 * Builds printable HTML document for html2pdf
 */
function buildReportPdfHtml(data) {
  const curr = data.businessInfo.currency || "₹";
  const fmt = (val) => `${curr}${Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return `
    <div id="pdf-report-root" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #111; background: #fff; padding: 24px; max-width: 800px; margin: 0 auto; line-height: 1.4; font-size: 11px;">
      
      <!-- Report Header -->
      <div style="border-bottom: 2px solid #D4AF37; padding-bottom: 14px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h1 style="font-size: 20px; font-weight: 800; color: #000; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">
            ${data.businessInfo.name}
          </h1>
          <p style="margin: 2px 0 0 0; color: #555; font-size: 10px;">
            ${data.businessInfo.address} &bull; Tel: ${data.businessInfo.phone}
          </p>
          <div style="margin-top: 6px; display: inline-block; background: #FFF8E7; border: 1px solid #D4AF37; padding: 3px 8px; border-radius: 4px;">
            <strong style="color: #926C00; font-size: 10px; text-transform: uppercase;">7-Day Executive Performance Report</strong>
          </div>
        </div>

        <div style="text-align: right; font-size: 10px; color: #444;">
          <p style="margin: 0;"><strong>Report ID:</strong> ${data.reportId}</p>
          <p style="margin: 2px 0;"><strong>Period:</strong> ${data.startDate} to ${data.endDate}</p>
          <p style="margin: 2px 0;"><strong>Generated:</strong> ${data.generatedAt}</p>
          <p style="margin: 2px 0;"><strong>Authority:</strong> ${data.businessInfo.owner}</p>
        </div>
      </div>

      <!-- Executive Financial Summary Grid -->
      <h2 style="font-size: 13px; font-weight: 700; color: #222; margin: 14px 0 8px 0; border-left: 3px solid #D4AF37; padding-left: 6px; text-transform: uppercase;">
        1. Executive Financial Performance
      </h2>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 14px;">
        <tr>
          <td style="padding: 8px; border: 1px solid #E5E7EB; background: #FAFAFA; width: 25%;">
            <div style="color: #666; font-size: 9px; text-transform: uppercase;">Gross Revenue</div>
            <div style="font-size: 15px; font-weight: 800; color: #059669;">${fmt(data.metrics.grossRevenue)}</div>
            <div style="font-size: 9px; color: #888;">${data.metrics.totalOrders} Invoices Billed</div>
          </td>
          <td style="padding: 8px; border: 1px solid #E5E7EB; background: #FAFAFA; width: 25%;">
            <div style="color: #666; font-size: 9px; text-transform: uppercase;">Cost of Goods (COGS)</div>
            <div style="font-size: 15px; font-weight: 800; color: #D97706;">${fmt(data.metrics.estimatedCogs)}</div>
            <div style="font-size: 9px; color: #888;">Food & Beverage Costs</div>
          </td>
          <td style="padding: 8px; border: 1px solid #E5E7EB; background: #FAFAFA; width: 25%;">
            <div style="color: #666; font-size: 9px; text-transform: uppercase;">Operating Expenses</div>
            <div style="font-size: 15px; font-weight: 800; color: #DC2626;">${fmt(data.metrics.totalExpenses + data.metrics.totalWasteLoss)}</div>
            <div style="font-size: 9px; color: #888;">Direct Outflows & Waste</div>
          </td>
          <td style="padding: 8px; border: 1px solid #E5E7EB; background: #F0FDF4; width: 25%;">
            <div style="color: #166534; font-size: 9px; text-transform: uppercase; font-weight: 700;">Net Operating Profit</div>
            <div style="font-size: 15px; font-weight: 800; color: #166534;">${fmt(data.metrics.netProfit)}</div>
            <div style="font-size: 9px; color: #166534; font-weight: 700;">${data.metrics.profitMargin.toFixed(1)}% Margin</div>
          </td>
        </tr>
      </table>

      <!-- Payment Breakdown & Key Metrics Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 10px;">
        <tr style="background: #F3F4F6;">
          <th style="padding: 6px; border: 1px solid #E5E7EB; text-align: left;">Payment Method</th>
          <th style="padding: 6px; border: 1px solid #E5E7EB; text-align: right;">Amount Billed</th>
          <th style="padding: 6px; border: 1px solid #E5E7EB; text-align: right;">Share of Sales</th>
          <th style="padding: 6px; border: 1px solid #E5E7EB; text-align: left;">Metric</th>
          <th style="padding: 6px; border: 1px solid #E5E7EB; text-align: right;">Value</th>
        </tr>
        <tr>
          <td style="padding: 5px; border: 1px solid #E5E7EB;">💵 Cash In-Hand</td>
          <td style="padding: 5px; border: 1px solid #E5E7EB; text-align: right; font-weight: 600;">${fmt(data.metrics.cashSales)}</td>
          <td style="padding: 5px; border: 1px solid #E5E7EB; text-align: right;">${data.metrics.grossRevenue > 0 ? ((data.metrics.cashSales / data.metrics.grossRevenue) * 100).toFixed(1) : 0}%</td>
          <td style="padding: 5px; border: 1px solid #E5E7EB;">Avg. Order Value (AOV)</td>
          <td style="padding: 5px; border: 1px solid #E5E7EB; text-align: right; font-weight: 600;">${fmt(data.metrics.avgOrderValue)}</td>
        </tr>
        <tr>
          <td style="padding: 5px; border: 1px solid #E5E7EB;">📱 UPI / QR Payments</td>
          <td style="padding: 5px; border: 1px solid #E5E7EB; text-align: right; font-weight: 600;">${fmt(data.metrics.upiSales)}</td>
          <td style="padding: 5px; border: 1px solid #E5E7EB; text-align: right;">${data.metrics.grossRevenue > 0 ? ((data.metrics.upiSales / data.metrics.grossRevenue) * 100).toFixed(1) : 0}%</td>
          <td style="padding: 5px; border: 1px solid #E5E7EB;">Total Items Sold</td>
          <td style="padding: 5px; border: 1px solid #E5E7EB; text-align: right; font-weight: 600;">${data.topProducts.reduce((sum, p) => sum + p.qty, 0)} Units</td>
        </tr>
        <tr>
          <td style="padding: 5px; border: 1px solid #E5E7EB;">💳 Card Swipes</td>
          <td style="padding: 5px; border: 1px solid #E5E7EB; text-align: right; font-weight: 600;">${fmt(data.metrics.cardSales)}</td>
          <td style="padding: 5px; border: 1px solid #E5E7EB; text-align: right;">${data.metrics.grossRevenue > 0 ? ((data.metrics.cardSales / data.metrics.grossRevenue) * 100).toFixed(1) : 0}%</td>
          <td style="padding: 5px; border: 1px solid #E5E7EB;">Waste Loss Deduction</td>
          <td style="padding: 5px; border: 1px solid #E5E7EB; text-align: right; color: #DC2626;">-${fmt(data.metrics.totalWasteLoss)}</td>
        </tr>
      </table>

      <!-- Top 10 Best Selling Items -->
      <h2 style="font-size: 13px; font-weight: 700; color: #222; margin: 14px 0 8px 0; border-left: 3px solid #D4AF37; padding-left: 6px; text-transform: uppercase;">
        2. Top 10 Best-Selling Menu Items
      </h2>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 10px;">
        <tr style="background: #F3F4F6; text-align: left;">
          <th style="padding: 5px; border: 1px solid #E5E7EB; width: 40px; text-align: center;">Rank</th>
          <th style="padding: 5px; border: 1px solid #E5E7EB;">Product Name</th>
          <th style="padding: 5px; border: 1px solid #E5E7EB;">Category</th>
          <th style="padding: 5px; border: 1px solid #E5E7EB; text-align: center; width: 70px;">Qty Sold</th>
          <th style="padding: 5px; border: 1px solid #E5E7EB; text-align: right; width: 100px;">Revenue</th>
        </tr>
        ${data.topProducts.length === 0 ? `
          <tr><td colspan="5" style="padding: 10px; text-align: center; color: #888;">No menu items sold during this period</td></tr>
        ` : data.topProducts.map((p, idx) => `
          <tr style="background: ${idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB'};">
            <td style="padding: 4px; border: 1px solid #E5E7EB; text-align: center; font-weight: 700;">#${idx + 1}</td>
            <td style="padding: 4px; border: 1px solid #E5E7EB; font-weight: 600;">${p.name}</td>
            <td style="padding: 4px; border: 1px solid #E5E7EB; color: #555;">${p.category}</td>
            <td style="padding: 4px; border: 1px solid #E5E7EB; text-align: center; font-weight: 700;">${p.qty}</td>
            <td style="padding: 4px; border: 1px solid #E5E7EB; text-align: right; font-weight: 700;">${fmt(p.revenue)}</td>
          </tr>
        `).join('')}
      </table>

      <!-- Category Sales Performance -->
      <h2 style="font-size: 13px; font-weight: 700; color: #222; margin: 14px 0 8px 0; border-left: 3px solid #D4AF37; padding-left: 6px; text-transform: uppercase;">
        3. Category Sales Breakdown
      </h2>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 10px;">
        <tr style="background: #F3F4F6; text-align: left;">
          <th style="padding: 5px; border: 1px solid #E5E7EB;">Category</th>
          <th style="padding: 5px; border: 1px solid #E5E7EB; text-align: center;">Items Sold</th>
          <th style="padding: 5px; border: 1px solid #E5E7EB; text-align: right;">Total Revenue</th>
          <th style="padding: 5px; border: 1px solid #E5E7EB; text-align: right;">% Contribution</th>
        </tr>
        ${data.categoryBreakdown.length === 0 ? `
          <tr><td colspan="4" style="padding: 10px; text-align: center; color: #888;">No category sales data</td></tr>
        ` : data.categoryBreakdown.map((c, idx) => `
          <tr style="background: ${idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB'};">
            <td style="padding: 4px; border: 1px solid #E5E7EB; font-weight: 600;">${c.name}</td>
            <td style="padding: 4px; border: 1px solid #E5E7EB; text-align: center;">${c.qty}</td>
            <td style="padding: 4px; border: 1px solid #E5E7EB; text-align: right; font-weight: 700;">${fmt(c.revenue)}</td>
            <td style="padding: 4px; border: 1px solid #E5E7EB; text-align: right;">${data.metrics.grossRevenue > 0 ? ((c.revenue / data.metrics.grossRevenue) * 100).toFixed(1) : 0}%</td>
          </tr>
        `).join('')}
      </table>

      <!-- Inventory Stock Status & Shortages -->
      <h2 style="font-size: 13px; font-weight: 700; color: #222; margin: 14px 0 8px 0; border-left: 3px solid #D4AF37; padding-left: 6px; text-transform: uppercase;">
        4. Inventory Stock & Material Status
      </h2>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 10px;">
        <tr style="background: #F3F4F6; text-align: left;">
          <th style="padding: 5px; border: 1px solid #E5E7EB;">Raw Material / Ingredient</th>
          <th style="padding: 5px; border: 1px solid #E5E7EB; text-align: right;">Current Stock</th>
          <th style="padding: 5px; border: 1px solid #E5E7EB; text-align: right;">Minimum Limit</th>
          <th style="padding: 5px; border: 1px solid #E5E7EB; text-align: center;">Status</th>
        </tr>
        ${data.inventoryStatusList.slice(0, 8).map((inv, idx) => `
          <tr style="background: ${idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB'};">
            <td style="padding: 4px; border: 1px solid #E5E7EB; font-weight: 500;">${inv.name}</td>
            <td style="padding: 4px; border: 1px solid #E5E7EB; text-align: right; font-weight: 700;">${inv.currentQty} ${inv.unit}</td>
            <td style="padding: 4px; border: 1px solid #E5E7EB; text-align: right; color: #666;">${inv.minLimit} ${inv.unit}</td>
            <td style="padding: 4px; border: 1px solid #E5E7EB; text-align: center;">
              <span style="display: inline-block; padding: 2px 6px; border-radius: 3px; font-weight: 700; font-size: 8px; text-transform: uppercase; background: ${inv.status === 'Optimal' ? '#D1FAE5; color: #065F46;' : inv.status === 'Running Low' ? '#FEF3C7; color: #92400E;' : '#FEE2E2; color: #991B1B;'}">
                ${inv.status}
              </span>
            </td>
          </tr>
        `).join('')}
      </table>

      <!-- Verification & Signature Sign-off -->
      <div style="border-top: 1px solid #D4AF37; margin-top: 20px; padding-top: 12px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 9px; color: #666;">
        <div>
          <p style="margin: 0;"><strong>System Certification:</strong> Auto-generated by OG Waffles POS Engine</p>
          <p style="margin: 2px 0 0 0;">All transactions, taxes, and raw material deductions are digitally cryptographically logged.</p>
        </div>

        <div style="text-align: center; border-top: 1px dashed #999; padding-top: 4px; width: 160px;">
          <p style="margin: 0; font-weight: 700; color: #111;">Authorized Signature</p>
          <p style="margin: 2px 0 0 0; color: #777;">Store Owner / Manager</p>
        </div>
      </div>
    </div>
  `;
}

/**
 * Immediate Trigger: Generates and downloads the 7-day PDF report
 */
async function downloadWeeklyReportPdf() {
  const btn = document.getElementById("btn-download-weekly-pdf");
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i class="fas fa-circle-notch fa-spin mr-1"></i> Generating PDF...`;
  }

  try {
    const data = compile7DayReportData();
    const htmlContent = buildReportPdfHtml(data);

    // Create temporary hidden container for rendering
    const tempContainer = document.createElement("div");
    tempContainer.id = "temp-pdf-container";
    tempContainer.style.position = "fixed";
    tempContainer.style.left = "-9999px";
    tempContainer.style.top = "0";
    tempContainer.style.width = "800px";
    tempContainer.innerHTML = htmlContent;
    document.body.appendChild(tempContainer);

    if (typeof html2pdf !== "undefined") {
      const opt = {
        margin: [8, 8, 8, 8],
        filename: `OG_Waffles_7Day_Report_${data.startDate}_to_${data.endDate}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
      };

      await html2pdf().set(opt).from(tempContainer).save();
    } else {
      // Fallback printable window
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`<html><head><title>OG Waffles 7-Day Report</title></head><body>${htmlContent}</body></html>`);
        printWindow.document.close();
        printWindow.print();
      }
    }

    document.body.removeChild(tempContainer);

    // Save summary into weekly archive
    if (typeof store !== "undefined") {
      if (!store.state.weeklyReportsArchive) store.state.weeklyReportsArchive = [];
      store.state.weeklyReportsArchive.unshift({
        id: data.reportId,
        startDate: data.startDate,
        endDate: data.endDate,
        generatedAt: data.generatedAt,
        grossRevenue: data.metrics.grossRevenue,
        netProfit: data.metrics.netProfit,
        totalOrders: data.metrics.totalOrders
      });
      if (store.state.weeklyReportsArchive.length > 20) {
        store.state.weeklyReportsArchive = store.state.weeklyReportsArchive.slice(0, 20);
      }
      store.logActivity("REPORTS", "WEEKLY_REPORT_DOWNLOADED", `Generated & downloaded 7-Day Business Report (${data.startDate} to ${data.endDate})`, "success");
      store.addNotification("Weekly Report Generated", `7-Day report (${data.startDate} to ${data.endDate}) downloaded successfully`, "info");
    }

  } catch (err) {
    console.error("[WeeklyReport] PDF Generation Error:", err);
    alert("Failed to generate PDF: " + err.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<i class="fas fa-file-pdf mr-1 text-red-400"></i> Download 7-Day PDF Report`;
    }
  }
}

/**
 * Background Scheduler: Automatically checks if 7 days have passed and exports report
 */
function checkAndAutoExportWeeklyReport() {
  const LAST_KEY = "ogw_last_weekly_pdf_export";
  const lastExport = localStorage.getItem(LAST_KEY);
  const now = Date.now();
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

  if (!lastExport) {
    // Set baseline if first time running
    localStorage.setItem(LAST_KEY, now.toString());
    return;
  }

  const elapsed = now - parseInt(lastExport, 10);
  if (elapsed >= SEVEN_DAYS_MS) {
    console.log("[WeeklyReport] 7 Days elapsed -> Triggering automated weekly PDF backup...");
    localStorage.setItem(LAST_KEY, now.toString());
    setTimeout(() => {
      downloadWeeklyReportPdf();
    }, 3000);
  }
}
