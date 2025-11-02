interface Photo {
  id: string;
  url: string;
  caption?: string | null;
  description?: string | null;
}

interface Video {
  id: string;
  url: string;
  caption?: string | null;
  description?: string | null;
}

interface Comment {
  id: string;
  label: string;
  text: string;
  content: string;
  commentText: string;
  type: string;
  inputType: string;
  options: string[];
  selectedOptions: string[];
  location: string;
  tag: string;
  isFlagged: boolean;
  commentNumber: string;
  photos: Photo[];
  videos: Video[];
  recommendation?: string | null;
}

interface LineItem {
  id: string;
  name: string;
  title: string;
  inspectionStatus: string | null;
  comments: Comment[];
  media: any[];
}

interface Section {
  id: string;
  name: string;
  sectionNumber: string;
  order: number;
  lineItems: LineItem[];
}

interface Address {
  fullAddress: string;
  street: string;
  city: string;
  state: string;
  zipcode: string;
}

interface Schedule {
  date: number;
}

interface Account {
  companyName: string;
  email: string;
  phoneNumber: string;
}

interface InspectionData {
  inspection: {
    address: Address;
    schedule: Schedule;
    sections: Section[];
  };
  account: Account;
}

export type { InspectionData };

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

function getAlphaLabel(index: number): string {
  return String.fromCharCode(65 + index); // A, B, C, ...
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatTextWithParagraphs(text: string): string {
  // Split text by newlines and create separate paragraphs
  const paragraphs = text.split('\n').filter((p) => p.trim().length > 0);
  return paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join('\n      ');
}

function generateCheckboxes(status: string | null): string {
  const statuses = ['I', 'NI', 'NP', 'D'];
  return statuses
    .map(
      (s) =>
        `<input class="chk" type="checkbox" ${
          status === s ? 'checked' : ''
        } aria-label="${
          s === 'I'
            ? 'Inspected'
            : s === 'NI'
            ? 'Not Inspected'
            : s === 'NP'
            ? 'Not Present'
            : 'Deficient'
        }" />`
    )
    .join('\n          ');
}

function generateChecklistComment(comment: Comment): string {
  if (comment.inputType !== 'checklist' || !comment.options.length) {
    return '';
  }

  const checkboxes = comment.options
    .map((option) => {
      const isSelected = comment.selectedOptions.includes(option);
      return `
        <div class="checklist-item">
          <input class="chk" type="checkbox" ${
            isSelected ? 'checked' : ''
          } aria-label="${escapeHtml(option)}" />
          <span>${escapeHtml(option)}</span>
        </div>`;
    })
    .join('');

  return `
    <div class="comment-block">
      <p><span class="label">${escapeHtml(comment.label)}:</span></p>
      <div class="checklist-group">
        ${checkboxes}
      </div>
    </div>`;
}

function generateStandardComment(comment: Comment): string {
  const textContent = comment.text || comment.content || comment.commentText;

  let html = `
    <div class="comment-block">
      <p><span class="label">${escapeHtml(comment.label)}:</span></p>
      ${formatTextWithParagraphs(textContent)}`;

  if (comment.location) {
    html += `
      <p><strong>Location:</strong> ${escapeHtml(comment.location)}</p>`;
  }

  html += `
    </div>`;

  return html;
}

function generateMediaSection(comment: Comment): string {
  const photos = comment.photos || [];
  const videos = comment.videos || [];

  if (photos.length === 0 && videos.length === 0) {
    return '';
  }

  let html = '';

  // Photos
  if (photos.length > 0) {
    html += `
    <div class="media-row">`;
    photos.forEach((photo) => {
      const caption = photo.caption || photo.description || '';
      html += `
      <div class="media-item">
        <img src="${escapeHtml(photo.url)}" alt="${escapeHtml(caption)}" />
        ${
          caption
            ? `<div class="media-caption">${escapeHtml(caption)}</div>`
            : ''
        }
      </div>`;
    });
    html += `
    </div>`;
  }

  // Videos - render as clickable thumbnails for PDF compatibility
  if (videos.length > 0) {
    html += `
    <div class="media-row">`;
    videos.forEach((video) => {
      const caption = video.caption || video.description || '';
      html += `
      <div class="media-item">
        <a href="${escapeHtml(
          video.url
        )}" target="_blank" class="video-link" title="Click to watch video">
          <div class="video-thumbnail">
            <video src="${escapeHtml(video.url)}"></video>
            <div class="play-button-overlay">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="60" height="60">
                <circle cx="12" cy="12" r="12" fill="rgba(0,0,0,0.7)"/>
                <polygon points="9,6 9,18 18,12" fill="white"/>
              </svg>
            </div>
          </div>
        </a>
        ${
          caption
            ? `<div class="media-caption">${escapeHtml(caption)}</div>`
            : ''
        }
      </div>`;
    });
    html += `
    </div>`;
  }

  return html;
}

function generateLineItemContent(lineItem: LineItem, index: number): string {
  const alphaLabel = getAlphaLabel(index);
  const checkboxes = generateCheckboxes(lineItem.inspectionStatus);

  let html = `
      <div class="line-item-header">
        <div class="checkbox-row">
            <div class="checkbox-group">
                ${checkboxes}
            </div>
            <div class="alpha-title">${alphaLabel}. ${escapeHtml(
    lineItem.title || lineItem.name
  )}
            </div>
        </div>
      </div>`;

  if (lineItem.comments && lineItem.comments.length > 0) {
    html += `
      <div class="subhead-main">`;

    lineItem.comments.forEach((comment) => {
      // Generate comment text
      if (comment.inputType === 'checklist' && comment.options.length > 0) {
        html += generateChecklistComment(comment);
      } else {
        html += generateStandardComment(comment);
      }

      // Generate media section (photos/videos)
      html += generateMediaSection(comment);
    });

    html += `
      </div>`;
  }

  return html;
}

export function generateHTML(data: InspectionData): string {
  const address = data.inspection.address.fullAddress;
  const inspectionDate = formatDate(data.inspection.schedule.date);
  const companyName = data.account.companyName;
  const companyEmail = data.account.email;
  const companyPhone = data.account.phoneNumber;

  let sectionsHTML = '';

  data.inspection.sections.forEach((section) => {
    sectionsHTML += `
      <div class="section-container">
        <div class="sec-title">${section.sectionNumber}. ${escapeHtml(
      section.name
    ).toUpperCase()}</div>
`;

    section.lineItems.forEach((lineItem, index) => {
      sectionsHTML += generateLineItemContent(lineItem, index);
    });

    sectionsHTML += `
      </div>`;
  });

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>TREC Inspection Report</title>
    <style>
      :root {
        --page-w: 816px; /* ~US Letter width at 96dpi */
        --ink: #000;
        --muted: #000;
        --rule: #000;
      }
      * {
        box-sizing: border-box;
      }
      html,
      body {
        margin: 0;
        padding: 0;
        background: #fff;
        color: var(--ink);
      }
      body {
        font: 14px/1.45 'Times New Roman', Times, serif;
      }

      .page {
        width: var(--page-w);
        margin: 20px auto;
        background: #fff;
        padding: 16px 24px 14px;
      }

      .top-id {
        font-size: 13.5px;
        text-align: left;
        margin-left: 15px;
        margin-bottom: 4px;
      }
      .legend {
        text-align: left;
        font-size: 13.5px;
        margin: 5px 2px;
        padding: 1px 6px;
        display: flex;
        justify-content: flex-start;
        gap: 50px;
      }

      .legend-box {
        text-align: left;
        font-size: 13.5px;
        margin: 2px 0;
        padding: 0px 6px;
        border: 2.5px solid var(--ink);
        display: flex;
        justify-content: flex-start;
        gap: 15px;
      }
      .legend-box-item {
        white-space: nowrap;
      }

      /* Section headings */
      .sec-title {
        text-align: center;
        font-size: 16px;
        font-weight: 800;
        text-transform: uppercase;
        margin: 12px 0 10px 0;
        letter-spacing: 0.2px;
        page-break-after: avoid;
        break-after: avoid;
      }
      
      /* Add top margin to first section in print to avoid header overlap */
      @media print {
        .section-container:first-child .sec-title {
          margin-top: 0;
        }
      }

      /* Line item header - keep together with checkbox */
      .line-item-header {
        page-break-inside: avoid;
        break-inside: avoid;
        page-break-after: avoid;
        break-after: avoid;
        margin-top: 0;
      }

      /* Checkbox row with subsection title */
      .checkbox-row {
        display: grid;
        grid-template-columns: auto 1fr;
        margin: 10px 4px;
        gap: 20px;
        page-break-inside: avoid;
        break-inside: avoid;
      }

      .checkbox-group {
        display: flex;
        gap: 14px;
        align-items: center;
      }

      /* Real checkboxes with consistent PDF look */
      .chk {
        width: 14px;
        height: 14px;
        appearance: none;
        -webkit-appearance: none;
        -moz-appearance: none;
        border: 1.5px solid #000;
        display: inline-block;
        vertical-align: middle;
        margin: 0;
        position: relative;
        flex-shrink: 0;
      }
      .chk:checked::after {
        content: '✕';
        position: absolute;
        inset: -2px 0.5px;
        font-size: 14px;
        line-height: 14px;
        display: block;
        text-align: center;
      }

      .alpha-title {
        font-weight: 800;
        font-size: 14px;
      }

      .subhead-main {
        display: block;
        margin-left: calc(
          14px * 4 + 14px * 3 + 20px
        ); /* 4 checkboxes + 3 gaps + grid gap */
      }

      .comment-block {
        margin: 8px 0;
        page-break-inside: auto;
        break-inside: auto;
      }

      .label {
        font-style: italic;
        font-weight: 600;
      }
      
      p {
        margin: 6px 0 8px;
        widows: 2;
        orphans: 2;
      }

      /* Checklist styling */
      .checklist-group {
        margin: 8px 0;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .checklist-item {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      /* Media styling */
      .media-row {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin: 12px 0;
        page-break-inside: avoid;
        break-inside: avoid;
      }

      .media-item {
        max-width: 300px;
        page-break-inside: avoid;
        break-inside: avoid;
      }

      .media-item img,
      .media-item video {
        max-width: 100%;
        height: auto;
        border: 1px solid #ccc;
        display: block;
      }

      /* Video link styles for clickable thumbnails */
      .video-link {
        display: block;
        text-decoration: none;
        position: relative;
        cursor: pointer;
      }

      .video-thumbnail {
        position: relative;
        display: inline-block;
        max-width: 100%;
      }

      .video-thumbnail video {
        display: block;
        pointer-events: none;
      }

      .play-button-overlay {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        pointer-events: none;
        opacity: 0.9;
      }

      .video-link:hover .play-button-overlay {
        opacity: 1;
      }

      .media-caption {
        font-size: 12px;
        font-style: italic;
        color: #666;
        margin-top: 4px;
      }

      .footer {
        margin-top: 14px;
        text-align: center;
        font-size: 13px;
      }
      
      .bottom-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 12.5px;
        border-top: 1px solid var(--rule);
        padding-top: 6px;
        margin-top: 6px;
      }
      
      .bottom-bar a {
        color: #000;
        text-decoration: underline;
      }

      /* Print specific styles */
      @media print {
        body {
          background: #fff;
        }
        .page {
          margin: 0;
          box-shadow: none;
          /* Add padding to match Playwright's header/footer space */
          padding: 8px 12px;
        }
        
        /* Hide the on-screen header/legend from print; Playwright will render the native header/footer */
        .top-id,
        .legend,
        .legend-box,
        .footer {
          display: none !important;
        }
      }
    </style>
  </head>
  <body>
    <div class="page" role="document" aria-label="TREC Report Page">
      <div class="top-id">
        Report Identification: ${escapeHtml(address)} - ${inspectionDate}
      </div>
      <div class="legend">
        <span class="legend-item"><strong>I=Inspected</strong></span>
        <span class="legend-item"><strong>NI=Not Inspected</strong></span>
        <span class="legend-item"><strong>NP=Not Present</strong></span>
        <span class="legend-item"><strong>D=Deficient</strong></span>
      </div>
      <div class="legend-box">
        <span class="legend-box-item"><strong>I</strong></span>
        <span class="legend-box-item"><strong>NI</strong></span>
        <span class="legend-box-item"><strong>NP</strong></span>
        <span class="legend-box-item"><strong>D</strong></span>
      </div>

      ${sectionsHTML}

      <div class="footer">
        <div class="bottom-bar">
          <div>${escapeHtml(companyName)} • ${escapeHtml(companyPhone)}</div>
          <div>${escapeHtml(companyEmail)}</div>
        </div>
      </div>
    </div>
  </body>
</html>`;
}
