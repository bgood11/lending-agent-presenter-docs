// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://lending-agent-presenter-docs.vercel.app',
	markdown: {
		syntaxHighlight: { excludeLangs: ['mermaid'] },
	},
	integrations: [
		starlight({
			title: 'Lending Agent Presenter',
			description:
				'Implementation, architecture, safety, privacy, and regulatory guidance for the Lending Agent Presenter — a menu-style finance presentment demo for retailers and brokers.',
			logo: { src: './src/assets/logo.svg', replacesTitle: false },
			favicon: '/favicon.svg',
			customCss: ['./src/styles/custom.css'],
			head: [
				{
					tag: 'script',
					attrs: { type: 'module' },
					content: `
						import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
						function renderMermaid() {
							const theme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'default';
							mermaid.initialize({ startOnLoad: false, theme });
							const blocks = document.querySelectorAll('pre > code.language-mermaid:not([data-mermaid-rendered])');
							blocks.forEach(async (code, i) => {
								const pre = code.parentElement;
								const id = 'mermaid-' + Math.random().toString(36).slice(2);
								const source = code.textContent || '';
								try {
									const { svg } = await mermaid.render(id, source);
									const wrapper = document.createElement('div');
									wrapper.className = 'mermaid';
									wrapper.innerHTML = svg;
									pre.replaceWith(wrapper);
								} catch (err) {
									code.setAttribute('data-mermaid-rendered', 'error');
									console.error('mermaid render failed', err);
								}
							});
						}
						if (document.readyState === 'loading') {
							document.addEventListener('DOMContentLoaded', renderMermaid);
						} else {
							renderMermaid();
						}
						document.addEventListener('astro:after-swap', renderMermaid);
					`,
				},
			],
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/bgood11/lending-agent-presenter' },
				{ icon: 'external', label: 'Live demo', href: 'https://lending-agent-presenter.vercel.app' },
			],
			editLink: {
				baseUrl: 'https://github.com/bgood11/lending-agent-presenter-docs/edit/main/',
			},
			lastUpdated: true,
			pagination: true,
			tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 3 },
			sidebar: [
				{
					label: 'Introduction',
					items: [
						{ label: 'What it is', slug: 'introduction/what-it-is' },
						{ label: 'How it works', slug: 'introduction/how-it-works' },
						{ label: "Who it's for", slug: 'introduction/who-its-for' },
						{ label: 'Live demo', slug: 'introduction/live-demo' },
					],
				},
				{
					label: 'Product',
					items: [
						{ label: 'Marketing landing', slug: 'product/marketing-landing' },
						{ label: 'Rep tablet', slug: 'product/rep-tablet' },
						{ label: 'Customer phone', slug: 'product/customer-phone' },
						{ label: 'Retailer admin', slug: 'product/retailer-admin' },
						{ label: 'Skin switcher', slug: 'product/skin-switcher' },
					],
				},
				{
					label: 'Architecture',
					items: [
						{ label: 'Overview', slug: 'architecture/overview' },
						{ label: 'Data model', slug: 'architecture/data-model' },
						{ label: 'Magic-link mechanics', slug: 'architecture/magic-link-mechanics' },
						{ label: 'State machines', slug: 'architecture/state-machines' },
						{ label: 'Mock-vs-real boundary', slug: 'architecture/mock-vs-real' },
						{ label: 'Cold-start recovery', slug: 'architecture/cold-start-recovery' },
					],
				},
				{
					label: 'Implementation',
					items: [
						{
							label: 'For retailers',
							items: [
								{ label: 'Adoption path', slug: 'implementation/retailers/adoption-path' },
								{ label: 'Catalogue onboarding', slug: 'implementation/retailers/catalogue-onboarding' },
								{ label: 'Branding & white-label', slug: 'implementation/retailers/branding' },
								{ label: 'Pilot playbook', slug: 'implementation/retailers/pilot-playbook' },
							],
						},
						{
							label: 'For brokers',
							items: [
								{ label: 'Adoption path', slug: 'implementation/brokers/adoption-path' },
								{ label: 'Permissions & contracts', slug: 'implementation/brokers/permissions-contracts' },
								{ label: 'Audit & evidence integration', slug: 'implementation/brokers/audit-integration' },
								{ label: 'Vulnerability process', slug: 'implementation/brokers/vulnerability-process' },
							],
						},
					],
				},
				{
					label: 'Safety',
					items: [
						{ label: 'Overview', slug: 'safety/overview' },
						{ label: 'Threat model', slug: 'safety/threat-model' },
						{ label: 'Rate limiting', slug: 'safety/rate-limiting' },
						{ label: 'Vulnerable customer protection', slug: 'safety/vulnerable-customer-protection' },
						{ label: 'Tampering and replay', slug: 'safety/tampering-and-replay' },
					],
				},
				{
					label: 'Privacy',
					items: [
						{ label: 'Overview', slug: 'privacy/overview' },
						{ label: 'Data flow', slug: 'privacy/data-flow' },
						{ label: 'UK GDPR', slug: 'privacy/uk-gdpr' },
						{ label: 'DPIA template', slug: 'privacy/dpia' },
						{ label: 'Data minimisation', slug: 'privacy/data-minimisation' },
						{ label: 'Retention', slug: 'privacy/retention' },
						{ label: 'Sub-processors', slug: 'privacy/sub-processors' },
						{ label: 'PECR & cookies', slug: 'privacy/pecr-and-cookies' },
					],
				},
				{
					label: 'Regulatory',
					items: [
						{ label: 'Overview', slug: 'regulatory/overview' },
						{ label: 'Consumer Duty', slug: 'regulatory/consumer-duty' },
						{ label: 'CONC 4.2 (adequate explanations)', slug: 'regulatory/conc-4-2' },
						{ label: 'CONC 3.5 (financial promotions)', slug: 'regulatory/conc-3-5' },
						{ label: 'Vulnerable customers', slug: 'regulatory/vulnerable-customers' },
						{ label: 'Principles & SMCR', slug: 'regulatory/principles-smcr' },
						{ label: 'Audit-as-evidence', slug: 'regulatory/audit-as-evidence' },
					],
				},
				{
					label: 'Deploy',
					items: [
						{ label: 'Local development', slug: 'deploy/local' },
						{ label: 'Vercel', slug: 'deploy/vercel' },
						{ label: 'Custom domain', slug: 'deploy/custom-domain' },
						{ label: 'Production hardening', slug: 'deploy/production-hardening' },
					],
				},
				{
					label: 'Reference',
					items: [
						{ label: 'Data shapes', slug: 'reference/data-shapes' },
						{ label: 'API routes (planned)', slug: 'reference/api-routes' },
						{ label: 'Skin definition format', slug: 'reference/skin-definition' },
						{ label: 'Glossary', slug: 'reference/glossary' },
					],
				},
			],
		}),
	],
});
