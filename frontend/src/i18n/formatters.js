/**
 * Localization formatters for dynamic database / engine feed content.
 */

export function formatMarketEvent(eventText, locale) {
  if (!eventText || locale !== 'id') {
    return eventText;
  }

  // 1. "Competitor slashed price by 23%. Demand for Product Y is rapidly dropping."
  const slashedMatch = eventText.match(
    /Competitor slashed price by (\d+(?:\.\d+)?%)\.\s*Demand for (.+?) is rapidly dropping\./i
  );
  if (slashedMatch) {
    return `Pesaing memangkas harga sebesar ${slashedMatch[1]}. Permintaan untuk ${slashedMatch[2]} menurun drastis.`;
  }

  // 2. "Flash sale by rival supplier on USB-C accessories. Market price undercut detected."
  const flashSaleMatch = eventText.match(
    /Flash sale by rival supplier on (.+?)\.\s*Market price undercut detected\./i
  );
  if (flashSaleMatch) {
    let item = flashSaleMatch[1];
    if (/USB-C accessories/i.test(item)) {
      item = 'aksesori USB-C';
    } else {
      item = item.replace(/accessories/i, 'aksesori');
    }
    return `Penjualan kilat oleh pemasok pesaing untuk ${item}. Pemotongan harga pasar terdeteksi.`;
  }

  let translated = eventText;
  translated = translated.replace(/Market price undercut detected/gi, 'Pemotongan harga pasar terdeteksi');
  translated = translated.replace(/Competitor slashed price by/gi, 'Pesaing memangkas harga sebesar');
  translated = translated.replace(/Flash sale by rival supplier on/gi, 'Penjualan kilat oleh pemasok pesaing untuk');

  return translated;
}

export function formatDecisionEngineAction(actionText, locale) {
  if (!actionText || locale !== 'id') {
    return actionText;
  }

  // 1. "Competitor is undercutting by $30.00. ML Elasticity Model recommends an automated counter-measure."
  const undercutMatch = actionText.match(
    /Competitor is undercutting by \$?([0-9.,]+)\.\s*ML Elasticity Model recommends an automated counter-measure\./i
  );
  if (undercutMatch) {
    return `Pesaing memotong harga sebesar $${undercutMatch[1]}. Model Elastisitas ML merekomendasikan tindakan balasan otomatis.`;
  }

  // 2. "Monitor market position."
  if (/Monitor market position/i.test(actionText)) {
    return 'Pantau posisi pasar.';
  }

  // 3. "Recommended Action: Price-matching rule (-$30.00) and promotion queued for execution."
  const recMatch = actionText.match(
    /Recommended Action:\s*Price-matching rule \(-?\$?([0-9.,]+)\)\s*and promotion queued for execution\./i
  );
  if (recMatch) {
    return `Tindakan yang Disarankan: Aturan penyesuaian harga (-$${recMatch[1]}) dan promosi dimasukkan ke antrean eksekusi.`;
  }

  // 4. "Pending manual review or autonomous execution."
  if (/Pending manual review or autonomous execution/i.test(actionText)) {
    return 'Menunggu tinjauan manual atau eksekusi otomatis.';
  }

  return actionText;
}

export function formatAuditActionType(actionType, locale) {
  if (!actionType || locale !== 'id') {
    return actionType;
  }

  switch (actionType) {
    case 'PRICE_MATCH_AUTOMATION':
      return 'OTOMATISASI PENCOCOKAN HARGA';
    case 'CRITICAL_STOCKOUT_EMERGENCY':
      return 'DARURAT KEHABISAN STOK KRITIS';
    default:
      return actionType;
  }
}

export function formatAuditDescription(description, locale) {
  if (!description || locale !== 'id') {
    return description;
  }

  // 1. "Autonomous Procedure EXECUTED: Dispatched price-matching rule (-$10.00) & queued targeted promotion campaign."
  const priceMatchLog = description.match(
    /Autonomous Procedure EXECUTED:\s*Dispatched price-matching rule \(-?\$?([0-9.,]+)\)\s*&?\s*queued targeted promotion campaign\.?/i
  );
  if (priceMatchLog) {
    return `Prosedur Otomatis DIEKSEKUSI: Mengirimkan aturan pencocokan harga (-$${priceMatchLog[1]}) & memasukkan kampanye promosi terarah ke antrean.`;
  }

  // 2. "Autonomous Procedure EXECUTED: Dispatched emergency replenishment reorder for zero-stock SKU (Product Y (Smart Hub))."
  const stockoutLog = description.match(
    /Autonomous Procedure EXECUTED:\s*Dispatched emergency replenishment reorder for zero-stock SKU \((.+)\)\.?$/i
  );
  if (stockoutLog) {
    return `Prosedur Otomatis DIEKSEKUSI: Mengirimkan pemesanan ulang darurat untuk SKU dengan stok nol (${stockoutLog[1]}).`;
  }

  if (description.startsWith('Autonomous Procedure EXECUTED:')) {
    return description.replace('Autonomous Procedure EXECUTED:', 'Prosedur Otomatis DIEKSEKUSI:');
  }

  return description;
}

export function formatAuditStatus(status, locale) {
  if (!status || locale !== 'id') {
    return status;
  }

  const upper = status.toUpperCase();
  if (upper === 'EXECUTED') return 'DIEKSEKUSI';
  if (upper === 'PENDING') return 'MENUNGGU';
  if (upper === 'FAILED') return 'GAGAL';
  if (upper === 'SUCCESS') return 'BERHASIL';

  return status;
}

export function formatRulesMessage(message, locale) {
  if (!message || locale !== 'id') {
    return message;
  }

  const execMatch = message.match(/Successfully executed (\d+) autonomous actions\.?/i);
  if (execMatch) {
    return `Berhasil menjalankan ${execMatch[1]} tindakan otomatis.`;
  }

  if (/Rules evaluated successfully\.?/i.test(message)) {
    return 'Aturan berhasil dievaluasi.';
  }

  if (/Failed to execute autonomous actions\.?/i.test(message) || /Failed to execute rules\.?/i.test(message)) {
    return 'Gagal menjalankan tindakan otomatis.';
  }

  return message;
}

export function formatRecommendation(recommendation, locale) {
  if (!recommendation || locale !== 'id') {
    return recommendation;
  }

  const reorderMatch = recommendation.match(/ML Recommended reorder:\s*(\d+)\s*units?/i);
  if (reorderMatch) {
    return `Pemesanan ulang rekomendasi ML: ${reorderMatch[1]} unit`;
  }

  if (/Maintain current pricing structure\. Market position stable\.?/i.test(recommendation)) {
    return 'Pertahankan struktur harga saat ini. Posisi pasar stabil.';
  }

  const autoMatch = recommendation.match(
    /AUTONOMOUS MATCH — Competitor undercuts by \$([0-9.,]+)\. Safe margin preserved \(([0-9.,]+%)\)\. Price-match rule execution authorized\.?/i
  );
  if (autoMatch) {
    return `PENCOCOKAN OTOMATIS — Pesaing memotong harga sebesar $${autoMatch[1]}. Margin aman terjaga (${autoMatch[2]}). Eksekusi aturan pencocokan harga diizinkan.`;
  }

  const exceedMatch = recommendation.match(
    /EXCEED PRICE MATCH — Competitor undercut \(\$([0-9.,]+)\) drives margin to ([0-9.,]+%) \(below 15% safety floor\)\. Price held; demand drops due to substitution\. Recommend targeted bundling\.?/i
  );
  if (exceedMatch) {
    return `MELEBIHI PENCOCOKAN HARGA — Pemotongan harga pesaing ($${exceedMatch[1]}) menurunkan margin ke ${exceedMatch[2]} (di bawah batas aman 15%). Harga dipertahankan; permintaan menurun karena substitusi. Rekomendasi paket bundling.`;
  }

  return recommendation;
}

