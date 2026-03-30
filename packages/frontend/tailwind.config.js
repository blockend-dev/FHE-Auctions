export default {
  theme: {
    extend: {
      colors: {
        brand: {
          purple: '#8b5cf6',
          cyan: '#22d3ee',
          pink: '#ec4899',
        },
      },
      animation: {
        float: 'float 10s ease-in-out infinite',
        shimmer: 'shimmer 1.5s linear infinite',
        glow: 'glow 2s ease-in-out infinite alternate',
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
        glow: '0 0 30px rgba(139,92,246,0.4)',
        'glow-cyan': '0 0 30px rgba(34,211,238,0.3)',
        'glow-sm': '0 0 12px rgba(139,92,246,0.3)',
      },
    },
  },
};