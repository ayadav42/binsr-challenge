interface ClientInfo {
  name: string;
  email: string;
  phone: string;
}

interface Inspector {
  name: string;
  email: string;
}

interface Address {
  fullAddress: string;
  street: string;
  city: string;
  state: string;
  zipcode: string;
}

interface Schedule {
  startTime: number;
}

interface Account {
  companyName: string;
  email: string;
  phoneNumber: string;
}

interface InspectionData {
  inspection: {
    clientInfo: ClientInfo;
    inspector: Inspector;
    address: Address;
    schedule: Schedule;
  };
  account: Account;
}

function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;

  return `${month}/${day}/${year} ${hours}:${minutes}${ampm}`;
}

function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function generateFirstPageHTML(data: InspectionData): string {
  const clientName = escapeHtml(data.inspection.clientInfo.name);
  const inspectionDateTime = formatDateTime(data.inspection.schedule.startTime);
  const propertyAddress = escapeHtml(data.inspection.address.fullAddress);
  const inspectorName = escapeHtml(data.inspection.inspector.name);
  const companyName = escapeHtml(data.account.companyName);
  const companyEmail = escapeHtml(data.account.email);
  const companyPhone = escapeHtml(data.account.phoneNumber);

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>PROPERTY INSPECTION REPORT FORM (TREC)</title>
    <style>
      /* Reset and base styles */
      * {
        box-sizing: border-box;
      }
      
      html,
      body {
        margin: 0;
        padding: 0;
        background: #fff;
      }
      
      body {
        font-family: 'Times New Roman', Times, serif;
        font-size: 14px;
        line-height: 1.2;
        color: #000;
      }
      
      /* Page container */
      .page {
        width: 816px;
        margin: 0 auto;
        background: #fff;
        padding: 16px 24px 14px;
      }
      
      /* Title */
      .title {
        text-align: center;
        font-weight: 900;
        font-size: 30px;
        margin: 0 0 12px;
        text-transform: uppercase;
        letter-spacing: normal;
      }
      
      /* Header section */
      .header-section {
        border: 3px solid #000;
        padding: 0 6px 22px;
        margin-bottom: 12px;
      }
      
      .header-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        column-gap: 24px;
        row-gap: 10px;
        margin-top: -4px;
      }
      
      .header-field {
        border-bottom: 1.4px solid #000;
        padding: 0;
        min-height: 34px;
        display: flex;
        align-items: flex-end;
        position: relative;
        padding-bottom: 0;
      }
      
      .header-field.col-span-2 {
        grid-column: span 2;
      }
      
      .header-field.col-span-3 {
        grid-column: span 3;
      }
      
      .header-field-value {
        width: 100%;
        font-size: 13.5px;
      }
      
      .header-field-label {
        position: absolute;
        left: 0;
        bottom: -16px;
        font-size: 12px;
        font-style: italic;
        color: #000;
        padding: 0;
      }
      
      /* Content sections */
      section {
        margin-top: 6px;
        margin-bottom: 12px;
      }
      
      section.purpose-section {
        margin-top: 6px;
        margin-bottom: 12px;
      }
      
      section.inspector-section {
        margin-top: 6px;
        margin-bottom: 12px;
      }
      
      h2 {
        font-size: 14px;
        text-transform: uppercase;
        font-weight: bold;
        margin: 0;
      }
      
      h2:first-of-type {
        margin-top: 0;
      }
      
      p {
        margin: 6px 0;
      }
      
      p.first-p {
        margin-top: 3px;
      }
      
      p.note {
        font-size: 13px;
        color: #000;
        margin: 6px 0 8px;
      }
      
      ul {
        margin-top: 0;
        margin-bottom: 6px;
        margin-left: 18px;
        padding: 0;
        list-style-type: disc;
      }
      
      ul.second-list {
        margin-top: 0;
        margin-bottom: 6px;
      }
      
      li {
        margin: 0;
        padding-left: 12px;
      }
      
      strong {
        font-weight: bold;
      }
      
      a {
        color: #000;
        text-decoration: underline;
      }
      
      /* Footer */
      footer {
        display: flex;
        gap: 8px;
        justify-content: space-between;
        align-items: center;
        border-top: 1px solid #000;
        margin-top: 12px;
        padding-top: 5px;
        font-size: 12px;
        color: #000;
      }
      
      /* Print styles */
      @media print {
        body {
          background: #fff;
        }
        .page {
          margin: 0;
          padding: 8px 12px;
        }
        /* Hide the HTML footer; Playwright will render the native footer */
        footer {
          display: none !important;
        }
      }
    </style>
  </head>
  <body>
    <div class="page" role="document" aria-label="TREC Property Inspection Report Form">
      <div class="title">
        PROPERTY INSPECTION REPORT FORM
      </div>

      <!-- Top information box -->
      <section class="header-section" aria-label="Report Header">
        <div class="header-grid">
          <!-- Row 1 -->
          <div class="header-field col-span-2">
            <div class="header-field-value">${clientName}</div>
            <div class="header-field-label">Name of Client</div>
          </div>
          <div class="header-field">
            <div class="header-field-value">${inspectionDateTime}</div>
            <div class="header-field-label">Date of Inspection</div>
          </div>

          <!-- Row 2 -->
          <div class="header-field col-span-3">
            <div class="header-field-value">${propertyAddress}</div>
            <div class="header-field-label">Address of Inspected Property</div>
          </div>

          <!-- Row 3 -->
          <div class="header-field col-span-2">
            <div class="header-field-value">${inspectorName}</div>
            <div class="header-field-label">Name of Inspector</div>
          </div>
          <div class="header-field">
            <div class="header-field-value">N/A</div>
            <div class="header-field-label">TREC License #</div>
          </div>

          <!-- Row 4 -->
          <div class="header-field col-span-2">
            <div class="header-field-value">N/A</div>
            <div class="header-field-label">Name of Sponsor (if applicable)</div>
          </div>
          <div class="header-field">
            <div class="header-field-value">N/A</div>
            <div class="header-field-label">TREC License #</div>
          </div>
        </div>
      </section>

      <!-- PURPOSE OF INSPECTION -->
      <section class="purpose-section">
        <h2>Purpose of Inspection</h2>
        <p class="first-p">
          A real estate inspection is a visual survey of a structure and a basic
          performance evaluation of the systems and components of a building. It
          provides information regarding the general condition of a residence at
          the time the inspection was conducted.
          <strong>It is important</strong> that you carefully read ALL of this
          information. Ask the inspector to clarify any items or comments that
          are unclear.
        </p>
      </section>

      <!-- RESPONSIBILITY OF THE INSPECTOR -->
      <section class="inspector-section">
        <h2>Responsibility of the Inspector</h2>
        <p class="first-p">
          This inspection is governed by the Texas Real Estate Commission (TREC)
          Standards of Practice (SOPs), which dictates the minimum requirements
          for a real estate inspection.
        </p>

        <p style="margin-top: 12px; margin-bottom: 0;">The inspector <strong>IS required</strong> to:</p>
        <ul>
          <li>
            use this Property Inspection Report form for the inspection;
          </li>
          <li>
            inspect only those components and conditions that are present,
            visible, and accessible at the time of the inspection;
          </li>
          <li>
            indicate whether each item was inspected, not inspected, or not
            present;
          </li>
          <li>
            indicate an item as Deficient (D) if a condition exists that
            adversely and materially affects the performance of a system or
            component <strong>OR</strong> constitutes a hazard to life, limb or
            property as specified by the SOPs; and
          </li>
          <li>
            explain the inspector's findings in the corresponding section in the
            body of the report form.
          </li>
        </ul>

        <p style="margin-top: 12px; margin-bottom: 0;">The inspector <strong>IS NOT required</strong> to:</p>
        <ul class="second-list">
          <li>identify all potential hazards;</li>
          <li>
            turn on decommissioned equipment, systems, utilities, or apply an
            open flame or light a pilot to operate any appliance;
          </li>
          <li>
            climb over obstacles, move furnishings or stored items;
          </li>
          <li>
            prioritize or emphasize the importance of one deficiency over
            another;
          </li>
          <li>
            provide follow-up services to verify that proper repairs have been
            made; or
          </li>
          <li>
            inspect any system or component listed under the optional section of
            the SOPs (22 TAC 535.233).
          </li>
        </ul>
      </section>

      <!-- RESPONSIBILITY OF THE CLIENT -->
      <section>
        <h2 style="margin: 14px 0 5px;">Responsibility of the Client</h2>
        <p>
          While items identified as Deficient (D) in an inspection report DO NOT
          obligate any party to make repairs or take other actions, in the event
          that any further evaluations are needed, it is the responsibility of
          the client to obtain further evaluations and/or cost estimates from
          qualified service professionals regarding any items reported as
          Deficient (D). It is recommended that any further evaluations and/or
          cost estimates take place prior to the expiration of any contractual
          time limitations, such as option periods.
        </p>
        <p class="note">
          <strong>Please Note:</strong> Evaluations performed by service
          professionals in response to items reported as Deficient (D) on the
          report may lead to the discovery of additional deficiencies that were
          not present, visible, or accessible at the time of the inspection. Any
          repairs made after the date of the inspection may render information
          contained in this report obsolete or invalid.
        </p>
      </section>

      <!-- REPORT LIMITATIONS -->
      <section>
        <h2 style="margin: 14px 0 5px;">Report Limitations</h2>
        <p>
          This report is provided for the benefit of the named client and is
          based on observations made by the named inspector on the date the
          inspection was performed (indicated above).
        </p>
        <p>
          ONLY those items specifically noted as being inspected on the report
          were inspected.
        </p>
        <p style="margin-top: 6px; margin-bottom: 0;">This inspection is NOT:</p>
        <ul>
          <li>
            a technically exhaustive inspection of the structure, its systems,
            or its components and may not reveal all deficiencies;
          </li>
          <li>
            an inspection to verify compliance with any building codes;
          </li>
          <li>
            an inspection to verify compliance with manufacturer's installation
            instructions for any system or component; and DOES NOT
          </li>
          <li>
            imply insurability or warrantability of the structure or its
            components.
          </li>
        </ul>
      </section>

      <!-- Footer -->
      <footer role="contentinfo">
        <div>REI 7-6 (8/9/2021)</div>
        <div>
          Promulgated by the Texas Real Estate Commission • (512) 936-3000 •
          <a href="https://www.trec.texas.gov">www.trec.texas.gov</a>
        </div>
      </footer>
    </div>
  </body>
</html>`;
}
