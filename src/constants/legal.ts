export type LegalSection = {
  title: string;
  paragraphs: string[];
  links?: Array<{ label: string; href: string }>;
};

export const TERMS_OF_SERVICE = {
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
  ] satisfies LegalSection[],
};

export const PRIVACY_NOTICE = {
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
  ] satisfies LegalSection[],
};
