export interface AnomalyRegion {
  id: string;
  name: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: 'Pixel/ELA' | 'Noise' | 'Typography' | 'Metadata' | 'PDF Structure';
  box: { x: number; y: number; width: number; height: number }; // percentage 0-100
  technicalDetail: string;
  laypersonExplanation: string;
  confidence: number; // 0-100
}

export interface EvidenceCase {
  id: string;
  title: string;
  category: 'Payment Proof' | 'Chat Conversation' | 'Document & Invoice' | 'ID & Credential' | 'Authentic Photo';
  filename: string;
  fileSize: string;
  mimeType: string;
  dimensions: string;
  verdict: 'HIGH_RISK' | 'CRITICAL' | 'SUSPICIOUS' | 'AUTHENTIC';
  trustScore: number; // 0-100
  tamperProbability: number; // 0-100
  summaryLayperson: string;
  keyWarningSigns: string[];
  recommendedAction: string;
  hashes: {
    sha256: string;
    sha3_256: string;
  };
  timestampAuthority: {
    rfc3161Token: string;
    tsaProvider: string;
    timestamp: string;
    signatureAlgorithm: string;
    signatureValid: boolean;
  };
  scores: {
    visualPurity: number;
    noiseConsistency: number;
    typographicAlignment: number;
    metadataIntegrity: number;
  };
  metadata: {
    softwareDetected?: string;
    creationDate?: string;
    modificationDate?: string;
    deviceModel?: string;
    colorSpace: string;
    compressionHistory?: string;
    exifNotes: string[];
  };
  anomalies: AnomalyRegion[];
  previewType: 'payment' | 'chat' | 'invoice' | 'idcard' | 'photo';
}

export const EVIDENCE_CASES: EvidenceCase[] = [
  {
    id: 'case-payment-proof',
    title: 'Forged Bank Wire Transfer Receipt ($9,450.00)',
    category: 'Payment Proof',
    filename: 'wire_transfer_receipt_9450.png',
    fileSize: '418 KB',
    mimeType: 'image/png',
    dimensions: '1080 x 1920 px',
    verdict: 'CRITICAL',
    trustScore: 24,
    tamperProbability: 92,
    summaryLayperson: 'This wire transfer confirmation has been digitally altered. The transfer amount was forged from $45.00 to $9,450.00, and the recipient account digits were pasted in with mismatched font kerning. The digital background texture around the numbers is completely smoothed out compared to the rest of the receipt.',
    keyWarningSigns: [
      'The number "$9,450.00" has abnormal compression halos (ELA) not found on genuine bank receipts.',
      'Background digital noise is erased around the dollar amount and transaction ID.',
      'Font baseline dips by 1.8 degrees compared to adjacent system text.',
      'Creation timestamp post-dates the alleged settlement time by 6 hours.'
    ],
    recommendedAction: 'DO NOT release goods or services. Request the sender provide an official MT103 wire document or verify receipt directly in your banking ledger.',
    hashes: {
      sha256: '9f83a2184cf4a1e944b20912df0ca54831976bbbf0931c2d63298922f0916f69',
      sha3_256: '7c36a445cb4aa165db56f6e520025fa8b3017a9446d3e87870a4ef69d4d5e9db'
    },
    timestampAuthority: {
      rfc3161Token: 'RFC3161-DIGISTAMP-20260904-8921-CHASE',
      tsaProvider: 'Sectigo RFC 3161 Qualified TSA',
      timestamp: '2026-09-04T09:41:12Z',
      signatureAlgorithm: 'RSA-PSS-4096 / SHA-256',
      signatureValid: true
    },
    scores: {
      visualPurity: 18,
      noiseConsistency: 22,
      typographicAlignment: 34,
      metadataIntegrity: 20
    },
    metadata: {
      softwareDetected: 'Adobe Photoshop 25.0 (Windows)',
      creationDate: '2026-09-04 07:15:22 UTC',
      modificationDate: '2026-09-04 09:38:10 UTC',
      deviceModel: 'Synthetic Mobile Screenshot (iOS Rendering Engine)',
      colorSpace: 'sRGB IEC61966-2.1',
      compressionHistory: 'PNG Re-saved after 2 lossy passes',
      exifNotes: [
        'Desktop image manipulation tool headers found in ancillary chunks.',
        'PNG pHYs chunk resolution does not match native iPhone Retina pixel density.',
        'Modification timestamp occurred 2 hours after reported transaction.'
      ]
    },
    anomalies: [
      {
        id: 'an-1',
        name: 'Spliced Currency Amount ($9,450.00)',
        severity: 'CRITICAL',
        category: 'Pixel/ELA',
        box: { x: 26, y: 33, width: 48, height: 9 },
        technicalDetail: 'ELA compression delta Δ=44.2 vs background mean Δ=6.8. Local Laplacian variance collapsed from 16.2 to 2.1.',
        laypersonExplanation: 'The dollar amount was pasted in from a different source. The digital grain behind it is completely flat, showing it was edited.',
        confidence: 96
      },
      {
        id: 'an-2',
        name: 'Font Baseline & Kerning Mismatch',
        severity: 'HIGH',
        category: 'Typography',
        box: { x: 30, y: 52, width: 40, height: 6 },
        technicalDetail: 'Horizontal baseline shift of +1.8px detected on digit glyphs. Font anti-aliasing curve differs by 31% from system SF Pro font.',
        laypersonExplanation: 'The account digits do not line up evenly with the rest of the text on the receipt, indicating they were manually typed.',
        confidence: 89
      },
      {
        id: 'an-3',
        name: 'Software Footprint in Metadata',
        severity: 'HIGH',
        category: 'Metadata',
        box: { x: 5, y: 88, width: 90, height: 8 },
        technicalDetail: 'XMP namespace indicates derived from PSD project with active history state "Type Tool Edit".',
        laypersonExplanation: 'The file contains hidden metadata showing it was opened and saved in Adobe Photoshop before being sent.',
        confidence: 99
      }
    ],
    previewType: 'payment'
  },
  {
    id: 'case-chat-conversation',
    title: 'Edited Messaging Conversation (Spliced Confession)',
    category: 'Chat Conversation',
    filename: 'whatsapp_chat_evidence_aug2026.png',
    fileSize: '320 KB',
    mimeType: 'image/png',
    dimensions: '1080 x 2340 px',
    verdict: 'CRITICAL',
    trustScore: 31,
    tamperProbability: 86,
    summaryLayperson: 'This screenshot of a chat conversation was edited to fabricate an admission of guilt. One message bubble was digitally inserted, and the timestamp "11:42 PM" was cloned from another part of the screen. The text font does not match WhatsApp standard rendering.',
    keyWarningSigns: [
      'The third message bubble has inconsistent border radius (14px vs genuine 18px).',
      'Timestamp "11:42 PM" is a pixel-for-pixel copy-move duplicate of the earlier message timestamp.',
      'Sub-pixel text anti-aliasing shows non-standard font rendering (RoboType vs WhatsApp native system font).',
      'Missing WhatsApp compression signature on the fabricated bubble.'
    ],
    recommendedAction: 'Do not rely on this screenshot in legal or workplace inquiries. Require the original chat export (.txt) with full server audit logs or cryptographic verification.',
    hashes: {
      sha256: 'a1b7890123efcd4567890123456789abcdef0123456789abcdef0123456789ab',
      sha3_256: '5e4d3c2b1a0987654321fedcba0987654321fedcba0987654321fedcba098765'
    },
    timestampAuthority: {
      rfc3161Token: 'RFC3161-DIGISTAMP-20260904-4410-MSG',
      tsaProvider: 'Swisscom Qualified Electronic Timestamp Service',
      timestamp: '2026-09-04T09:30:00Z',
      signatureAlgorithm: 'ECDSA-P384 / SHA-384',
      signatureValid: true
    },
    scores: {
      visualPurity: 24,
      noiseConsistency: 30,
      typographicAlignment: 36,
      metadataIntegrity: 35
    },
    metadata: {
      softwareDetected: 'Online Fake Chat Generator v3.2',
      creationDate: '2026-09-03 23:14:00 UTC',
      modificationDate: '2026-09-03 23:15:10 UTC',
      deviceModel: 'Rendered Web Canvas (Chromium Headless)',
      colorSpace: 'sRGB',
      compressionHistory: 'Direct DOM snapshot',
      exifNotes: [
        'Browser screenshot DOM artifact detected.',
        'Font kerning lacks native iOS CoreText rendering metrics.',
        'Zero camera or mobile hardware noise floor present.'
      ]
    },
    anomalies: [
      {
        id: 'an-chat-1',
        name: 'Fabricated Message Bubble',
        severity: 'CRITICAL',
        category: 'Typography',
        box: { x: 12, y: 44, width: 76, height: 14 },
        technicalDetail: 'Bubble border curvature k=0.14 deviates from standard WhatsApp 18px radius (k=0.18). Font raster metrics mismatched.',
        laypersonExplanation: 'This speech bubble was generated by a fake chat generator website. The rounded corners and text spacing do not match WhatsApp.',
        confidence: 94
      },
      {
        id: 'an-chat-2',
        name: 'Cloned Timestamp (Copy-Move Forgery)',
        severity: 'HIGH',
        category: 'Pixel/ELA',
        box: { x: 62, y: 54, width: 22, height: 4 },
        technicalDetail: 'Normalized 2D cross-correlation r=0.998 between region [x:62, y:54] and source block [x:62, y:28].',
        laypersonExplanation: 'The time "11:42 PM" was cloned with a copy-stamp tool directly from the message above it.',
        confidence: 98
      }
    ],
    previewType: 'chat'
  },
  {
    id: 'case-invoice-pdf',
    title: 'Multi-Revision Forged Invoice PDF (Total $48,200)',
    category: 'Document & Invoice',
    filename: 'vendor_invoice_oct2026_revised.pdf',
    fileSize: '1.24 MB',
    mimeType: 'application/pdf',
    dimensions: 'Letter (612 x 792 pt)',
    verdict: 'HIGH_RISK',
    trustScore: 41,
    tamperProbability: 78,
    summaryLayperson: 'This PDF invoice shows multiple revisions saved after the original document was finalized. A second trailer (incremental update) was appended to overwrite the payable amount and bank IBAN number, masking the original total of $8,200.',
    keyWarningSigns: [
      'Two separate %%EOF markers detected; secondary incremental trailer appends modified objects.',
      'Vendor bank details object was replaced in revision #2.',
      'Embedded font stream for total amount uses Arial, while the rest of the document uses Helvetica-Bold.',
      'PDF signature dictionary was invalidated by subsequent byte modification.'
    ],
    recommendedAction: 'Verify invoice with the vendor via known telephone numbers. Do not update bank routing details based on this file.',
    hashes: {
      sha256: 'e8f7a6b5c4d3e2f10987654321abcdef1234567890abcdef1234567890abcdef',
      sha3_256: '99887766554433221100ffeeddccbbaa99887766554433221100ffeeddccbbaa'
    },
    timestampAuthority: {
      rfc3161Token: 'RFC3161-DIGISTAMP-20260904-7719-PDF',
      tsaProvider: 'DigiCert Timestamp Authority',
      timestamp: '2026-09-04T08:15:33Z',
      signatureAlgorithm: 'RSA-PSS-4096 / SHA-256',
      signatureValid: true
    },
    scores: {
      visualPurity: 46,
      noiseConsistency: 48,
      typographicAlignment: 38,
      metadataIntegrity: 32
    },
    metadata: {
      softwareDetected: 'iLovePDF / PDFtk Incremental Editor',
      creationDate: '2026-08-10 10:00:00 UTC',
      modificationDate: '2026-09-02 16:45:12 UTC',
      deviceModel: 'PDF 1.7 Hybrid Stream',
      colorSpace: 'DeviceRGB',
      compressionHistory: 'FlateDecode / 2 Incremental Traversal Cross-References',
      exifNotes: [
        'Document structure contains 2 separate xref tables.',
        'Object ID 14 (Bank Routing) overwritten in revision 2 at byte offset 948,112.',
        'Initial digital signature invalidated by appended stream.'
      ]
    },
    anomalies: [
      {
        id: 'an-inv-1',
        name: 'Incremental Revision Appending',
        severity: 'CRITICAL',
        category: 'PDF Structure',
        box: { x: 50, y: 68, width: 44, height: 10 },
        technicalDetail: 'Duplicate %%EOF markers (count=2). Xref table at offset 1,124,008 redefines object 12 (/Font /Arial) and object 14 (/Text).',
        laypersonExplanation: 'Someone reopened the signed PDF and appended changes to the end of the file, replacing the bank account number and dollar total.',
        confidence: 97
      },
      {
        id: 'an-inv-2',
        name: 'Font Family Discrepancy',
        severity: 'HIGH',
        category: 'Typography',
        box: { x: 60, y: 78, width: 34, height: 7 },
        technicalDetail: 'Glyph outline descriptors indicate Arial MT instead of document-wide standard Helvetica Neue.',
        laypersonExplanation: 'The font used for the total price does not match the rest of the company invoice font.',
        confidence: 91
      }
    ],
    previewType: 'invoice'
  },
  {
    id: 'case-id-credential',
    title: 'Tampered Identity Document (Photo Replacement)',
    category: 'ID & Credential',
    filename: 'id_card_credential_scan.jpg',
    fileSize: '780 KB',
    mimeType: 'image/jpeg',
    dimensions: '1600 x 1000 px',
    verdict: 'CRITICAL',
    trustScore: 29,
    tamperProbability: 89,
    summaryLayperson: 'This identity badge shows clear signs of portrait photo substitution. The portrait face has a completely different light angle, skin-tone color temperature, and JPEG compression quality compared to the plastic card background.',
    keyWarningSigns: [
      'The portrait photo boundary exhibits severe Laplacian edge sharpness and mismatched noise grain.',
      'Guilloche security wave patterns are broken and misaligned along the portrait edge.',
      'Date of Birth "1994" has different pixel thickness than the name text above it.',
      'Lighting direction on the face is from the top-right, while the badge watermark reflects from top-left.'
    ],
    recommendedAction: 'Flag for secondary physical credential review. Do not authenticate identity for banking, KYC, or building access.',
    hashes: {
      sha256: 'c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3',
      sha3_256: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b'
    },
    timestampAuthority: {
      rfc3161Token: 'RFC3161-DIGISTAMP-20260904-1102-ID',
      tsaProvider: 'Sectigo RFC 3161 Qualified TSA',
      timestamp: '2026-09-04T09:10:00Z',
      signatureAlgorithm: 'RSA-PSS-4096 / SHA-256',
      signatureValid: true
    },
    scores: {
      visualPurity: 21,
      noiseConsistency: 26,
      typographicAlignment: 35,
      metadataIntegrity: 34
    },
    metadata: {
      softwareDetected: 'Adobe Photoshop CS6 (Macintosh)',
      creationDate: '2026-08-28 14:02:11 UTC',
      modificationDate: '2026-09-03 11:20:45 UTC',
      deviceModel: 'Epson Perfection V600 Scanner',
      colorSpace: 'Adobe RGB (1998)',
      compressionHistory: 'Quantization Matrix Q82 (Headshot Q94 composite)',
      exifNotes: [
        'Dual quantization table detected (photo Q94, card background Q82).',
        'Resolution 300 DPI flatbed scan modified with desktop editor.',
        'Guilloche continuous tone boundary broken at pixel coordinate (320, 240).'
      ]
    },
    anomalies: [
      {
        id: 'an-id-1',
        name: 'Portrait Photo Substitution Boundary',
        severity: 'CRITICAL',
        category: 'Pixel/ELA',
        box: { x: 8, y: 22, width: 32, height: 56 },
        technicalDetail: 'Quantization mismatch Q=94 on face vs Q=82 on badge canvas. Edge gradient jump |∇I| > 85 along rectangular seam.',
        laypersonExplanation: 'A new photo was pasted over the original card holder photo. You can see the cutting seam where the background security pattern stops.',
        confidence: 98
      },
      {
        id: 'an-id-2',
        name: 'Guilloche Security Pattern Discontinuity',
        severity: 'HIGH',
        category: 'Noise',
        box: { x: 38, y: 40, width: 28, height: 18 },
        technicalDetail: 'Phase correlation drops to r=0.21 across border. Fine microprint lines interrupted by clone-brush blur.',
        laypersonExplanation: 'The security squiggly lines printed on official IDs were smeared with a digital blur tool to hide the photo edge.',
        confidence: 93
      }
    ],
    previewType: 'idcard'
  },
  {
    id: 'case-authentic-photo',
    title: 'Authentic Pristine Payment Confirmation (Zero Tampering)',
    category: 'Authentic Photo',
    filename: 'genuine_pos_receipt_terminal.jpg',
    fileSize: '1.82 MB',
    mimeType: 'image/jpeg',
    dimensions: '3024 x 4032 px',
    verdict: 'AUTHENTIC',
    trustScore: 97,
    tamperProbability: 4,
    summaryLayperson: 'This photograph of a retail payment terminal receipt is authentic. The physical paper texture, camera optical focus blur, natural paper fibers, and sensor noise are completely consistent across the entire image. No digital editing traces detected.',
    keyWarningSigns: [
      'Uniform Poisson noise distribution across all regions of the image.',
      'Natural lens perspective tilt and optical vignette matches the camera sensor.',
      'EXIF camera parameters (iPhone 15 Pro, ƒ/1.78, 1/120s, ISO 64) correlate with lighting.',
      'Consistent single-pass JPEG quantization table throughout.'
    ],
    recommendedAction: 'Evidence satisfies standard verification criteria. Retain cryptographic proof token in custody log for audit compliance.',
    hashes: {
      sha256: '5f4dcc3b5aa765d61d8327deb882cf992b9699aaf4e4cbc56b5b7b3b570a3f49',
      sha3_256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    },
    timestampAuthority: {
      rfc3161Token: 'RFC3161-DIGISTAMP-20260904-0001-GENUINE',
      tsaProvider: 'DigiCert Qualified Time Stamping Authority',
      timestamp: '2026-09-04T09:44:00Z',
      signatureAlgorithm: 'RSA-PSS-4096 / SHA-256',
      signatureValid: true
    },
    scores: {
      visualPurity: 98,
      noiseConsistency: 96,
      typographicAlignment: 95,
      metadataIntegrity: 99
    },
    metadata: {
      softwareDetected: 'Apple iOS 17.5.1 Camera Pipeline',
      creationDate: '2026-09-04 09:40:15 UTC',
      modificationDate: '2026-09-04 09:40:15 UTC',
      deviceModel: 'Apple iPhone 15 Pro (Main Camera 24mm)',
      colorSpace: 'Display P3',
      compressionHistory: 'Single-Pass Native Camera Capture (Q92)',
      exifNotes: [
        'Pristine native camera capture with authentic Apple Makernotes.',
        'Zero editing software fingerprints or ancillary project namespaces.',
        'Sensor noise distribution follows natural physical Poisson curve.'
      ]
    },
    anomalies: [],
    previewType: 'photo'
  }
];
