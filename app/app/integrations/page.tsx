"use client";

import { IntegrationShowcase, Integration } from "@/components/ui/integration-showcase";

const integrationsData: Integration[] = [
  {
    name: 'Notion',
    description: 'Sync your Notion databases.',
    iconSrc: 'https://cdn.worldvectorlogo.com/logos/notion-2.svg',
  },
  {
    name: 'Google Sheets',
    description: 'Connect and sync spreadsheets.',
    iconSrc: 'https://cdn.worldvectorlogo.com/logos/google-sheets-logo-icon.svg',
  },
  {
    name: 'Airtable',
    description: 'Integrate with Airtable bases.',
    iconSrc: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAMAAABF0y+mAAAAjVBMVEVHcEz+uwD9tQDtnB/9tQD9tAD8tAD/tAD+tQD+tQD+tgD9tQD9tAD9tgDfJ1a8IEi6EEv/uAD9tAD9tQAOwP8Xv/8YwP/5K2DnJ1m5H0e6IEe8HUnxJ2AXwP8Wv/8Yv/8Yv/8YwP/5K2DDIUv9tQANx/8OwP8YwP8UwP/WJFK9IEnAIEj5LGD5K2Cg/8aNAAAAL3RSTlMAJmwOVdb/HoR9NKfqiK7GUke6t1XEueL//+yMLzOT9v/h//+5D1zdJpr/mkSwqkV2VRMAAADASURBVHgBvc5FFgJBEATRxN3G3d3ufzxacGqWENv/SvCHJtPphJbZfLFkLeazL1qtBQnerN5ou1u+tdveZTbdL7/aTyVul2QTqZPD/mtwvRJ0PJ2Bi/JK6gXQdIOhadmO62G2WdyfncEPwiiKOSZWattiPNvv2VBe6BGvFJgkTNn4DKyqZkNvmDQ2r0VeSnhDoacOfkRhYjEC/JDC3gNGcGBEoyACYwAeIxINiAgM6wojqBc5QGIY+CCrQkPDr7sCTOYgaxntCWQAAAAASUVORK5CYII=',
  },
  {
    name: 'Slack',
    description: 'Send messages to Slack channels.',
    iconSrc: 'https://cdn.worldvectorlogo.com/logos/slack-new-logo.svg',
  },
  {
    name: 'GitHub',
    description: 'Connect your GitHub repositories.',
    iconSrc: 'https://cdn.worldvectorlogo.com/logos/github-icon.svg',
  },
  {
    name: 'Zapier',
    description: 'Automate with Zapier workflows.',
    iconSrc: 'https://cdn.worldvectorlogo.com/logos/zapier.svg',
  },
  {
    name: 'Make',
    description: 'Create automations with Make.com',
    iconSrc: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAMAAABF0y+mAAAAwFBMVEX//////f/RY/LKYvDy4PvZwPF3ANGPTNeqhN/n3PVqAMuLS9X33/3GAO++GuyxAOnId/DFoOqEFtV+INLMteuDPdPhYPfNDvHEIu7UkvOsbOOJINeEJ9Tt4/jbAPXXF/SSGduTKdvxW/vnDvnbivT49PyQANuZW9v/2//yAPzpzPmHGNe6keb/Vf/mhvjNmu//AP+5ZumnJeWDANfzhPz/0//37f2jAOSnVeL/g//lxPfCjev/Sf+3TurZuPKIMda9K89qAAAAt0lEQVR4Ad3QAQfCYBDG8f9tu7e3WVRUBUCRCFDfH4gAAhkgCKWoNmZZTcy26QvswXF+nsPR3sifxRFJVfKAvAC8wgL5JfYj8Gvoi0R+jt2ouFUUrUXOxmBPaQPHSjaam++AXMtnl5KAaEpfoN5UyCahJnBs4NLtGI1xhtgp6yCtoAKDEIHrSWrNjQsdh62STYFZBT2gu8eDoQsP1mXcacAF7kafLvTsYVX97XYPgPfOWAy4hbQrHxHNJ3cZ8ThmAAAAAElFTkSuQmCC',
  },
  {
    name: 'Stripe',
    description: 'Accept payments with Stripe.',
    iconSrc: 'https://cdn.worldvectorlogo.com/logos/stripe-2.svg',
  },
  {
    name: 'HubSpot',
    description: 'Sync with HubSpot CRM.',
    iconSrc: 'https://cdn.worldvectorlogo.com/logos/hubspot.svg',
  },
  {
    name: 'Twilio',
    description: 'Send SMS and calls.',
    iconSrc: 'https://cdn.worldvectorlogo.com/logos/twilio.svg',
  },
  {
    name: 'More Coming',
    description: 'Many more integrations in development.',
    iconSrc: 'https://img.icons8.com/ios-glyphs/60/plus-math.png',
  },
];

export default function IntegrationsPage() {
  return (
    <div className="w-full bg-white">
      <IntegrationShowcase
        title="Integrate with your ~favorite~ tools"
        subtitle="Connect Flowtex with 100+ apps to automate your workflow and sync data seamlessly."
        illustrationSrc="https://illustrations.popsy.co/gray/brainstorming.svg"
        illustrationAlt="Integration tools illustration"
        integrations={integrationsData}
      />
    </div>
  );
}
