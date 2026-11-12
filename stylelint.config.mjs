/** @type {import('stylelint').Config} */
export default {
  extends: ['stylelint-config-standard', 'stylelint-config-html/astro'],
  ignoreFiles: ['dist/**', '.astro/**'],
  rules: {
    // Astro's scoped <style> reaches slotted or child markup through :global().
    'selector-pseudo-class-no-unknown': [true, { ignorePseudoClasses: ['global'] }],
  },
};
