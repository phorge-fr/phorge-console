import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import extractorSvelte from '@unocss/extractor-svelte';
import UnoCSS from 'unocss/vite';
import { defineConfig } from 'vite';

// SvelteKit 3 reads its configuration here: there is no svelte.config.js.
export default defineConfig({
    plugins: [UnoCSS({ extractors: [extractorSvelte()] }), sveltekit({ adapter: adapter() })]
});
