const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

// Brand colors (for reference; actual styles live in the HTML template)
const BRAND_COLORS = {
  yellow: '#F7C948',
  blue: '#1E40AF',
  navy: '#0E3A8A',
  text: '#1E293B'
};

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadBase64(filePath, mimeType) {
  try {
    if (!fs.existsSync(filePath)) return '';
    const buf = fs.readFileSync(filePath);
    return `data:${mimeType};base64,${buf.toString('base64')}`;
  } catch (err) {
    console.warn(`contractGenerator: failed to load asset ${filePath}:`, err.message);
    return '';
  }
}

function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const day = d.getDate();
  const month = d.toLocaleString('en-GB', { month: 'long' });
  const year = d.getFullYear();
  const suffix = (n) => {
    if (n > 3 && n < 21) return 'th';
    const r = n % 10;
    if (r === 1) return 'st';
    if (r === 2) return 'nd';
    if (r === 3) return 'rd';
    return 'th';
  };
  return `${day}${suffix(day)} ${month} ${year}`;
}

function formatCurrency(amount) {
  if (amount === null || amount === undefined || amount === '') return '0';
  const n = Number(amount);
  if (Number.isNaN(n)) return String(amount);
  return n.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function calculateDuration(startDate, endDate) {
  if (!startDate || !endDate) return '';
  const s = new Date(startDate);
  const e = new Date(endDate);
  const diff = e - s;
  if (Number.isNaN(diff) || diff <= 0) return '';
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return String(days);
}

function safeGet(obj, pathStr, fallback = '') {
  return pathStr.split('.').reduce(
    (acc, key) => (acc && Object.prototype.hasOwnProperty.call(acc, key) ? acc[key] : undefined),
    obj
  ) ?? fallback;
}

function applyTemplate(html, replacements) {
  let out = html;
  for (const [key, value] of Object.entries(replacements)) {
    const safe = value == null ? '' : String(value);
    const re = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    out = out.replace(re, safe);
  }
  return out;
}

/**
 * Generate a contract PDF using Puppeteer and an HTML template.
 *
 * Supports:
 *   - generateContractPDF(contractDataObject)
 *   - generateContractPDF(rental, customer, vehicle)
 *
 * @param {Object} rentalOrData
 * @param {Object} [customer]
 * @param {Object} [vehicle]
 * @returns {Promise<string>} absolute path to generated PDF
 */
async function generateContractPDF(rentalOrData, customer, vehicle) {
  let rental;

  // Backwards compatible: a single flattened contract data object
  if (!customer && !vehicle && rentalOrData && typeof rentalOrData === 'object') {
    const d = rentalOrData;
    rental = d;
    customer = {
      name: d.customer_name,
      phone: d.customer_phone,
      email: d.customer_email,
      ID_number: d.customer_id_number || d.customer_national_id,
      address: d.customer_address
    };
    vehicle = {
      make: d.vehicle_make,
      model: d.vehicle_model,
      year: d.vehicle_year,
      license_plate: d.vehicle_license_plate,
      color: d.vehicle_color,
      fuel_type: d.vehicle_fuel_type
    };
  } else {
    rental = rentalOrData || {};
    customer = customer || {};
    vehicle = vehicle || {};
  }

  const contractsDir = path.join(__dirname, '..', 'contracts');
  ensureDir(contractsDir);

  const contractId = rental.rental_id || rental._id || `RENT${Date.now()}`;
  const outputPath = path.join(contractsDir, `contract_${contractId}.pdf`);

  // DEBUG: Show base paths and discover actual logo/signature locations
  console.log('[ContractGenerator] __dirname:', __dirname);
  console.log('[ContractGenerator] __filename:', __filename);

  const logoPath1 = path.join(__dirname, '../assets/logo.png');
  const logoPath2 = path.join(__dirname, '..', 'assets', 'logo.png');
  const logoPath3 = path.resolve(__dirname, '../assets/logo.png');

  console.log('[ContractGenerator] Trying logoPath1:', logoPath1);
  console.log('[ContractGenerator] logoPath1 exists:', fs.existsSync(logoPath1));

  console.log('[ContractGenerator] Trying logoPath2:', logoPath2);
  console.log('[ContractGenerator] logoPath2 exists:', fs.existsSync(logoPath2));

  console.log('[ContractGenerator] Trying logoPath3:', logoPath3);
  console.log('[ContractGenerator] logoPath3 exists:', fs.existsSync(logoPath3));

  const parentDir = path.join(__dirname, '..');
  console.log('[ContractGenerator] Parent directory:', parentDir);
  try {
    console.log('[ContractGenerator] Contents of parent:', fs.readdirSync(parentDir));
  } catch (e) {
    console.error('[ContractGenerator] Error reading parent directory:', e);
  }

  const assetsDir = path.join(__dirname, '../assets');
  console.log('[ContractGenerator] Assets directory:', assetsDir);
  console.log('[ContractGenerator] Assets exists:', fs.existsSync(assetsDir));
  if (fs.existsSync(assetsDir)) {
    try {
      console.log('[ContractGenerator] Contents of assets:', fs.readdirSync(assetsDir));
    } catch (e) {
      console.error('[ContractGenerator] Error reading assets directory:', e);
    }
  }

  // Use logoPath2/signaturePath2 as the canonical paths
  const logoPath = logoPath2;

  let logoBase64 = '';
  if (fs.existsSync(logoPath)) {
    try {
      const logoBuffer = fs.readFileSync(logoPath);
      console.log('[ContractGenerator] Logo buffer size:', logoBuffer.length);
      logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
      console.log('[ContractGenerator] Logo base64 length:', logoBase64.length);
      console.log('[ContractGenerator] Logo base64 preview:', logoBase64.substring(0, 50));
    } catch (error) {
      console.error('[ContractGenerator] Error reading logo:', error);
    }
  }

  const signaturePath1 = path.join(__dirname, '../assets/signature.png');
  const signaturePath2 = path.join(__dirname, '..', 'assets', 'signature.png');
  const signaturePath3 = path.resolve(__dirname, '../assets/signature.png');

  console.log('[ContractGenerator] Trying signaturePath1:', signaturePath1);
  console.log('[ContractGenerator] signaturePath1 exists:', fs.existsSync(signaturePath1));

  console.log('[ContractGenerator] Trying signaturePath2:', signaturePath2);
  console.log('[ContractGenerator] signaturePath2 exists:', fs.existsSync(signaturePath2));

  console.log('[ContractGenerator] Trying signaturePath3:', signaturePath3);
  console.log('[ContractGenerator] signaturePath3 exists:', fs.existsSync(signaturePath3));

  const signaturePath = signaturePath2;

  let signatureBase64 = '';
  if (fs.existsSync(signaturePath)) {
    try {
      const signatureBuffer = fs.readFileSync(signaturePath);
      console.log('[ContractGenerator] Signature buffer size:', signatureBuffer.length);
      signatureBase64 = `data:image/png;base64,${signatureBuffer.toString('base64')}`;
      console.log('[ContractGenerator] Signature base64 length:', signatureBase64.length);
      console.log('[ContractGenerator] Signature base64 preview:', signatureBase64.substring(0, 50));
    } catch (error) {
      console.error('[ContractGenerator] Error reading signature:', error);
    }
  }

  // Load HTML template
  const templatePath = path.join(__dirname, '..', 'templates', 'contractTemplate.html');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Contract template not found at ${templatePath}`);
  }
  const templateHtml = fs.readFileSync(templatePath, 'utf8');

  // Company information
  const companyName = process.env.COMPANY_NAME || 'The Ressey Tours & Car Hire Company';
  const companyAddress = process.env.COMPANY_ADDRESS || 'Nairobi-Muthaiga Square Block B';
  const companyEmail = process.env.COMPANY_EMAIL || 'ressytourscarhire@gmail.com';
  const companyPhone1 = process.env.COMPANY_PHONE_1 || '0727347926';
  const companyPhone2 = process.env.COMPANY_PHONE_2 || '0725997121';
  const directorName = process.env.DIRECTOR_NAME || 'Rebecca Wanja Kamau';
  const directorPosition = process.env.DIRECTOR_POSITION || 'Director Ressey Tours';

  // Assets (icons via helper, logo/signature via debug block above)
  const iconPhone = loadBase64(path.join(__dirname, '..', 'assets', 'icons', 'phone.png'), 'image/png');
  const iconLocation = loadBase64(path.join(__dirname, '..', 'assets', 'icons', 'location.png'), 'image/png');
  const iconCalendar = loadBase64(path.join(__dirname, '..', 'assets', 'icons', 'calendar.png'), 'image/png');

  const vehicleName = `${safeGet(vehicle, 'make', '')} ${safeGet(vehicle, 'model', '')}`.trim() || 'Vehicle';

  const startDate = rental.start_date || rental.pickup_date;
  const endDate = rental.end_date || rental.return_date;

  const replacements = {
    // header basics
    contract_id: contractId,
    issue_date: formatDate(rental.booking_date || new Date()),

    company_name: companyName,
    company_address: companyAddress,
    company_email: companyEmail,
    company_phone1: companyPhone1,
    company_phone2: companyPhone2,

    // hirer
    customer_name: safeGet(customer, 'name', safeGet(rental, 'customer_name', '')),
    customer_phone: safeGet(customer, 'phone', safeGet(rental, 'customer_phone', '')),
    customer_email: safeGet(customer, 'email', safeGet(rental, 'customer_email', '')),
    customer_id_number: safeGet(customer, 'ID_number', safeGet(rental, 'customer_id_number', '')),
    customer_address: safeGet(customer, 'address', safeGet(rental, 'customer_address', '')),

    // vehicle
    vehicle_name: vehicleName,
    vehicle_reg: safeGet(vehicle, 'license_plate', safeGet(rental, 'vehicle_license_plate', '')),
    vehicle_year: safeGet(vehicle, 'year', safeGet(rental, 'vehicle_year', '')),
    vehicle_color: safeGet(vehicle, 'color', safeGet(rental, 'vehicle_color', '')),
    vehicle_fuel_type: safeGet(vehicle, 'fuel_type', safeGet(rental, 'vehicle_fuel_type', '')),

    // rental summary
    start_date: formatDate(startDate),
    end_date: formatDate(endDate),
    duration: rental.duration_days || calculateDuration(startDate, endDate),
    destination: safeGet(rental, 'destination', ''),
    daily_rate: formatCurrency(rental.daily_rate || safeGet(rental, 'daily_rate', 0)),
    total_amount: formatCurrency(rental.total_fee_gross || safeGet(rental, 'total_fee_gross', 0)),

    // signatures
    director_name: directorName,
    director_position: directorPosition,

    // icons & logo
    logoBase64,
    signatureBase64,
    icon_phone: iconPhone,
    icon_location: iconLocation,
    icon_calendar: iconCalendar
  };

  const html = applyTemplate(templateHtml, replacements);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Set content and wait for DOM + network to be idle
    await page.setContent(html, {
      waitUntil: ['networkidle0', 'domcontentloaded']
    });

    // Explicitly wait for all images (including base64) to finish loading
    await page.evaluate(() => {
      const images = Array.from(document.images || []);
      return Promise.all(
        images.map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        })
      );
    });

    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '80px',
        bottom: '80px',
        left: '40px',
        right: '40px'
      },
      displayHeaderFooter: true,
      headerTemplate: `<div style="font-size:10px; width:100%; text-align:right; padding:10px 24px 0 24px; font-family: Arial, Helvetica, sans-serif; color:#555555;">
  Ressey Tours &amp; Car Hire &nbsp;|&nbsp; Contract ID: ${contractId}
</div>`,
      footerTemplate: `<div style="font-size:10px; width:100%; text-align:center; padding:10px 24px; font-family: Arial, Helvetica, sans-serif; color:#666666;">
  Page <span class="pageNumber"></span> of <span class="totalPages"></span>
</div>`
    });
  } finally {
    await browser.close();
  }

  return outputPath;
}

module.exports = {
  generateContractPDF
};

