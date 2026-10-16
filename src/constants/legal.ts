import type {
  LegalDocumentDefinition,
  LegalDocumentKey,
  LegalDocumentVersion,
} from "@/types/legal";

// Each version is a full snapshot of the published text. Never edit a published
// version; add a new LEGAL_<DOCUMENT>_<DAY>_<MONTH>_<YEAR> constant instead, with
// the day and year in Roman numerals.

export const LEGAL_TERMS_XV_OCTOBER_MMXXVI: LegalDocumentVersion = {
  version: "2026-10-15",
  summary:
    "Added paid subscriptions, AI credits, Stripe payments, cancellations, refunds, and plan changes.",
  title: "Terms of Service",
  description: "Terms of Service for Eclipze.",
  intro:
    "These terms describe access to Eclipze, a workspace for project communication, issues, repositories, and AI-assisted development tasks.",
  sections: [
    {
      title: "Operator and scope",
      paragraphs: [
        "Eclipze is operated by Jose Rafael Martinez Bocanegra from Nuevo León, Mexico. The operator's full service address must be confirmed, and the jurisdiction and dispute resolution clauses must be reviewed before these terms are treated as a final agreement.",
        "By creating an account, you agree to these terms and the Privacy Notice. Any non-waivable rights provided by applicable law remain in effect.",
      ],
    },
    {
      title: "Accounts and security",
      paragraphs: [
        "Provide a valid email address, verify it when asked, and keep your password and access links private. You are responsible for activity under your account. Contact the operator promptly if you believe someone accessed it without authorization.",
      ],
    },
    {
      title: "Workspace content",
      paragraphs: [
        "You are responsible for the projects, issue descriptions, messages, repository addresses, prompts, selected skills, and other content you add to Eclipze. Only share content you have the right to use and provide for the feature you choose.",
        "Eclipze processes content to provide the features you request. Do not include passwords, API secrets, or confidential information unless a feature requires it and you are authorized to share it.",
      ],
    },
    {
      title: "AI and connected services",
      paragraphs: [
        "When you start an AI task, its prompt and the content of selected skills are sent to OpenRouter to process the request. Other connected services may receive information needed to provide a feature you request. Each provider has its own terms and privacy notice.",
        "Eclipze does not sell or rent your personal data. AI provider keys are encrypted before storage. You are responsible for choosing appropriate providers and sending only content you are authorized to share with them.",
      ],
    },
    {
      title: "Paid subscriptions",
      paragraphs: [
        "Eclipze offers a Free plan and paid plans billed as monthly subscriptions. Prices are in US dollars and include applicable taxes, such as Mexico's value-added tax (IVA, Impuesto al Valor Agregado). The features and limits of each plan are shown before you subscribe.",
        "Plus costs $5 USD per month and includes $2 USD in monthly AI credits. Max costs $12 USD per month, includes $5 USD in monthly AI credits, and gives access to advanced models. Team costs $15 USD per seat per month, requires a minimum of 5 seats, includes Max-level access for every member, and adds $5 USD in monthly AI credits per seat to a credit pool shared by the team. The Free plan includes $0.30 USD in monthly AI credits.",
        "On the Team plan, the team owner manages members and is responsible for paying for every seat. Seats added during a billing period are prorated, and the team cannot have fewer than 5 paid seats.",
        "Payments are processed by Stripe. When you subscribe, you authorize Eclipze, through Stripe, to charge your selected payment method at the start of each monthly billing period until you cancel. Stripe's own terms and privacy policy apply to the payment information you provide to it.",
        "Subscriptions renew automatically every month on the same billing date. You will be able to see your current plan, next billing date, and payment history from Settings or from the Stripe customer portal linked there.",
      ],
      links: [
        {
          label: "Stripe Services Agreement",
          href: "https://stripe.com/legal/ssa",
        },
        {
          label: "Stripe Privacy Policy",
          href: "https://stripe.com/privacy",
        },
      ],
    },
    {
      title: "AI credits",
      paragraphs: [
        "AI credits pay for AI tasks run with Eclipze-funded models. Each plan grants a monthly credit allowance at the start of every billing period. Usage is also subject to 5-hour and weekly limits that depend on your plan and are shown in Settings.",
        "Monthly plan credits do not accumulate. Unused monthly credits expire at the end of each billing period and are not carried over to the next one.",
        "When you change your plan, your remaining monthly plan credits are not added to the new plan. Instead, your monthly credit balance is reset to the allowance of the new plan when the change takes effect.",
        "Credits you purchase separately as top-ups do not expire, are used after your monthly plan credits, and are not affected by plan changes. On the Team plan, credits belong to the team's shared pool, not to individual members.",
        "AI credits have no cash value. They cannot be refunded, exchanged for money, or transferred to another account or team, except where applicable law requires otherwise.",
      ],
    },
    {
      title: "Cancellation, refunds, and failed payments",
      paragraphs: [
        "You can cancel a subscription at any time. Cancellation stops future renewals; your paid features and remaining monthly credits stay available until the end of the current billing period, after which your account returns to the Free plan and its monthly credit allowance. Your workspace content is not deleted because a subscription ends.",
        "Except where applicable law requires otherwise, charges for a billing period that has already started are not refunded, including for partial months. The final refund policy, including any trial period or refund window, still needs to be confirmed before paid plans are launched.",
        "If a payment fails, Stripe may retry the charge and Eclipze may notify you by email. If the payment is not completed within the retry period, paid features may be suspended or the subscription may be cancelled.",
      ],
    },
    {
      title: "Price and plan changes",
      paragraphs: [
        "The operator may change subscription prices or plan features. Price increases will be communicated by email or within the application before they take effect and will apply starting with your next billing period. If you do not agree with the change, you can cancel before the new price applies.",
        "Upgrades take effect immediately, and the prorated charge is shown before you confirm. Downgrades take effect at the start of your next billing period. In both cases, your monthly credits are reset to the new plan's allowance as described in the AI credits section.",
        "Rights granted to consumers by Mexico's Federal Consumer Protection Law (Ley Federal de Protección al Consumidor) remain in effect. Complaints may also be filed with PROFECO (Procuraduría Federal del Consumidor), Mexico's federal consumer protection agency.",
      ],
      links: [
        {
          label: "Federal Consumer Protection Law (Chamber of Deputies, current text)",
          href: "https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPC.pdf",
        },
      ],
    },
    {
      title: "Acceptable use",
      paragraphs: [
        "Use Eclipze in accordance with applicable law and your authorizations. Do not try to access another person's account or workspace, interfere with the service, or use connected services in a way that violates their terms.",
      ],
    },
    {
      title: "Changes and account deletion",
      paragraphs: [
        "The operator may update the service or these terms. Each update is published on this page with its update date, and previous versions remain available in the version history on this page.",
        "Signing in after an update means you accept the version in effect at that time. Eclipze records which version you accepted and when, and you can review it, together with previous versions, in your profile Settings.",
        "You can request account deletion from Settings when your account is at least 30 days old and the product's verification requirements are met. Cancel any active subscription before deleting your account; deleting an account does not refund charges already made. The application deletes the account and related records from the database; retention periods for backups and third-party systems still need to be documented.",
      ],
    },
    {
      title: "Contact",
      paragraphs: [
        "For questions about these terms, contact Jose Rafael Martinez Bocanegra at contact@ravexcode.com. This document remains a draft until the operator's full address is confirmed and the final legal wording is reviewed.",
      ],
    },
  ],
};

export const LEGAL_PRIVACY_XV_OCTOBER_MMXXVI: LegalDocumentVersion = {
  version: "2026-10-15",
  summary:
    "Added Stripe subscription and payment data, billing record retention, and legal acceptance records.",
  title: "Privacy Notice",
  description: "Privacy Notice for Eclipze.",
  intro:
    "This notice explains what personal data Eclipze handles, how it is used, and which providers receive information to deliver the features you request.",
  sections: [
    {
      title: "Data controller",
      paragraphs: [
        "The data controller is Jose Rafael Martinez Bocanegra, who operates Eclipze in Nuevo León, Mexico. For privacy questions or requests, contact contact@ravexcode.com. The controller's full service address must be added before this notice is considered complete.",
      ],
    },
    {
      title: "Data handled by the application",
      paragraphs: [
        "Account data includes your email address, username, optional avatar, password hash, role, and activity dates. The application also stores access sessions and verification or recovery codes as hashes.",
        "Your workspace may contain projects, issues, messages, notifications, repository addresses, agent settings, prompts, selected skills, and task activity. Free-text content you submit may include personal or confidential information.",
        "The application does not intentionally request sensitive personal data as account fields. However, you could include it in free-text messages, issues, or prompts. Avoid doing so unless necessary and you are authorized to provide it.",
        "A security email after sign-in may include the IP address observed for that request, a description of your browser and device, and the sign-in time. Resend delivers that email.",
        "When you sign in, the application records which versions of the Terms of Service and this Privacy Notice you accepted and the date of acceptance. You can review these records in your profile Settings. They are kept while your account exists and are deleted with it.",
      ],
    },
    {
      title: "Subscription and payment data",
      paragraphs: [
        "If you subscribe to a paid plan, payments are processed by Stripe. You enter your card or other payment details directly with Stripe; Eclipze does not receive or store your full card number or security code.",
        "Eclipze stores the identifiers Stripe returns to link your account to your billing records, such as the Stripe customer and subscription IDs, your plan, subscription status, billing period dates, and cancellation status. Eclipze may also receive limited payment details from Stripe, such as the card brand, last four digits, expiration date, billing country, invoice amounts, and payment status.",
        "Stripe may use the information you provide to it, including device and network data, to process payments, prevent fraud, and meet its legal obligations, under its own privacy policy.",
      ],
      links: [
        {
          label: "Stripe Privacy Policy",
          href: "https://stripe.com/privacy",
        },
      ],
    },
    {
      title: "Purposes of use",
      paragraphs: [
        "Data is used to create and secure accounts; verify email addresses and recover passwords; provide projects, issues, messages, repositories, agents, and other features; process AI tasks you start; manage paid subscriptions, process payments, and send receipts or billing notices; send service and security communications; and maintain and protect the service.",
        "Eclipze uses Vercel Analytics to understand service usage. The operator must confirm the exact analytics events and configured retention periods.",
      ],
    },
    {
      title: "Sale, service providers, and transfers",
      paragraphs: [
        "Eclipze does not sell or rent personal data. Information is shared with providers only when needed to operate a feature or deliver a communication you request.",
        "When you start an AI task, its prompt and selected skill content are sent to OpenRouter. Resend delivers account and security emails. Stripe processes subscription payments and billing. Vercel provides analytics. The application may contact AI provider APIs to validate or use an AI connection. Hosting and database providers also process information needed to operate the application; their identities, locations, and retention periods still need to be confirmed.",
        "Some providers may process information outside Mexico. The operator must confirm destinations and transfer conditions before publishing this notice. Each provider may handle received data under its own terms and privacy notices.",
      ],
    },
    {
      title: "Security and access",
      paragraphs: [
        "The application hashes passwords using scrypt and stores session and verification secrets as hashes. AI provider API keys are encrypted with AES-256-GCM before storage.",
        "Other database fields—including email addresses and usernames, issue and message content, repository addresses, and agent prompts—are not encrypted field by field by the application. The Developer role can access some account identifiers and issue records to operate the service. For this reason, Eclipze cannot claim that developers can never see user data. Access is subject to the role and workspace permissions implemented in the application.",
      ],
    },
    {
      title: "Retention and deletion",
      paragraphs: [
        "You can request account deletion from Settings when your account is at least 30 days old and the product's verification requirements are met. The application deletes the account and related records from the database. Retention of backups, infrastructure logs, analytics, and data held by providers still needs to be documented.",
        "Billing records, such as invoices, payment amounts, and subscription history, may be kept after an account is deleted for as long as tax, accounting, or legal obligations require. Stripe also keeps payment records under its own retention policy. The exact billing retention period still needs to be confirmed.",
      ],
    },
    {
      title: "Your privacy rights and requests",
      paragraphs: [
        "Under applicable Mexican law, you may request access to, correction or deletion of, or objection to the processing of your personal data. These rights are known in Mexico as ARCO rights (Acceso, Rectificación, Cancelación y Oposición). Email contact@ravexcode.com with your name, account email, the right you wish to exercise, and enough detail to locate the data. The controller may request information needed to verify your identity or clarify your request.",
        "Mexico's Federal Law on the Protection of Personal Data Held by Private Parties (Ley Federal de Protección de Datos Personales en Posesión de los Particulares) applies to private-sector controllers. Nuevo León's state law concerns data held by public-sector obligated entities; operating from Nuevo León alone does not make Eclipze a public-sector obligated entity.",
      ],
      links: [
        {
          label: "Federal Law (Chamber of Deputies, current text)",
          href: "https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPDPPP.pdf",
        },
        {
          label: "Nuevo León State Law (State Legal Compilation)",
          href: "https://sistec.nl.gob.mx/Transparencia_2015/Archivos/AC_0001_0002_0168084-0000001.pdf",
        },
        {
          label: "Government of Nuevo León: Personal Data Processing",
          href: "https://nl.gob.mx/es/sobre-tratamiento-datos-personales",
        },
      ],
    },
    {
      title: "Updates",
      paragraphs: [
        "Changes to this notice will be posted here with a new update date, and previous versions remain available in the version history on this page. This notice is dated October 15, 2026. The controller's full address, provider list and locations, retention periods, billing details, and final legal review still need to be confirmed.",
      ],
    },
  ],
};

export const LEGAL_TERMS_II_OCTOBER_MMXXVI: LegalDocumentVersion = {
  version: "2026-10-02",
  summary:
    "Initial version.",
  title: "Terms of Service",
  description: "Terms of Service for Eclipze.",
  intro:
    "These terms describe access to Eclipze, a workspace for project communication, issues, repositories, and AI-assisted development tasks.",
  sections: [
    {
      title: "Operator and scope",
      paragraphs: [
        "Eclipze is operated by Jose Rafael Martinez Bocanegra from Nuevo León, Mexico. The operator's full service address must be confirmed, and the jurisdiction and dispute resolution clauses must be reviewed before these terms are treated as a final agreement.",
        "By creating an account, you agree to these terms and the Privacy Notice. Any non-waivable rights provided by applicable law remain in effect.",
      ],
    },
    {
      title: "Accounts and security",
      paragraphs: [
        "Provide a valid email address, verify it when asked, and keep your password and access links private. You are responsible for activity under your account. Contact the operator promptly if you believe someone accessed it without authorization.",
      ],
    },
    {
      title: "Workspace content",
      paragraphs: [
        "You are responsible for the projects, issue descriptions, messages, repository addresses, prompts, selected skills, and other content you add to Eclipze. Only share content you have the right to use and provide for the feature you choose.",
        "Eclipze processes content to provide the features you request. Do not include passwords, API secrets, or confidential information unless a feature requires it and you are authorized to share it.",
      ],
    },
    {
      title: "AI and connected services",
      paragraphs: [
        "When you start an AI task, its prompt and the content of selected skills are sent to OpenRouter to process the request. Other connected services may receive information needed to provide a feature you request. Each provider has its own terms and privacy notice.",
        "Eclipze does not sell or rent your personal data. AI provider keys are encrypted before storage. You are responsible for choosing appropriate providers and sending only content you are authorized to share with them.",
      ],
    },
    {
      title: "Acceptable use",
      paragraphs: [
        "Use Eclipze in accordance with applicable law and your authorizations. Do not try to access another person's account or workspace, interfere with the service, or use connected services in a way that violates their terms.",
      ],
    },
    {
      title: "Changes and account deletion",
      paragraphs: [
        "The operator may update the service or these terms. Changes will be reflected on this page with an updated date.",
        "You can request account deletion from Settings when your account is at least 30 days old and the product's verification requirements are met. The application deletes the account and related records from the database; retention periods for backups and third-party systems still need to be documented.",
      ],
    },
    {
      title: "Contact",
      paragraphs: [
        "For questions about these terms, contact Jose Rafael Martinez Bocanegra at contact@ravexcode.com. This document remains a draft until the operator's full address is confirmed and the final legal wording is reviewed.",
      ],
    },
  ],
};

export const LEGAL_PRIVACY_II_OCTOBER_MMXXVI: LegalDocumentVersion = {
  version: "2026-10-02",
  summary:
    "Initial version.",
  title: "Privacy Notice",
  description: "Privacy Notice for Eclipze.",
  intro:
    "This notice explains what personal data Eclipze handles, how it is used, and which providers receive information to deliver the features you request.",
  sections: [
    {
      title: "Data controller",
      paragraphs: [
        "The data controller is Jose Rafael Martinez Bocanegra, who operates Eclipze in Nuevo León, Mexico. For privacy questions or requests, contact contact@ravexcode.com. The controller's full service address must be added before this notice is considered complete.",
      ],
    },
    {
      title: "Data handled by the application",
      paragraphs: [
        "Account data includes your email address, username, optional avatar, password hash, role, and activity dates. The application also stores access sessions and verification or recovery codes as hashes.",
        "Your workspace may contain projects, issues, messages, notifications, repository addresses, agent settings, prompts, selected skills, and task activity. Free-text content you submit may include personal or confidential information.",
        "The application does not intentionally request sensitive personal data as account fields. However, you could include it in free-text messages, issues, or prompts. Avoid doing so unless necessary and you are authorized to provide it.",
        "A security email after sign-in may include the IP address observed for that request, a description of your browser and device, and the sign-in time. Resend delivers that email.",
      ],
    },
    {
      title: "Purposes of use",
      paragraphs: [
        "Data is used to create and secure accounts; verify email addresses and recover passwords; provide projects, issues, messages, repositories, agents, and other features; process AI tasks you start; send service and security communications; and maintain and protect the service.",
        "Eclipze uses Vercel Analytics to understand service usage. The operator must confirm the exact analytics events and configured retention periods.",
      ],
    },
    {
      title: "Sale, service providers, and transfers",
      paragraphs: [
        "Eclipze does not sell or rent personal data. Information is shared with providers only when needed to operate a feature or deliver a communication you request.",
        "When you start an AI task, its prompt and selected skill content are sent to OpenRouter. Resend delivers account and security emails. Vercel provides analytics. The application may contact AI provider APIs to validate or use an AI connection. Hosting and database providers also process information needed to operate the application; their identities, locations, and retention periods still need to be confirmed.",
        "Some providers may process information outside Mexico. The operator must confirm destinations and transfer conditions before publishing this notice. Each provider may handle received data under its own terms and privacy notices.",
      ],
    },
    {
      title: "Security and access",
      paragraphs: [
        "The application hashes passwords using scrypt and stores session and verification secrets as hashes. AI provider API keys are encrypted with AES-256-GCM before storage.",
        "Other database fields—including email addresses and usernames, issue and message content, repository addresses, and agent prompts—are not encrypted field by field by the application. The Developer role can access some account identifiers and issue records to operate the service. For this reason, Eclipze cannot claim that developers can never see user data. Access is subject to the role and workspace permissions implemented in the application.",
      ],
    },
    {
      title: "Retention and deletion",
      paragraphs: [
        "You can request account deletion from Settings when your account is at least 30 days old and the product's verification requirements are met. The application deletes the account and related records from the database. Retention of backups, infrastructure logs, analytics, and data held by providers still needs to be documented.",
      ],
    },
    {
      title: "Your privacy rights and requests",
      paragraphs: [
        "Under applicable Mexican law, you may request access to, correction or deletion of, or objection to the processing of your personal data. These rights are known in Mexico as ARCO rights (Acceso, Rectificación, Cancelación y Oposición). Email contact@ravexcode.com with your name, account email, the right you wish to exercise, and enough detail to locate the data. The controller may request information needed to verify your identity or clarify your request.",
        "Mexico's Federal Law on the Protection of Personal Data Held by Private Parties (Ley Federal de Protección de Datos Personales en Posesión de los Particulares) applies to private-sector controllers. Nuevo León's state law concerns data held by public-sector obligated entities; operating from Nuevo León alone does not make Eclipze a public-sector obligated entity.",
      ],
      links: [
        {
          label: "Federal Law (Chamber of Deputies, current text)",
          href: "https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPDPPP.pdf",
        },
        {
          label: "Nuevo León State Law (State Legal Compilation)",
          href: "https://sistec.nl.gob.mx/Transparencia_2015/Archivos/AC_0001_0002_0168084-0000001.pdf",
        },
        {
          label: "Government of Nuevo León: Personal Data Processing",
          href: "https://nl.gob.mx/es/sobre-tratamiento-datos-personales",
        },
      ],
    },
    {
      title: "Updates",
      paragraphs: [
        "Changes to this notice will be posted here with a new update date. This notice is dated October 2, 2026. The controller's full address, provider list and locations, retention periods, and final legal review still need to be confirmed.",
      ],
    },
  ],
};

export const LEGAL_DOCUMENTS: Record<LegalDocumentKey, LegalDocumentDefinition> = {
  terms: {
    key: "terms",
    title: "Terms of Service",
    path: "/legal/tos",
    versions: [
      LEGAL_TERMS_XV_OCTOBER_MMXXVI,
      LEGAL_TERMS_II_OCTOBER_MMXXVI,
    ],
  },
  privacy: {
    key: "privacy",
    title: "Privacy Notice",
    path: "/legal/privacy",
    versions: [
      LEGAL_PRIVACY_XV_OCTOBER_MMXXVI,
      LEGAL_PRIVACY_II_OCTOBER_MMXXVI,
    ],
  },
};

export const LEGAL_DOCUMENT_KEYS = ["terms", "privacy"] as const satisfies LegalDocumentKey[];

export const LEGAL_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});
