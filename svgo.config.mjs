export default {
  multipass: true,
  plugins: [
    {
      name: 'preset-default',
    },

    // Базовая очистка SVG без агрессивных преобразований.
    'removeComments',
    'removeDoctype',
    'removeMetadata',
    'removeEditorsNSData',
    'removeEmptyAttrs',
    'removeHiddenElems',
    'removeEmptyText',
    'removeEmptyContainers',
    'removeUnusedNS',
    'removeUselessDefs',
    'cleanupIds',
  ],
};